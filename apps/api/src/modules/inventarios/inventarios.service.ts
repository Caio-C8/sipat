import {
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import type {
  CorrigirItemInventarioBodyData,
  CriarInventarioBodyData,
  FinalizarInventarioBodyData,
  IdentidadeAutenticada,
  ListarInventariosQueryData,
  ListarItensInventarioQueryData,
  ListarSetoresInventarioQueryData,
  VerificarItemInventarioBodyData,
} from "@repo/contracts";
import { Prisma } from "@repo/database";
import {
  calcularHashIdempotencia,
  construirConflitoIdempotencia,
} from "../../common/utils/idempotencia";
import { ComissoesService } from "../comissoes/comissoes.service";
import { InventarioPersistenceMapper } from "./mappers";
import { InventariosRepository } from "./inventarios.repository";
import type {
  ComProgresso,
  InventarioDetalhePayload,
  InventarioResumoPayload,
  ItemInventarioPayload,
  ProgressoInventarioPayload,
  ProgressoSetorPayload,
  ResultadoPaginado,
  SetorInventarioResumoPayload,
  VerificacaoItemResultado,
} from "./types";

@Injectable()
export class InventariosService {
  constructor(
    private readonly inventarios: InventariosRepository,
    private readonly comissoes: ComissoesService,
  ) {}

  async iniciarSetor(
    inventarioId: string,
    setorInventarioId: string,
    identidade: IdentidadeAutenticada,
  ): Promise<
    ComProgresso<SetorInventarioResumoPayload, ProgressoSetorPayload>
  > {
    return this.executarOperacao(async (repository) => {
      const inventario = await repository.bloquearInventario(inventarioId);
      if (inventario === null) throw this.inventarioNaoEncontrado();
      if (inventario.status === "FINALIZADO") throw this.inventarioFinalizado();

      const setor = await repository.bloquearSetorInventario(
        inventarioId,
        setorInventarioId,
      );
      if (setor === null) throw this.setorInventarioNaoEncontrado();
      if (setor.status !== "PENDENTE") {
        throw this.conflitoEstado(
          "SETOR_INVENTARIO_FORA_DE_ANDAMENTO",
          "Somente um setor pendente pode ser iniciado.",
        );
      }

      const instante = new Date();
      if (inventario.status === "PENDENTE") {
        await repository.iniciarInventario(
          inventarioId,
          new Date(`${instante.toISOString().slice(0, 10)}T00:00:00.000Z`),
          identidade.id,
        );
      }
      await repository.iniciarSetor(setorInventarioId, instante, identidade.id);
      return this.carregarSetorComProgresso(repository, setorInventarioId);
    });
  }

  async verificarItem(
    inventarioId: string,
    setorInventarioId: string,
    dados: VerificarItemInventarioBodyData,
    identidade: IdentidadeAutenticada,
  ): Promise<VerificacaoItemResultado> {
    return this.executarOperacao(async (repository) => {
      const inventario = await repository.bloquearInventario(inventarioId);
      if (inventario === null) throw this.inventarioNaoEncontrado();
      if (inventario.status === "FINALIZADO") throw this.inventarioFinalizado();

      const setor = await repository.bloquearSetorInventario(
        inventarioId,
        setorInventarioId,
      );
      if (setor === null) throw this.setorInventarioNaoEncontrado();
      if (setor.status !== "EM_ANDAMENTO") {
        throw this.conflitoEstado(
          "SETOR_INVENTARIO_FORA_DE_ANDAMENTO",
          "O setor informado não está em andamento.",
        );
      }

      const item = await repository.bloquearItemPorNumero(
        inventarioId,
        dados.numeroPatrimonial,
      );
      if (item === null) {
        throw new NotFoundException({
          codigo: "ITEM_INVENTARIO_NAO_ENCONTRADO",
          mensagem:
            "O patrimônio não pertence à população fixa deste inventário.",
          erros: [],
        });
      }

      if (item.statusVerificacao === "VERIFICADO") {
        if (
          item.situacao === "NAO_LOCALIZADO" &&
          item.setorEsperadoId !== setor.setorId &&
          item.patrimonioSetorAtualId === item.setorEsperadoId
        ) {
          const ultimaLocalizacao =
            await repository.bloquearUltimaLocalizacaoPosterior(item.id);
          if (ultimaLocalizacao?.setorEncontradoId === setor.setorId) {
            return {
              tipo: "LOCALIZACAO_POSTERIOR_IDEMPOTENTE",
              item: await this.exigirItem(repository, item.id),
            };
          }
          if (ultimaLocalizacao !== null) {
            throw this.conflitoEstado(
              "CORRECAO_ITEM_INVENTARIO_INCOMPATIVEL",
              "O patrimônio já possui uma localização posterior registrada neste inventário.",
            );
          }
          await repository.criarLocalizacaoPosterior({
            itemInventarioId: item.id,
            inventarioId,
            setorInventarioEncontradoId: setorInventarioId,
            instante: new Date(),
            usuarioId: identidade.id,
          });
          return {
            tipo: "LOCALIZACAO_POSTERIOR_REGISTRADA",
            item: await this.exigirItem(repository, item.id),
          };
        }

        const setorPrimeiraVerificacaoId =
          item.situacao === "DIVERGENCIA"
            ? item.setorEncontradoId!
            : item.setorEsperadoId;
        if (setorPrimeiraVerificacaoId === setor.setorId) {
          return {
            tipo: "LEITURA_IDEMPOTENTE",
            item: await this.exigirItem(repository, item.id),
          };
        }

        const [setorPrimeiraVerificacao, transferencia] = await Promise.all([
          repository.buscarSetorPorId(setorPrimeiraVerificacaoId),
          repository.buscarTransferenciaPosterior(
            item.patrimonioId,
            setor.setorId,
            item.dataVerificacao!,
          ),
        ]);
        if (setorPrimeiraVerificacao === null) {
          throw new Error("Setor da primeira verificação não encontrado.");
        }
        throw new ConflictException({
          codigo: "ITEM_INVENTARIO_JA_VERIFICADO",
          mensagem: "O patrimônio já foi verificado em outro setor.",
          erros: [],
          dados:
            transferencia === null
              ? {
                  itemInventarioId: item.id,
                  setorPrimeiraVerificacao,
                  verificadoEm: item.dataVerificacao!.toISOString(),
                  contextoLocalizacao: "MOVIMENTACAO_FISICA_SEM_HISTORICO",
                }
              : {
                  itemInventarioId: item.id,
                  setorPrimeiraVerificacao,
                  verificadoEm: item.dataVerificacao!.toISOString(),
                  contextoLocalizacao: "TRANSFERENCIA_POSTERIOR_REGISTRADA",
                  transferenciaId: transferencia.id,
                },
        });
      }

      if (item.patrimonioStatus === "BAIXADO") {
        throw this.conflitoEstado(
          "CORRECAO_ITEM_INVENTARIO_INCOMPATIVEL",
          "O patrimônio deixou de estar elegível durante o inventário.",
        );
      }
      const correto = item.setorEsperadoId === setor.setorId;
      await repository.verificarItem(item.id, {
        situacao: correto ? "CORRETO" : "DIVERGENCIA",
        setorEncontradoId: correto ? null : setor.setorId,
        statusPatrimonio: item.patrimonioStatus,
        instante: new Date(),
        usuarioId: identidade.id,
      });
      return {
        tipo: "CONFERENCIA_REGISTRADA",
        item: await this.exigirItem(repository, item.id),
      };
    });
  }

  async corrigirItem(
    inventarioId: string,
    itemInventarioId: string,
    dados: {
      tipoCorrecao: CorrigirItemInventarioBodyData["tipoCorrecao"];
      observacao?: string;
    },
    identidade: IdentidadeAutenticada,
  ): Promise<ItemInventarioPayload> {
    return this.executarOperacao(async (repository) => {
      const inventario = await repository.bloquearInventario(inventarioId);
      if (inventario === null) throw this.inventarioNaoEncontrado();
      if (inventario.status === "FINALIZADO") throw this.inventarioFinalizado();
      const item = await repository.bloquearItem(
        inventarioId,
        itemInventarioId,
      );
      if (item === null) throw this.itemInventarioNaoEncontrado();
      const localizacaoPosterior =
        item.situacao === "NAO_LOCALIZADO"
          ? await repository.bloquearUltimaLocalizacaoPosterior(item.id)
          : null;
      if (
        item.situacao === "NAO_LOCALIZADO" &&
        localizacaoPosterior?.statusCorrecao === "PENDENTE"
      ) {
        if (item.patrimonioSetorAtualId !== item.setorEsperadoId) {
          throw this.conflitoEstado(
            "CONFLITO_CONCORRENTE_INVENTARIO",
            "A localização cadastral do patrimônio mudou desde a verificação.",
          );
        }
        const instante = new Date();
        if (dados.tipoCorrecao === "RETORNO_AO_SETOR_CADASTRADO") {
          await repository.corrigirLocalizacaoPosteriorRetorno(
            localizacaoPosterior.id,
            instante,
            identidade.id,
            dados.observacao,
          );
        } else {
          await repository.corrigirLocalizacaoPosteriorComTransferencia({
            localizacaoPosteriorId: localizacaoPosterior.id,
            patrimonioId: item.patrimonioId,
            setorAntigoId: item.setorEsperadoId,
            setorAtualId: localizacaoPosterior.setorEncontradoId,
            comissaoId: inventario.comissaoId,
            usuarioId: identidade.id,
            instante,
            observacao: dados.observacao,
          });
        }
        return this.exigirItem(repository, item.id);
      }
      if (
        item.situacao !== "DIVERGENCIA" ||
        item.statusCorrecao !== "PENDENTE" ||
        item.setorEncontradoId === null
      ) {
        throw this.conflitoEstado(
          "CORRECAO_ITEM_INVENTARIO_INCOMPATIVEL",
          "O item não possui uma divergência pendente compatível com a correção.",
        );
      }
      if (item.patrimonioSetorAtualId !== item.setorEsperadoId) {
        throw this.conflitoEstado(
          "CONFLITO_CONCORRENTE_INVENTARIO",
          "A localização cadastral do patrimônio mudou desde a verificação.",
        );
      }

      const instante = new Date();
      if (dados.tipoCorrecao === "RETORNO_AO_SETOR_CADASTRADO") {
        await repository.corrigirRetorno(
          item.id,
          instante,
          identidade.id,
          dados.observacao,
        );
      } else {
        await repository.corrigirComTransferencia({
          itemInventarioId: item.id,
          patrimonioId: item.patrimonioId,
          setorAntigoId: item.setorEsperadoId,
          setorAtualId: item.setorEncontradoId,
          comissaoId: inventario.comissaoId,
          usuarioId: identidade.id,
          instante,
          observacao: dados.observacao,
        });
      }
      return this.exigirItem(repository, item.id);
    });
  }

  async concluirSetor(
    inventarioId: string,
    setorInventarioId: string,
    identidade: IdentidadeAutenticada,
  ): Promise<
    ComProgresso<SetorInventarioResumoPayload, ProgressoSetorPayload>
  > {
    return this.executarOperacao(async (repository) => {
      const inventario = await repository.bloquearInventario(inventarioId);
      if (inventario === null) throw this.inventarioNaoEncontrado();
      if (inventario.status === "FINALIZADO") throw this.inventarioFinalizado();
      const setor = await repository.bloquearSetorInventario(
        inventarioId,
        setorInventarioId,
      );
      if (setor === null) throw this.setorInventarioNaoEncontrado();
      if (setor.status !== "EM_ANDAMENTO") {
        throw this.conflitoEstado(
          "SETOR_INVENTARIO_FORA_DE_ANDAMENTO",
          "Somente um setor em andamento pode ser concluído.",
        );
      }
      const instante = new Date();
      if (
        (await repository.contarAusenciasSemJustificativaVigente(
          setorInventarioId,
          instante,
        )) > 0
      ) {
        throw this.conflitoEstado(
          "CORRECAO_ITEM_INVENTARIO_INCOMPATIVEL",
          "Existe patrimônio com estado operacional sem vínculo vigente compatível.",
        );
      }
      await repository.concluirItensPendentes(
        setorInventarioId,
        instante,
        identidade.id,
      );
      await repository.concluirSetor(
        setorInventarioId,
        instante,
        identidade.id,
      );
      return this.carregarSetorComProgresso(repository, setorInventarioId);
    });
  }

  async finalizar(
    inventarioId: string,
    dados: FinalizarInventarioBodyData,
    identidade: IdentidadeAutenticada,
  ): Promise<
    ComProgresso<InventarioDetalhePayload, ProgressoInventarioPayload>
  > {
    return this.executarOperacao(async (repository) => {
      const inventario = await repository.bloquearInventario(inventarioId);
      if (inventario === null) throw this.inventarioNaoEncontrado();
      if (inventario.status === "FINALIZADO") throw this.inventarioFinalizado();
      if (inventario.status !== "EM_ANDAMENTO") {
        throw this.conflitoEstado(
          "SETOR_INVENTARIO_FORA_DE_ANDAMENTO",
          "O inventário precisa estar em andamento para ser finalizado.",
        );
      }
      if ((await repository.contarSetoresNaoConcluidos(inventarioId)) > 0) {
        throw this.conflitoEstado(
          "OUTRO_SETOR_INVENTARIO_EM_ANDAMENTO",
          "Todos os setores precisam estar concluídos antes da finalização.",
        );
      }
      const correcoesPendentes =
        await repository.contarCorrecoesPendentes(inventarioId);
      if (correcoesPendentes > 0 && !dados.confirmarCorrecoesPendentes) {
        throw this.conflitoEstado(
          "CORRECAO_ITEM_INVENTARIO_INCOMPATIVEL",
          "Existem correções pendentes; confirme explicitamente a finalização nessas condições.",
        );
      }
      const instante = new Date();
      const finalizado = await repository.finalizarInventario(
        inventarioId,
        new Date(`${instante.toISOString().slice(0, 10)}T00:00:00.000Z`),
        identidade.id,
      );
      const progressos = await repository.obterProgressosInventarios([
        inventarioId,
      ]);
      return {
        ...finalizado,
        progresso: this.exigirProgresso(
          progressos.get(inventarioId),
          inventarioId,
        ),
      };
    });
  }

  async criar(
    dados: CriarInventarioBodyData,
    identidade: IdentidadeAutenticada,
  ): Promise<
    ComProgresso<InventarioDetalhePayload, ProgressoInventarioPayload>
  > {
    const dataOperacao = new Date().toISOString().slice(0, 10);
    await this.comissoes.consultarVigente(dados.comissaoId, dataOperacao);
    const { chaveIdempotencia, ...conteudo } = dados;
    const hashCriacao = calcularHashIdempotencia(conteudo);

    for (let tentativa = 1; tentativa <= 3; tentativa += 1) {
      try {
        return await this.inventarios.executarTransacao(async (repository) => {
          if (
            !(await repository.tentarBloquearChaveCriacao(
              identidade.id,
              chaveIdempotencia,
            ))
          )
            throw this.conflitoIdempotencia("OPERACAO_EM_PROCESSAMENTO");
          const anterior = await repository.buscarPorChaveCriacao(
            identidade.id,
            chaveIdempotencia,
          );
          if (anterior) {
            if (anterior.hashCriacao !== hashCriacao)
              throw this.conflitoIdempotencia("CHAVE_IDEMPOTENCIA_REUTILIZADA");
            throw this.conflitoIdempotencia("OPERACAO_JA_PROCESSADA");
          }
          const comissao = await repository.bloquearComissao(dados.comissaoId);
          const data = new Date(`${dataOperacao}T00:00:00.000Z`);
          if (
            comissao === null ||
            comissao.dataVigenciaInicio > data ||
            comissao.dataVigenciaFim < data
          ) {
            throw new ConflictException({
              codigo: "COMISSAO_FORA_DA_VIGENCIA",
              mensagem: "A comissão não está vigente na data da operação.",
              erros: [],
            });
          }

          const setores = await repository.bloquearSetoresAtivos();
          if (setores.length === 0) {
            throw new ConflictException({
              codigo: "INVENTARIO_SEM_SETOR_ATIVO",
              mensagem:
                "Não é possível criar um inventário sem ao menos um setor ativo.",
              erros: [],
            });
          }

          const patrimonios = await repository.bloquearPatrimoniosAtivos();
          const setoresAtivos = new Set(setores.map(({ id }) => id));
          if (
            patrimonios.some(
              ({ setorAtualId }) => !setoresAtivos.has(setorAtualId),
            )
          ) {
            throw new ConflictException({
              codigo: "PATRIMONIO_ATIVO_EM_SETOR_INATIVO",
              mensagem:
                "Existe patrimônio ativo vinculado a um setor inativo; corrija o cadastro antes de iniciar o inventário.",
              erros: [],
            });
          }

          const inventario = await repository.criarInventario({
            ...InventarioPersistenceMapper.paraCriacao(dados, identidade.id),
            chaveCriacao: chaveIdempotencia,
            hashCriacao,
          });
          const setoresCriados = await repository.criarSetores(
            inventario.id,
            setores,
          );
          await repository.criarItens(
            inventario.id,
            patrimonios,
            new Map(
              setoresCriados.map(({ setorId, id }) => [setorId, id] as const),
            ),
          );
          const progressos = await repository.obterProgressosInventarios([
            inventario.id,
          ]);
          return {
            ...inventario,
            progresso: this.exigirProgresso(
              progressos.get(inventario.id),
              inventario.id,
            ),
          };
        });
      } catch (erro: unknown) {
        if (this.ehConflitoSerializacao(erro) && tentativa < 3) continue;
        this.traduzirErroPersistencia(erro);
      }
    }
    throw this.conflitoConcorrente();
  }

  async listar(
    query: ListarInventariosQueryData,
  ): Promise<
    ResultadoPaginado<
      ComProgresso<InventarioResumoPayload, ProgressoInventarioPayload>
    >
  > {
    const where = InventarioPersistenceMapper.paraFiltroInventarios(query);
    const [items, total] = await Promise.all([
      this.inventarios.listarInventarios({
        where,
        skip: (query.pagina - 1) * query.limite,
        take: query.limite,
      }),
      this.inventarios.contarInventarios(where),
    ]);
    const progressos = await this.inventarios.obterProgressosInventarios(
      items.map(({ id }) => id),
    );
    return this.paginar(
      items.map((item) => ({
        ...item,
        progresso: this.exigirProgresso(progressos.get(item.id), item.id),
      })),
      total,
      query,
    );
  }

  async consultar(
    inventarioId: string,
  ): Promise<
    ComProgresso<InventarioDetalhePayload, ProgressoInventarioPayload>
  > {
    const inventario = await this.inventarios.buscarInventario(inventarioId);
    if (inventario === null) throw this.inventarioNaoEncontrado();
    const progressos = await this.inventarios.obterProgressosInventarios([
      inventarioId,
    ]);
    return {
      ...inventario,
      progresso: this.exigirProgresso(
        progressos.get(inventarioId),
        inventarioId,
      ),
    };
  }

  async listarSetores(
    inventarioId: string,
    query: ListarSetoresInventarioQueryData,
  ): Promise<
    ResultadoPaginado<
      ComProgresso<SetorInventarioResumoPayload, ProgressoSetorPayload>
    >
  > {
    await this.exigirInventario(inventarioId);
    const where = InventarioPersistenceMapper.paraFiltroSetores(query);
    const [items, total] = await Promise.all([
      this.inventarios.listarSetores(inventarioId, {
        where,
        skip: (query.pagina - 1) * query.limite,
        take: query.limite,
      }),
      this.inventarios.contarSetores(inventarioId, where),
    ]);
    const progressos = await this.inventarios.obterProgressosSetores(
      items.map(({ id }) => id),
    );
    return this.paginar(
      items.map((item) => ({
        ...item,
        progresso: this.exigirProgresso(progressos.get(item.id), item.id),
      })),
      total,
      query,
    );
  }

  async listarItens(
    inventarioId: string,
    query: ListarItensInventarioQueryData,
  ): Promise<ResultadoPaginado<ItemInventarioPayload>> {
    await this.exigirInventario(inventarioId);
    const where = InventarioPersistenceMapper.paraFiltroItens(query);
    const [items, total] = await Promise.all([
      this.inventarios.listarItens(inventarioId, {
        where,
        skip: (query.pagina - 1) * query.limite,
        take: query.limite,
      }),
      this.inventarios.contarItens(inventarioId, where),
    ]);
    return this.paginar(items, total, query);
  }

  private async exigirInventario(inventarioId: string): Promise<void> {
    if ((await this.inventarios.buscarInventario(inventarioId)) === null) {
      throw this.inventarioNaoEncontrado();
    }
  }

  private async executarOperacao<T>(
    operacao: (repository: InventariosRepository) => Promise<T>,
  ): Promise<T> {
    for (let tentativa = 1; tentativa <= 3; tentativa += 1) {
      try {
        return await this.inventarios.executarTransacao(operacao);
      } catch (erro: unknown) {
        if (this.ehConflitoSerializacao(erro) && tentativa < 3) continue;
        this.traduzirErroPersistencia(erro);
      }
    }
    throw this.conflitoConcorrente();
  }

  private async carregarSetorComProgresso(
    repository: InventariosRepository,
    setorInventarioId: string,
  ): Promise<
    ComProgresso<SetorInventarioResumoPayload, ProgressoSetorPayload>
  > {
    const setor = await repository.buscarSetorInventario(setorInventarioId);
    if (setor === null) throw this.setorInventarioNaoEncontrado();
    const progressos = await repository.obterProgressosSetores([
      setorInventarioId,
    ]);
    return {
      ...setor,
      progresso: this.exigirProgresso(
        progressos.get(setorInventarioId),
        setorInventarioId,
      ),
    };
  }

  private async exigirItem(
    repository: InventariosRepository,
    itemInventarioId: string,
  ): Promise<ItemInventarioPayload> {
    const item = await repository.buscarItem(itemInventarioId);
    if (item === null) throw this.itemInventarioNaoEncontrado();
    return item;
  }

  private paginar<T>(
    items: T[],
    total: number,
    query: { pagina: number; limite: number },
  ): ResultadoPaginado<T> {
    return {
      items,
      total,
      pagina: query.pagina,
      ultimaPagina: Math.max(1, Math.ceil(total / query.limite)),
      limite: query.limite,
    };
  }

  private exigirProgresso<T>(progresso: T | undefined, id: string): T {
    if (progresso === undefined) {
      throw new Error(`Agregados do inventário não encontrados para ${id}.`);
    }
    return progresso;
  }

  private traduzirErroPersistencia(erro: unknown): never {
    if (erro instanceof ConflictException) throw erro;
    if (this.ehErroPrisma(erro, "P2002")) {
      const alvo = JSON.stringify(
        (erro as Prisma.PrismaClientKnownRequestError).meta ?? {},
      );
      if (alvo.includes("setores_inventario")) {
        throw this.conflitoEstado(
          "OUTRO_SETOR_INVENTARIO_EM_ANDAMENTO",
          "Já existe uma conferência incompatível em andamento.",
        );
      }
      throw this.conflitoConcorrente();
    }
    if (this.ehConflitoSerializacao(erro)) {
      throw this.conflitoConcorrente();
    }
    throw erro;
  }

  private ehErroPrisma(erro: unknown, codigo: string): boolean {
    return (
      typeof erro === "object" &&
      erro !== null &&
      "code" in erro &&
      erro.code === codigo
    );
  }

  private ehConflitoSerializacao(erro: unknown): boolean {
    if (this.ehErroPrisma(erro, "P2034")) return true;
    if (!this.ehErroPrisma(erro, "P2010")) return false;
    const erroPrisma = erro as {
      meta?: { code?: unknown };
      message?: unknown;
    };
    return (
      erroPrisma.meta?.code === "40001" ||
      (typeof erroPrisma.message === "string" &&
        erroPrisma.message.includes("Code: `40001`"))
    );
  }

  private inventarioNaoEncontrado(): NotFoundException {
    return new NotFoundException({
      codigo: "INVENTARIO_NAO_ENCONTRADO",
      mensagem: "O inventário informado não foi encontrado.",
      erros: [],
    });
  }

  private setorInventarioNaoEncontrado(): NotFoundException {
    return new NotFoundException({
      codigo: "SETOR_INVENTARIO_NAO_ENCONTRADO",
      mensagem: "O setor informado não pertence ao inventário.",
      erros: [],
    });
  }

  private itemInventarioNaoEncontrado(): NotFoundException {
    return new NotFoundException({
      codigo: "ITEM_INVENTARIO_NAO_ENCONTRADO",
      mensagem: "O item informado não pertence ao inventário.",
      erros: [],
    });
  }

  private inventarioFinalizado(): ConflictException {
    return this.conflitoEstado(
      "INVENTARIO_FINALIZADO",
      "O inventário finalizado é imutável.",
    );
  }

  private conflitoEstado(codigo: string, mensagem: string): ConflictException {
    return new ConflictException({ codigo, mensagem, erros: [] });
  }

  private conflitoIdempotencia(
    codigo:
      | "OPERACAO_JA_PROCESSADA"
      | "CHAVE_IDEMPOTENCIA_REUTILIZADA"
      | "OPERACAO_EM_PROCESSAMENTO",
  ): ConflictException {
    return new ConflictException(construirConflitoIdempotencia(codigo));
  }

  private conflitoConcorrente(): ConflictException {
    return new ConflictException({
      codigo: "CONFLITO_CONCORRENTE_INVENTARIO",
      mensagem:
        "O inventário não pôde ser persistido devido a uma alteração concorrente.",
      erros: [],
    });
  }
}
