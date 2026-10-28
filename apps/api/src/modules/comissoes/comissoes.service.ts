import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import type {
  AdicionarMembroComissaoBodyData,
  AlterarComissaoBodyData,
  AlterarMembroComissaoBodyData,
  CriarComissaoBodyData,
  IdentidadeAutenticada,
  ListarComissoesQueryData,
} from "@repo/contracts";
import { LIMITE_MEMBROS_COMISSAO } from "@repo/contracts";
import { Prisma } from "@repo/database";
import { ComissaoPersistenceMapper } from "./mappers";
import { ComissoesRepository } from "./comissoes.repository";
import type {
  ComissaoDetalhePayload,
  ListarComissoesResultado,
  MembroComissaoPayload,
} from "./types";

@Injectable()
export class ComissoesService {
  constructor(private readonly comissoes: ComissoesRepository) {}

  async criar(
    dados: CriarComissaoBodyData,
    identidade: IdentidadeAutenticada,
  ): Promise<ComissaoDetalhePayload> {
    try {
      return await this.comissoes.executarTransacao(async (repository) => {
        await this.validarResponsaveisAtivos(
          repository,
          dados.membros.map(({ responsavelId }) => responsavelId),
        );

        return repository.criar(
          ComissaoPersistenceMapper.paraCriacao(dados, identidade.id),
        );
      });
    } catch (erro: unknown) {
      this.traduzirErroPersistencia(erro);
    }
  }

  async listar(
    query: ListarComissoesQueryData,
  ): Promise<ListarComissoesResultado> {
    const where = ComissaoPersistenceMapper.paraFiltro(query);
    const skip = (query.pagina - 1) * query.limite;
    const [items, total] = await Promise.all([
      this.comissoes.listar({ where, skip, take: query.limite }),
      this.comissoes.contar(where),
    ]);

    return {
      items,
      total,
      pagina: query.pagina,
      ultimaPagina: Math.max(1, Math.ceil(total / query.limite)),
      limite: query.limite,
    };
  }

  async consultar(comissaoId: string): Promise<ComissaoDetalhePayload> {
    const comissao = await this.comissoes.buscarPorId(comissaoId);
    if (comissao === null) throw this.comissaoNaoEncontrada();
    return comissao;
  }

  async consultarVigente(
    comissaoId: string,
    dataReferencia: string,
  ): Promise<ComissaoDetalhePayload> {
    const data = ComissaoPersistenceMapper.paraDataCivil(dataReferencia);
    const comissao = await this.comissoes.buscarVigente(comissaoId, data);
    if (comissao !== null) return comissao;

    if ((await this.comissoes.buscarPorId(comissaoId)) === null) {
      throw this.comissaoNaoEncontrada();
    }

    throw new ConflictException({
      codigo: "COMISSAO_FORA_DA_VIGENCIA",
      mensagem: "A comissão não está vigente na data informada.",
      erros: [],
    });
  }

  validarVigenciaBloqueada(
    comissao: {
      dataVigenciaInicio: Date;
      dataVigenciaFim: Date;
    } | null,
    dataReferencia: Date,
    codigo = "COMISSAO_FORA_DA_VIGENCIA",
  ): void {
    if (comissao === null) {
      throw new NotFoundException({
        codigo: "COMISSAO_NAO_ENCONTRADA",
        mensagem: "A comissão informada não foi encontrada.",
        erros: [],
      });
    }
    if (
      comissao.dataVigenciaInicio > dataReferencia ||
      comissao.dataVigenciaFim < dataReferencia
    ) {
      throw new ConflictException({
        codigo,
        mensagem: "A comissão não está vigente na data do processamento.",
        erros: [],
      });
    }
  }

  async alterar(
    comissaoId: string,
    dados: AlterarComissaoBodyData,
  ): Promise<ComissaoDetalhePayload> {
    try {
      return await this.comissoes.executarTransacao(async (repository) => {
        const atual = await this.obterBloqueada(repository, comissaoId);
        this.validarAlteracaoPermitida(atual, dados);
        this.validarPeriodoResultante(atual, dados);

        return repository.alterar(
          comissaoId,
          ComissaoPersistenceMapper.paraAtualizacao(dados),
        );
      });
    } catch (erro: unknown) {
      this.traduzirErroPersistencia(erro);
    }
  }

  async adicionarMembro(
    comissaoId: string,
    dados: AdicionarMembroComissaoBodyData,
  ): Promise<MembroComissaoPayload> {
    try {
      return await this.comissoes.executarTransacao(async (repository) => {
        const comissao = await this.obterBloqueada(repository, comissaoId);
        this.rejeitarSeUtilizada(comissao);

        if (
          (await repository.contarMembros(comissaoId)) >=
          LIMITE_MEMBROS_COMISSAO
        ) {
          throw new ConflictException({
            codigo: "LIMITE_MEMBROS_COMISSAO_EXCEDIDO",
            mensagem: `A comissão deve possuir no máximo ${LIMITE_MEMBROS_COMISSAO} integrantes.`,
            erros: [],
          });
        }

        await this.validarResponsaveisAtivos(repository, [dados.responsavelId]);
        return repository.adicionarMembro({
          comissaoId,
          responsavelId: dados.responsavelId,
          tipoMembroComissao: dados.papel,
        });
      });
    } catch (erro: unknown) {
      this.traduzirErroPersistencia(erro);
    }
  }

  async alterarMembro(
    comissaoId: string,
    membroComissaoId: string,
    dados: AlterarMembroComissaoBodyData,
  ): Promise<MembroComissaoPayload> {
    try {
      return await this.comissoes.executarTransacao(async (repository) => {
        const comissao = await this.obterBloqueada(repository, comissaoId);
        this.rejeitarSeUtilizada(comissao);
        const membro = await repository.buscarMembro(
          comissaoId,
          membroComissaoId,
        );
        if (membro === null) throw this.membroNaoEncontrado();

        await this.validarResponsaveisAtivos(repository, [
          membro.responsavel.id,
        ]);
        if (membro.tipoMembroComissao === dados.papel) return membro;
        return repository.alterarMembro(membroComissaoId, dados.papel);
      });
    } catch (erro: unknown) {
      this.traduzirErroPersistencia(erro);
    }
  }

  async removerMembro(
    comissaoId: string,
    membroComissaoId: string,
  ): Promise<void> {
    try {
      await this.comissoes.executarTransacao(async (repository) => {
        const comissao = await this.obterBloqueada(repository, comissaoId);
        this.rejeitarSeUtilizada(comissao);
        const membro = await repository.buscarMembro(
          comissaoId,
          membroComissaoId,
        );
        if (membro === null) throw this.membroNaoEncontrado();
        await repository.removerMembro(membroComissaoId);
      });
    } catch (erro: unknown) {
      this.traduzirErroPersistencia(erro);
    }
  }

  private async obterBloqueada(
    repository: ComissoesRepository,
    comissaoId: string,
  ): Promise<ComissaoDetalhePayload> {
    if (!(await repository.bloquearComissao(comissaoId))) {
      throw this.comissaoNaoEncontrada();
    }
    const comissao = await repository.buscarPorId(comissaoId);
    if (comissao === null) throw this.comissaoNaoEncontrada();
    return comissao;
  }

  private async validarResponsaveisAtivos(
    repository: ComissoesRepository,
    ids: readonly string[],
  ): Promise<void> {
    const encontrados = await repository.bloquearResponsaveis(ids);
    const inexistente = ids.find((id) => !encontrados.has(id));
    if (inexistente !== undefined) {
      throw new NotFoundException({
        codigo: "RESPONSAVEL_NAO_ENCONTRADO",
        mensagem: "Um responsável informado não foi encontrado.",
        erros: [],
      });
    }

    if (ids.some((id) => encontrados.get(id) === false)) {
      throw new ConflictException({
        codigo: "RESPONSAVEL_INATIVO",
        mensagem: "Um responsável informado está inativo.",
        erros: [],
      });
    }
  }

  private validarAlteracaoPermitida(
    atual: ComissaoDetalhePayload,
    dados: AlterarComissaoBodyData,
  ): void {
    if (
      this.foiUtilizada(atual) &&
      (dados.numeroAto !== undefined ||
        dados.dataVigenciaInicio !== undefined ||
        dados.dataVigenciaFim !== undefined)
    ) {
      throw this.comissaoJaUtilizada();
    }
  }

  private validarPeriodoResultante(
    atual: ComissaoDetalhePayload,
    dados: AlterarComissaoBodyData,
  ): void {
    const inicio =
      dados.dataVigenciaInicio === undefined
        ? atual.dataVigenciaInicio
        : ComissaoPersistenceMapper.paraDataCivil(dados.dataVigenciaInicio);
    const fim =
      dados.dataVigenciaFim === undefined
        ? atual.dataVigenciaFim
        : ComissaoPersistenceMapper.paraDataCivil(dados.dataVigenciaFim);

    if (fim < inicio) {
      throw new BadRequestException({
        codigo: "PERIODO_VIGENCIA_INVALIDO",
        mensagem: "A data final da vigência não pode ser anterior à inicial.",
        erros: [
          {
            campo: "dataVigenciaFim",
            codigo: "REGRA_INVALIDA",
            mensagem:
              "A data final da vigência não pode ser anterior à data inicial.",
          },
        ],
      });
    }
  }

  private rejeitarSeUtilizada(comissao: ComissaoDetalhePayload): void {
    if (this.foiUtilizada(comissao)) throw this.comissaoJaUtilizada();
  }

  private foiUtilizada(comissao: ComissaoDetalhePayload): boolean {
    return Object.values(comissao._count).some((quantidade) => quantidade > 0);
  }

  private traduzirErroPersistencia(erro: unknown): never {
    if (
      erro instanceof BadRequestException ||
      erro instanceof ConflictException ||
      erro instanceof NotFoundException
    ) {
      throw erro;
    }
    if (this.ehErroPrisma(erro, "P2002")) {
      const meta = JSON.stringify(erro.meta ?? {});
      if (meta.includes("membros_comissao_presidente_unico_idx")) {
        throw new ConflictException({
          codigo: "PRESIDENTE_COMISSAO_JA_EXISTENTE",
          mensagem: "A comissão já possui um presidente.",
          erros: [],
        });
      }
      throw new ConflictException({
        codigo: "RESPONSAVEL_JA_INTEGRA_COMISSAO",
        mensagem: "O responsável já integra esta comissão.",
        erros: [],
      });
    }
    if (this.ehErroPrisma(erro, "P2025")) {
      throw this.comissaoNaoEncontrada();
    }
    throw erro;
  }

  private ehErroPrisma(
    erro: unknown,
    codigo: string,
  ): erro is Prisma.PrismaClientKnownRequestError {
    return (
      erro instanceof Prisma.PrismaClientKnownRequestError &&
      erro.code === codigo
    );
  }

  private comissaoNaoEncontrada(): NotFoundException {
    return new NotFoundException({
      codigo: "COMISSAO_NAO_ENCONTRADA",
      mensagem: "A comissão informada não foi encontrada.",
      erros: [],
    });
  }

  private membroNaoEncontrado(): NotFoundException {
    return new NotFoundException({
      codigo: "MEMBRO_COMISSAO_NAO_ENCONTRADO",
      mensagem: "O integrante informado não pertence à comissão.",
      erros: [],
    });
  }

  private comissaoJaUtilizada(): ConflictException {
    return new ConflictException({
      codigo: "COMISSAO_JA_UTILIZADA",
      mensagem:
        "A comissão já possui uso patrimonial e sua vigência, ato e composição não podem ser alterados.",
      erros: [],
    });
  }

  bloquearParaMovimentacao(id: string, tx: Prisma.TransactionClient) {
    return this.comissoes.bloquearParaMovimentacao(id, tx);
  }
  async listarOpcoesMovimentacao(
    busca: string | undefined,
    dia: Date | undefined,
    skip: number,
    take: number,
  ) {
    const where: Prisma.ComissaoWhereInput = {
      ...(busca ? { nome: { contains: busca, mode: "insensitive" } } : {}),
      ...(dia
        ? { dataVigenciaInicio: { lte: dia }, dataVigenciaFim: { gte: dia } }
        : {}),
    };
    const [items, total] = await Promise.all([
      this.comissoes.listarOpcoesMovimentacao(where, skip, take),
      this.comissoes.contar(where),
    ]);
    return { items, total };
  }
}
