import { randomUUID } from "node:crypto";
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import type {
  CriarEmprestimoBodyData,
  CriarEmprestimoResponse,
  EmprestimoDetalhe,
  IdentidadeAutenticada,
  ListarEmprestimosQueryData,
  ListarOpcoesComissoesEmprestimoQueryData,
  ListarOpcoesPatrimoniosEmprestimoQueryData,
  RegistrarDevolucaoEmprestimoBodyData,
  RegistrarDevolucaoEmprestimoResponse,
} from "@repo/contracts";
import { Prisma } from "@repo/database";
import { diaSaoPaulo } from "../../common/utils/datas-institucionais";
import {
  calcularHashIdempotencia,
  construirConflitoIdempotencia,
} from "../../common/utils/idempotencia";
import { ComissoesService } from "../comissoes/comissoes.service";
import { InventariosPolicyService } from "../inventarios/inventarios-policy.service";
import { PatrimoniosService } from "../patrimonios/patrimonios.service";
import { EmprestimoResponseMapper } from "./mappers/emprestimo-response.mapper";
import { EmprestimosRepository } from "./emprestimos.repository";

@Injectable()
export class EmprestimosService {
  constructor(
    private readonly emprestimos: EmprestimosRepository,
    private readonly patrimonios: PatrimoniosService,
    private readonly comissoes: ComissoesService,
    private readonly inventarios: InventariosPolicyService,
  ) {}

  async listar(query: ListarEmprestimosQueryData) {
    const { items, total } = await this.emprestimos.listar(
      query,
      diaSaoPaulo(new Date()),
    );
    return this.pagina(
      items.map(EmprestimoResponseMapper.paraResumo),
      total,
      query,
    );
  }
  async consultar(id: string): Promise<EmprestimoDetalhe> {
    const registros = await this.emprestimos.buscarGrupo(id);
    if (!registros.length) throw this.naoEncontrado();
    return EmprestimoResponseMapper.paraDetalhe(registros);
  }
  async listarPatrimonios(query: ListarOpcoesPatrimoniosEmprestimoQueryData) {
    const { items, total } = await this.emprestimos.listarPatrimonios(
      query.busca,
      (query.pagina - 1) * query.limite,
      query.limite,
    );
    return this.pagina(
      items.map((p) => ({
        id: p.id,
        numeroPatrimonio: p.numeroPatrimonio,
        descricao: p.descricao,
        setor: p.setorAtual,
        status: "ATIVO" as const,
      })),
      total,
      query,
    );
  }
  async listarComissoes(query: ListarOpcoesComissoesEmprestimoQueryData) {
    const dia = new Date(`${query.dataReferencia}T00:00:00.000Z`);
    const { items, total } = await this.comissoes.listarOpcoesMovimentacao(
      query.busca,
      dia,
      (query.pagina - 1) * query.limite,
      query.limite,
    );
    return this.pagina(
      items.map((c) => ({
        id: c.id,
        nome: c.nome,
        dataVigenciaInicio: c.dataVigenciaInicio.toISOString().slice(0, 10),
        dataVigenciaFim: c.dataVigenciaFim.toISOString().slice(0, 10),
      })),
      total,
      query,
    );
  }

  async criar(
    dados: CriarEmprestimoBodyData,
    identidade: IdentidadeAutenticada,
  ): Promise<CriarEmprestimoResponse> {
    this.exigirDiretor(identidade);
    this.exigirNaoFutura(dados.dataEmprestimo, "dataEmprestimo");
    const hash = calcularHashIdempotencia({
      tipo: "SAIDA",
      ...dados,
      chaveIdempotencia: undefined,
      patrimonioIds: [...dados.patrimonioIds].sort(),
    });
    for (let tentativa = 0; tentativa < 3; tentativa++) {
      try {
        return await this.emprestimos.executarTransacao(
          async (repository, tx) => {
            await this.exigirChaveLivre(
              repository,
              identidade.id,
              dados.chaveIdempotencia,
            );
            const anterior = await repository.buscarIdempotencia(
              identidade.id,
              dados.chaveIdempotencia,
            );
            if (anterior) return this.recuperarCriacao(anterior, hash);

            const setoresAntes = await repository.buscarSetoresPatrimonios(
              dados.patrimonioIds,
            );
            if (setoresAntes.length !== dados.patrimonioIds.length)
              throw this.conflito(
                "PATRIMONIO_NAO_ENCONTRADO",
                "Um patrimônio não foi encontrado.",
                "patrimonioIds",
              );
            const ids = [...dados.patrimonioIds].sort();
            const setores = [
              ...new Set(setoresAntes.map((p) => p.setorAtualId)),
            ].sort();
            await this.inventarios.coordenarManutencao(ids, setores, tx);
            const comissao = await this.comissoes.bloquearParaMovimentacao(
              dados.comissaoId,
              tx,
            );
            this.exigirComissao(comissao, dados.dataEmprestimo);
            const bens = await this.patrimonios.bloquearParaMovimentacao(
              ids,
              tx,
            );
            const agora = new Date();
            this.exigirNaoFutura(dados.dataEmprestimo, "dataEmprestimo", agora);
            for (const [indice, id] of dados.patrimonioIds.entries()) {
              const bem = bens.find((item) => item.id === id);
              if (!bem)
                throw this.conflito(
                  "PATRIMONIO_NAO_ENCONTRADO",
                  "Patrimônio não encontrado.",
                  `patrimonioIds.${indice}`,
                );
              if (bem.status !== "ATIVO")
                throw this.conflito(
                  "PATRIMONIO_NAO_ATIVO",
                  "Somente bens ativos podem ser emprestados.",
                  `patrimonioIds.${indice}`,
                );
              if (
                bem.setorAtualId !==
                setoresAntes.find((item) => item.id === id)?.setorAtualId
              )
                throw this.conflito(
                  "CONFLITO_CONCORRENTE_EMPRESTIMO",
                  "O setor de um bem mudou. Atualize a seleção.",
                  `patrimonioIds.${indice}`,
                );
              if (
                await repository.existeEventoNaOuAposData(
                  id,
                  dados.dataEmprestimo,
                )
              )
                throw this.conflito(
                  "CRONOLOGIA_PATRIMONIAL_CONFLITANTE",
                  "A data contradiz evento patrimonial ou conferência já registrada.",
                  `patrimonioIds.${indice}`,
                );
            }
            const dataEmprestimo = new Date(
              `${dados.dataEmprestimo}T00:00:00.000Z`,
            );
            const dataPrevistaDevolucao = new Date(
              `${dados.dataPrevistaDevolucao}T00:00:00.000Z`,
            );
            const grupoId = randomUUID();
            const grupos: string[] = [];
            for (const id of dados.patrimonioIds) {
              const registroId = randomUUID();
              const chaveGrupo =
                dados.modoAgrupamento === "EM_GRUPO" ? grupoId : registroId;
              const bem = bens.find((item) => item.id === id)!;
              const atualizado =
                await this.patrimonios.atualizarStatusEmprestimo(
                  id,
                  "ATIVO",
                  "EMPRESTADO",
                  agora,
                  tx,
                );
              if (atualizado.count !== 1)
                throw this.conflito(
                  "CONFLITO_CONCORRENTE_EMPRESTIMO",
                  "O estado do bem mudou.",
                  "patrimonioIds",
                );
              await repository.criar({
                id: registroId,
                grupoEmprestimoId: chaveGrupo,
                modoAgrupamento: dados.modoAgrupamento,
                patrimonioId: id,
                setorVinculoId: bem.setorAtualId,
                comissaoId: dados.comissaoId,
                createdById: identidade.id,
                dataEmprestimo,
                dataPrevistaDevolucao,
                destinatario: dados.destinatario,
                finalidade: dados.finalidade,
                observacao: dados.observacao,
                createdAt: agora,
              });
              if (!grupos.includes(chaveGrupo)) grupos.push(chaveGrupo);
            }
            const detalhes: EmprestimoDetalhe[] = [];
            for (const id of grupos)
              detalhes.push(
                EmprestimoResponseMapper.paraDetalhe(
                  await repository.buscarGrupo(id),
                  agora,
                ),
              );
            const resposta: CriarEmprestimoResponse = {
              status: 201,
              sucesso: true,
              mensagem: "Empréstimo registrado.",
              dados:
                dados.modoAgrupamento === "EM_GRUPO" ? detalhes[0]! : detalhes,
            };
            await repository.salvarIdempotencia({
              usuarioId: identidade.id,
              chave: dados.chaveIdempotencia,
              tipoOperacao: "SAIDA",
              payloadHash: hash,
            });
            return resposta;
          },
        );
      } catch (erro) {
        const resultado = await this.tratarConcorrencia(
          erro,
          identidade.id,
          dados.chaveIdempotencia,
          hash,
          "SAIDA",
          tentativa,
        );
        if (resultado === "REPETIR") continue;
        throw erro;
      }
    }
    throw this.conflito(
      "CONFLITO_CONCORRENTE_EMPRESTIMO",
      "Não foi possível confirmar agora.",
      "chaveIdempotencia",
    );
  }

  async devolver(
    grupoId: string,
    dados: RegistrarDevolucaoEmprestimoBodyData,
    identidade: IdentidadeAutenticada,
  ): Promise<RegistrarDevolucaoEmprestimoResponse> {
    this.exigirDiretor(identidade);
    this.exigirNaoFutura(dados.dataDevolucao, "dataDevolucao");
    const hash = calcularHashIdempotencia({
      tipo: "DEVOLUCAO",
      grupoId,
      ...dados,
      chaveIdempotencia: undefined,
      emprestimoIds: [...dados.emprestimoIds].sort(),
    });
    for (let tentativa = 0; tentativa < 3; tentativa++) {
      try {
        return await this.emprestimos.executarTransacao(
          async (repository, tx) => {
            await this.exigirChaveLivre(
              repository,
              identidade.id,
              dados.chaveIdempotencia,
            );
            const anterior = await repository.buscarIdempotencia(
              identidade.id,
              dados.chaveIdempotencia,
            );
            if (anterior) return this.recuperarDevolucao(anterior, hash);
            const iniciais = await repository.buscarGrupo(grupoId);
            if (!iniciais.length) throw this.naoEncontrado();
            const selecionados = dados.emprestimoIds.map((id, indice) => {
              const item = iniciais.find((registro) => registro.id === id);
              if (!item)
                throw this.conflito(
                  "EMPRESTIMO_INDIVIDUAL_FORA_GRUPO",
                  "O bem não pertence a este empréstimo.",
                  `emprestimoIds.${indice}`,
                );
              return item;
            });
            const idsPatrimonios = [
              ...new Set(selecionados.map((item) => item.patrimonioId)),
            ].sort();
            const setoresAtuais =
              await repository.buscarSetoresPatrimonios(idsPatrimonios);
            const setores = [
              ...new Set(setoresAtuais.map((item) => item.setorAtualId)),
            ].sort();
            await this.inventarios.coordenarManutencao(
              idsPatrimonios,
              setores,
              tx,
            );
            const comissao = await this.comissoes.bloquearParaMovimentacao(
              dados.comissaoId,
              tx,
            );
            this.exigirComissao(comissao, dados.dataDevolucao);
            const bens = await this.patrimonios.bloquearParaMovimentacao(
              idsPatrimonios,
              tx,
            );
            const agora = new Date();
            this.exigirNaoFutura(dados.dataDevolucao, "dataDevolucao", agora);
            const atuais = await repository.buscarGrupo(grupoId);
            for (const [indice, id] of dados.emprestimoIds.entries()) {
              const registro = atuais.find((item) => item.id === id);
              if (!registro)
                throw this.conflito(
                  "EMPRESTIMO_INDIVIDUAL_FORA_GRUPO",
                  "O bem não pertence a este empréstimo.",
                  `emprestimoIds.${indice}`,
                );
              if (registro.devolucao)
                throw this.conflito(
                  "EMPRESTIMO_JA_DEVOLVIDO",
                  "Este bem já foi devolvido.",
                  `emprestimoIds.${indice}`,
                );
              if (
                dados.dataDevolucao <
                registro.dataEmprestimo.toISOString().slice(0, 10)
              )
                throw this.entradaInvalida(
                  "A devolução não pode anteceder a saída.",
                  "dataDevolucao",
                );
              if (
                bens.find((b) => b.id === registro.patrimonioId)?.status !==
                "EMPRESTADO"
              )
                throw this.conflito(
                  "CONFLITO_CONCORRENTE_EMPRESTIMO",
                  "O estado do bem mudou.",
                  `emprestimoIds.${indice}`,
                );
              if (
                await repository.existeConferenciaVinculadaNaOuAposData(
                  id,
                  dados.dataDevolucao,
                )
              )
                throw this.conflito(
                  "CRONOLOGIA_PATRIMONIAL_CONFLITANTE",
                  "A data contradiz uma conferência que registrou o empréstimo.",
                  "dataDevolucao",
                );
            }
            const dataDevolucao = new Date(
              `${dados.dataDevolucao}T00:00:00.000Z`,
            );
            for (const registro of selecionados) {
              await repository.criarDevolucao({
                emprestimoId: registro.id,
                comissaoId: dados.comissaoId,
                createdById: identidade.id,
                dataDevolucao,
                observacao: dados.observacao,
                createdAt: agora,
              });
              const atualizado =
                await this.patrimonios.atualizarStatusEmprestimo(
                  registro.patrimonioId,
                  "EMPRESTADO",
                  "ATIVO",
                  agora,
                  tx,
                );
              if (atualizado.count !== 1)
                throw this.conflito(
                  "CONFLITO_CONCORRENTE_EMPRESTIMO",
                  "O estado do bem mudou.",
                  "emprestimoIds",
                );
            }
            const detalhe = EmprestimoResponseMapper.paraDetalhe(
              await repository.buscarGrupo(grupoId),
              agora,
            );
            const resposta: RegistrarDevolucaoEmprestimoResponse = {
              status: 201,
              sucesso: true,
              mensagem: "Devolução registrada.",
              dados: {
                devolvidos: detalhe.itens.filter((item) =>
                  dados.emprestimoIds.includes(item.id),
                ),
                emprestimo: detalhe,
              },
            };
            await repository.salvarIdempotencia({
              usuarioId: identidade.id,
              chave: dados.chaveIdempotencia,
              tipoOperacao: "DEVOLUCAO",
              payloadHash: hash,
            });
            return resposta;
          },
        );
      } catch (erro) {
        const resultado = await this.tratarConcorrencia(
          erro,
          identidade.id,
          dados.chaveIdempotencia,
          hash,
          "DEVOLUCAO",
          tentativa,
        );
        if (resultado === "REPETIR") continue;
        throw erro;
      }
    }
    throw this.conflito(
      "CONFLITO_CONCORRENTE_EMPRESTIMO",
      "Não foi possível confirmar agora.",
      "chaveIdempotencia",
    );
  }

  private exigirDiretor(identidade: IdentidadeAutenticada) {
    if (identidade.perfil !== "DIRETOR_PATRIMONIO")
      throw new ForbiddenException();
  }
  private exigirNaoFutura(data: string, campo: string, agora = new Date()) {
    if (data > diaSaoPaulo(agora))
      throw this.entradaInvalida("A data não pode ser futura.", campo);
  }
  private exigirComissao(
    comissao: { dataVigenciaInicio: Date; dataVigenciaFim: Date } | null,
    data: string,
  ) {
    if (!comissao)
      throw new NotFoundException({
        codigo: "COMISSAO_NAO_ENCONTRADA",
        mensagem: "Comissão não encontrada.",
        erros: [],
      });
    const dia = new Date(`${data}T00:00:00.000Z`);
    if (comissao.dataVigenciaInicio > dia || comissao.dataVigenciaFim < dia)
      throw this.conflito(
        "COMISSAO_FORA_DA_VIGENCIA",
        "A comissão não está vigente na data informada.",
        "comissaoId",
      );
  }
  private async exigirChaveLivre(
    repository: EmprestimosRepository,
    usuarioId: string,
    chave: string,
  ) {
    if (!(await repository.tentarBloquearChave(usuarioId, chave)))
      throw this.conflitoIdempotencia("OPERACAO_EM_PROCESSAMENTO");
  }
  private recuperarCriacao(
    anterior: {
      tipoOperacao: string;
      payloadHash: string;
    },
    hash: string,
  ): never {
    this.exigirHash(anterior, "SAIDA", hash);
    throw this.conflitoIdempotencia("OPERACAO_JA_PROCESSADA");
  }
  private recuperarDevolucao(
    anterior: {
      tipoOperacao: string;
      payloadHash: string;
    },
    hash: string,
  ): never {
    this.exigirHash(anterior, "DEVOLUCAO", hash);
    throw this.conflitoIdempotencia("OPERACAO_JA_PROCESSADA");
  }
  private exigirHash(
    anterior: { tipoOperacao: string; payloadHash: string },
    tipo: string,
    hash: string,
  ) {
    if (anterior.tipoOperacao !== tipo || anterior.payloadHash !== hash)
      throw this.conflitoIdempotencia("CHAVE_IDEMPOTENCIA_REUTILIZADA");
  }
  private async tratarConcorrencia(
    erro: unknown,
    usuarioId: string,
    chave: string,
    hash: string,
    tipo: string,
    tentativa: number,
  ): Promise<"REPETIR" | null> {
    if (
      !(erro instanceof Prisma.PrismaClientKnownRequestError) ||
      !(
        erro.code === "P2034" ||
        erro.code === "P2002" ||
        (erro.code === "P2010" &&
          ["40001", "40P01"].some(
            (codigo) =>
              erro.meta?.code === codigo || erro.message.includes(codigo),
          ))
      )
    )
      return null;
    const anterior = await this.emprestimos.buscarIdempotencia(
      usuarioId,
      chave,
    );
    if (anterior) {
      this.exigirHash(anterior, tipo, hash);
      throw this.conflitoIdempotencia("OPERACAO_JA_PROCESSADA");
    }
    if (tentativa < 2 && erro.code !== "P2002") return "REPETIR";
    throw this.conflito(
      "CONFLITO_CONCORRENTE_EMPRESTIMO",
      "Houve alteração concorrente. Confira os dados e reenvie.",
      "chaveIdempotencia",
    );
  }
  private conflito(codigo: string, mensagem: string, campo: string) {
    return new ConflictException({
      codigo,
      mensagem,
      erros: [{ campo, codigo, mensagem }],
    });
  }
  private conflitoIdempotencia(
    codigo:
      | "OPERACAO_JA_PROCESSADA"
      | "CHAVE_IDEMPOTENCIA_REUTILIZADA"
      | "OPERACAO_EM_PROCESSAMENTO",
  ) {
    return new ConflictException(construirConflitoIdempotencia(codigo));
  }
  private entradaInvalida(mensagem: string, campo: string) {
    return new BadRequestException({
      codigo: "VALIDACAO_ENTRADA_INVALIDA",
      mensagem,
      erros: [{ campo, codigo: "REGRA_DE_NEGOCIO_INVALIDA", mensagem }],
    });
  }
  private naoEncontrado() {
    return new NotFoundException({
      codigo: "EMPRESTIMO_NAO_ENCONTRADO",
      mensagem: "Empréstimo não encontrado.",
      erros: [],
    });
  }
  private pagina<T>(
    items: T[],
    total: number,
    query: { pagina: number; limite: number },
  ) {
    return {
      items,
      total,
      pagina: query.pagina,
      limite: query.limite,
      ultimaPagina: Math.max(1, Math.ceil(total / query.limite)),
    };
  }
}
