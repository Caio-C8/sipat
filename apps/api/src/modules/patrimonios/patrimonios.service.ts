import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from "@nestjs/common";
import type {
  CriarPatrimonioBodyData,
  IdentidadeAutenticada,
  ListarPatrimoniosQueryData,
  SubstituirNumeroPatrimonialBodyData,
} from "@repo/contracts";
import { Prisma } from "@repo/database";
import { PatrimonioPersistenceMapper } from "./mappers";
import { PatrimoniosRepository } from "./patrimonios.repository";
import type {
  ListarPatrimoniosResultado,
  PatrimonioDetalhePayload,
} from "./types";

@Injectable()
export class PatrimoniosService {
  constructor(private readonly patrimonios: PatrimoniosRepository) {}

  async criar(
    dados: CriarPatrimonioBodyData,
    identidade: IdentidadeAutenticada,
  ): Promise<PatrimonioDetalhePayload> {
    const normalizados = {
      ...dados,
      descricao: this.normalizarTexto(dados.descricao),
      marca: this.normalizarTextoOpcional(dados.marca),
      modelo: this.normalizarTextoOpcional(dados.modelo),
      numeroSerie: this.normalizarTextoOpcional(dados.numeroSerie),
    };

    this.validarParametrosDepreciacao(normalizados);

    try {
      return await this.patrimonios.executarTransacao(async (transacao) => {
        await this.validarRelacoes(transacao, normalizados);
        const tipo = normalizados.semNumeroOficial
          ? "SEM_NUMERO_OFICIAL"
          : "OFICIAL";
        const numero = await transacao.gerarProximoNumero(tipo);

        return transacao.criar(
          PatrimonioPersistenceMapper.paraCriacao(
            normalizados,
            numero,
            identidade.id,
          ),
        );
      });
    } catch (erro: unknown) {
      this.traduzirErroPersistencia(erro);
    }
  }

  async listar(
    query: ListarPatrimoniosQueryData,
  ): Promise<ListarPatrimoniosResultado> {
    const where = this.criarFiltro(query);
    const skip = (query.pagina - 1) * query.limite;
    const [items, total] = await Promise.all([
      this.patrimonios.listar({ where, skip, take: query.limite }),
      this.patrimonios.contar(where),
    ]);

    return {
      items,
      total,
      pagina: query.pagina,
      ultimaPagina: Math.max(1, Math.ceil(total / query.limite)),
      limite: query.limite,
    };
  }

  async consultar(patrimonioId: string): Promise<PatrimonioDetalhePayload> {
    const patrimonio = await this.patrimonios.buscarPorId(patrimonioId);

    if (patrimonio === null) {
      throw new NotFoundException({
        codigo: "PATRIMONIO_NAO_ENCONTRADO",
        mensagem: "O patrimônio informado não foi encontrado.",
        erros: [],
      });
    }

    return patrimonio;
  }

  async substituirNumero(
    patrimonioId: string,
    dados: SubstituirNumeroPatrimonialBodyData,
    identidade: IdentidadeAutenticada,
  ): Promise<PatrimonioDetalhePayload> {
    try {
      return await this.patrimonios.executarTransacao(async (transacao) => {
        const patrimonio = await transacao.buscarParaSubstituicao(patrimonioId);

        if (patrimonio === null) {
          throw this.patrimonioNaoEncontrado();
        }

        if (patrimonio.tipoNumeroPatrimonial !== "OFICIAL") {
          throw new ConflictException({
            codigo: "TIPO_NUMERO_PATRIMONIAL_NAO_ELEGIVEL",
            mensagem:
              "Somente patrimônios com número oficial podem ter o número substituído.",
            erros: [],
          });
        }

        if (patrimonio.numeroPatrimonio !== dados.numeroPatrimonioAtual) {
          throw this.numeroPatrimonialAtualDivergente();
        }

        const numeroNovo = await transacao.gerarProximoNumero("OFICIAL");
        const atualizado = await transacao.atualizarNumeroCondicional(
          patrimonio.id,
          dados.numeroPatrimonioAtual,
          numeroNovo,
        );

        if (!atualizado) {
          throw this.numeroPatrimonialAtualDivergente();
        }

        await transacao.criarHistoricoSubstituicao(
          patrimonio.id,
          dados.numeroPatrimonioAtual,
          numeroNovo,
          identidade.id,
        );

        const detalhe = await transacao.buscarPorId(patrimonio.id);
        if (detalhe === null) {
          throw new Error(
            "O patrimônio substituído não pôde ser relido na transação.",
          );
        }

        return detalhe;
      });
    } catch (erro: unknown) {
      if (this.ehErroPrisma(erro, "P2002")) {
        throw new ConflictException({
          codigo: "IDENTIFICADOR_PATRIMONIAL_CONFLITANTE",
          mensagem:
            "Não foi possível gerar um identificador patrimonial exclusivo.",
          erros: [],
        });
      }

      throw erro;
    }
  }

  private criarFiltro(
    query: ListarPatrimoniosQueryData,
  ): Prisma.PatrimonioWhereInput {
    return {
      ...(query.busca === undefined
        ? {}
        : { textoBusca: { contains: this.normalizarTexto(query.busca) } }),
      ...(query.status === undefined ? {} : { status: query.status }),
      ...(query.setorId === undefined ? {} : { setorAtualId: query.setorId }),
      ...(query.especieId === undefined ? {} : { especieId: query.especieId }),
      ...(query.naturezaId === undefined
        ? {}
        : { especie: { naturezaId: query.naturezaId } }),
      ...(query.tipoNumeroPatrimonial === undefined
        ? {}
        : { tipoNumeroPatrimonial: query.tipoNumeroPatrimonial }),
    };
  }

  private async validarRelacoes(
    repository: PatrimoniosRepository,
    dados: CriarPatrimonioBodyData,
  ): Promise<void> {
    const setor = await repository.buscarSetor(dados.setorAtualId);

    if (setor === null) {
      throw this.relacaoNaoEncontrada(
        "SETOR_NAO_ENCONTRADO",
        "setorAtualId",
        "O setor informado não foi encontrado.",
      );
    }

    if (!setor.ativo) {
      throw new ConflictException({
        codigo: "SETOR_INATIVO",
        mensagem: "O setor informado está inativo.",
        erros: [
          {
            campo: "setorAtualId",
            codigo: "RELACAO_INATIVA",
            mensagem: "Um setor inativo não pode receber patrimônios.",
          },
        ],
      });
    }

    if (!(await repository.especieExiste(dados.especieId))) {
      throw this.relacaoNaoEncontrada(
        "ESPECIE_NAO_ENCONTRADA",
        "especieId",
        "A espécie informada não foi encontrada.",
      );
    }

    if (
      dados.processoCompraId !== undefined &&
      !(await repository.processoCompraExiste(dados.processoCompraId))
    ) {
      throw this.relacaoNaoEncontrada(
        "PROCESSO_COMPRA_NAO_ENCONTRADO",
        "processoCompraId",
        "O processo de compra informado não foi encontrado.",
      );
    }
  }

  private validarParametrosDepreciacao(dados: CriarPatrimonioBodyData): void {
    const parametros = dados.parametrosDepreciacao;
    if (parametros === undefined) return;

    const valorIncorporacao = new Prisma.Decimal(dados.valorIncorporacao);
    const base = new Prisma.Decimal(parametros.valorBaseInicial);
    const residual = new Prisma.Decimal(parametros.valorResidual);

    if (base.greaterThan(valorIncorporacao)) {
      throw this.parametroInvalido(
        "parametrosDepreciacao.valorBaseInicial",
        "A base inicial não pode superar o valor de incorporação.",
      );
    }

    if (residual.greaterThan(base)) {
      throw this.parametroInvalido(
        "parametrosDepreciacao.valorResidual",
        "O valor residual não pode superar a base inicial.",
      );
    }

    if (parametros.percentualResidual !== undefined) {
      const percentual = new Prisma.Decimal(parametros.percentualResidual);
      if (percentual.greaterThan(100)) {
        throw this.parametroInvalido(
          "parametrosDepreciacao.percentualResidual",
          "O percentual residual não pode superar 100.",
        );
      }

      const residualCalculado = base.mul(percentual).div(100);
      if (!residual.equals(residualCalculado)) {
        throw this.parametroInvalido(
          "parametrosDepreciacao.valorResidual",
          "O valor residual deve corresponder ao percentual informado sobre a base inicial.",
        );
      }
    }
  }

  private normalizarTexto(valor: string): string {
    return valor.normalize("NFD").replace(/\p{M}/gu, "").toUpperCase();
  }

  private normalizarTextoOpcional(valor?: string): string | undefined {
    return valor === undefined ? undefined : this.normalizarTexto(valor);
  }

  private traduzirErroPersistencia(erro: unknown): never {
    if (this.ehErroPrisma(erro, "P2002")) {
      if (this.ehConflitoNumeroSerie(erro)) {
        throw new ConflictException({
          codigo: "NUMERO_SERIE_JA_EXISTENTE",
          mensagem: "Já existe um patrimônio com o número de série informado.",
          erros: [
            {
              campo: "numeroSerie",
              codigo: "VALOR_JA_EXISTENTE",
              mensagem: "Já existe um patrimônio com este número de série.",
            },
          ],
        });
      }

      throw new ConflictException({
        codigo: "IDENTIFICADOR_PATRIMONIAL_CONFLITANTE",
        mensagem:
          "Não foi possível gerar um identificador patrimonial exclusivo.",
        erros: [],
      });
    }

    if (this.ehErroPrisma(erro, "P2003") || this.ehErroPrisma(erro, "P2025")) {
      throw new ConflictException({
        codigo: "RELACAO_PATRIMONIAL_INVALIDA",
        mensagem:
          "Uma relação informada deixou de estar disponível durante o cadastro.",
        erros: [],
      });
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

  private ehConflitoNumeroSerie(
    erro: Prisma.PrismaClientKnownRequestError,
  ): boolean {
    const metadados = JSON.stringify(erro.meta ?? {}).toLowerCase();
    return (
      metadados.includes("numero_serie") || metadados.includes("numeroserie")
    );
  }

  private relacaoNaoEncontrada(
    codigo: string,
    campo: string,
    mensagem: string,
  ): NotFoundException {
    return new NotFoundException({
      codigo,
      mensagem,
      erros: [{ campo, codigo: "RELACAO_NAO_ENCONTRADA", mensagem }],
    });
  }

  private patrimonioNaoEncontrado(): NotFoundException {
    return new NotFoundException({
      codigo: "PATRIMONIO_NAO_ENCONTRADO",
      mensagem: "O patrimônio informado não foi encontrado.",
      erros: [],
    });
  }

  private numeroPatrimonialAtualDivergente(): ConflictException {
    return new ConflictException({
      codigo: "NUMERO_PATRIMONIAL_ATUAL_DIVERGENTE",
      mensagem:
        "O número patrimonial atual não corresponde mais ao patrimônio informado.",
      erros: [
        {
          campo: "numeroPatrimonioAtual",
          codigo: "PRECONDICAO_DIVERGENTE",
          mensagem:
            "Atualize os dados do patrimônio antes de tentar novamente.",
        },
      ],
    });
  }

  private parametroInvalido(
    campo: string,
    mensagem: string,
  ): UnprocessableEntityException {
    return new UnprocessableEntityException({
      codigo: "PARAMETROS_DEPRECIACAO_INVALIDOS",
      mensagem: "Os parâmetros iniciais de depreciação são inválidos.",
      erros: [{ campo, codigo: "REGRA_DE_NEGOCIO_INVALIDA", mensagem }],
    });
  }
}
