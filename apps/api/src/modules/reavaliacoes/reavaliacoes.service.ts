import { createHash } from "node:crypto";
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import {
  ReavaliacaoDetalheSchema,
  type ComissaoOpcaoReavaliacao,
  type CriarReavaliacaoBodyData,
  type ErroCampo,
  type IdentidadeAutenticada,
  type ListarOpcoesComissaoReavaliacaoQueryData,
  type ListarReavaliacoesQueryData,
  type PreviaReavaliacao,
  type PreviaReavaliacaoBodyData,
  type ReavaliacaoDetalhe,
} from "@repo/contracts";
import { Prisma } from "@repo/database";
import { diaSaoPaulo } from "../../common/utils/datas-institucionais";
import { ComissoesService } from "../comissoes/comissoes.service";
import { ReavaliacaoResponseMapper } from "./mappers/reavaliacao-response.mapper";
import { ReavaliacoesRepository } from "./reavaliacoes.repository";
import type { EstadoReavaliacao } from "./types";

type ComissaoEstado = {
  id: string;
  nome: string;
  dataVigenciaInicio: Date;
  dataVigenciaFim: Date;
};
type ItemPrevia = PreviaReavaliacao["itens"][number];

@Injectable()
export class ReavaliacoesService {
  constructor(
    private readonly reavaliacoes: ReavaliacoesRepository,
    private readonly comissoes: ComissoesService,
  ) {}

  async listar(query: ListarReavaliacoesQueryData) {
    const where: Prisma.ReavaliacaoPatrimonioWhereInput = {
      ...(query.patrimonioId ? { patrimonioId: query.patrimonioId } : {}),
      ...(query.comissaoId ? { comissaoId: query.comissaoId } : {}),
      ...(query.dataInicio || query.dataFim
        ? {
            dataReferencia: {
              ...(query.dataInicio
                ? { gte: this.dataCivil(query.dataInicio) }
                : {}),
              ...(query.dataFim ? { lte: this.dataCivil(query.dataFim) } : {}),
            },
          }
        : {}),
      ...(query.busca
        ? {
            OR: [
              { numeroPatrimonioSnapshot: { contains: query.busca } },
              {
                descricaoPatrimonioSnapshot: {
                  contains: query.busca,
                  mode: "insensitive",
                },
              },
            ],
          }
        : {}),
    };
    const [items, total] = await Promise.all([
      this.reavaliacoes.listar(
        where,
        (query.pagina - 1) * query.limite,
        query.limite,
      ),
      this.reavaliacoes.contar(where),
    ]);
    return {
      items: items.map(ReavaliacaoResponseMapper.paraResumo),
      total,
      pagina: query.pagina,
      limite: query.limite,
      ultimaPagina: Math.max(1, Math.ceil(total / query.limite)),
    };
  }

  async consultar(id: string): Promise<ReavaliacaoDetalhe> {
    const item = await this.reavaliacoes.consultar(id);
    if (!item) {
      throw new NotFoundException({
        codigo: "REAVALIACAO_NAO_ENCONTRADA",
        mensagem: "Reavaliação não encontrada.",
        erros: [],
      });
    }
    return ReavaliacaoResponseMapper.paraDetalhe(item);
  }

  async listarComissoes(
    query: ListarOpcoesComissaoReavaliacaoQueryData,
    identidade: IdentidadeAutenticada,
  ) {
    if (
      query.contexto === "REGISTRO" &&
      identidade.perfil !== "DIRETOR_PATRIMONIO"
    ) {
      throw new ForbiddenException();
    }
    const dia =
      query.contexto === "REGISTRO"
        ? this.dataCivil(query.dataReferencia ?? diaSaoPaulo(new Date()))
        : undefined;
    const { items, total } = await this.comissoes.listarOpcoesMovimentacao(
      query.busca,
      dia,
      (query.pagina - 1) * query.limite,
      query.limite,
    );
    return {
      items: items.map((item): ComissaoOpcaoReavaliacao => ({
        id: item.id,
        nome: item.nome,
        dataVigenciaInicio: item.dataVigenciaInicio.toISOString().slice(0, 10),
        dataVigenciaFim: item.dataVigenciaFim.toISOString().slice(0, 10),
      })),
      total,
      pagina: query.pagina,
      limite: query.limite,
      ultimaPagina: Math.max(1, Math.ceil(total / query.limite)),
    };
  }

  async previa(
    dados: PreviaReavaliacaoBodyData,
    identidade: IdentidadeAutenticada,
  ): Promise<PreviaReavaliacao> {
    this.exigirDiretor(identidade);
    this.validarDataReferencia(dados.dataReferencia);
    const comissao = await this.reavaliacoes.buscarComissao(dados.comissaoId);
    this.validarComissao(comissao, dados.dataReferencia);
    const competencia = this.competenciaAtual();
    const linhas = await this.reavaliacoes.consultarEstados(
      dados.itens.map((item) => item.patrimonioId),
      competencia,
    );
    return this.montarPrevia(dados, comissao!, linhas, competencia);
  }

  async criar(
    dados: CriarReavaliacaoBodyData,
    identidade: IdentidadeAutenticada,
  ): Promise<ReavaliacaoDetalhe[]> {
    this.exigirDiretor(identidade);
    const conteudo = {
      dataReferencia: dados.dataReferencia,
      comissaoId: dados.comissaoId,
      itens: dados.itens,
    };
    const hash = this.hash(conteudo);
    for (let tentativa = 0; tentativa < 3; tentativa++) {
      try {
        return await this.reavaliacoes.executarTransacao(async (repository) => {
          if (
            !(await repository.tentarBloquearChave(
              identidade.id,
              dados.chaveIdempotencia,
            ))
          ) {
            throw this.conflito(
              "CONFLITO_CONCORRENTE_REAVALIACAO",
              "Esta confirmação está em processamento; reenvie o mesmo pedido.",
            );
          }
          const anterior = await repository.buscarIdempotencia(
            identidade.id,
            dados.chaveIdempotencia,
          );
          if (anterior) {
            if (anterior.payloadHash !== hash) {
              throw this.conflito(
                "CHAVE_IDEMPOTENCIA_REUTILIZADA",
                "A chave já foi usada em outro pedido.",
              );
            }
            return ReavaliacaoDetalheSchema.array().parse(anterior.resultado);
          }
          this.validarDataReferencia(dados.dataReferencia);
          const comissao = await repository.bloquearComissao(dados.comissaoId);
          this.validarComissao(comissao, dados.dataReferencia);
          const ids = dados.itens.map((item) => item.patrimonioId).sort();
          await repository.bloquearEstados(ids);
          const competencia = this.competenciaAtual();
          const linhas = await repository.consultarEstados(ids, competencia);
          const previa = this.montarPrevia(
            conteudo,
            comissao!,
            linhas,
            competencia,
          );
          const erros = previa.itens.flatMap((item) => item.erros);
          if (erros.length) {
            throw new ConflictException({
              codigo: "REAVALIACAO_IMPEDIDA",
              mensagem:
                "Nenhuma reavaliação foi registrada. Revise os itens indicados.",
              erros,
            });
          }
          if (previa.versaoPrevia !== dados.versaoPrevia) {
            throw new ConflictException({
              codigo: "ESTADO_REAVALIACAO_ALTERADO",
              mensagem: "Os dados dos bens mudaram. Consulte uma nova prévia.",
              erros: dados.itens.map((_, indice) => ({
                campo: `itens.${indice}.patrimonioId`,
                codigo: "ESTADO_REAVALIACAO_ALTERADO",
                mensagem: "Confira novamente este patrimônio.",
              })),
            });
          }
          const instante = new Date();
          const dataReferencia = this.dataCivil(dados.dataReferencia);
          const detalhes: ReavaliacaoDetalhe[] = [];
          for (const item of previa.itens) {
            const bruto = new Prisma.Decimal(item.novo!.valorBrutoNovo);
            const residual = new Prisma.Decimal(item.novo!.valorResidualNovo);
            const linha = linhas.find(
              (candidato) => candidato.patrimonioId === item.patrimonioId,
            )!;
            const anterior = item.anterior;
            const brutoAnterior = linha.valorBrutoAtual!;
            const depreciacaoAnterior = linha.depreciacaoAcumuladaAtual!;
            const registro = await repository.criar({
              dataReavaliacao: instante,
              dataReferencia,
              valorLiquidoAnterior: brutoAnterior.minus(depreciacaoAnterior),
              valorBrutoAnterior: brutoAnterior,
              depreciacaoAcumuladaAnterior: depreciacaoAnterior,
              valorBaseAnterior: anterior
                ? new Prisma.Decimal(anterior.valorBaseAnterior)
                : null,
              percentualResidualAnterior:
                anterior?.percentualResidualAnterior ?? null,
              vidaUtilInicialAnteriorMeses:
                anterior?.vidaUtilInicialAnteriorMeses ?? null,
              quantidadeDepreciacoesAnteriores:
                anterior?.quantidadeDepreciacoesAnteriores ?? null,
              dataInicioAnterior: anterior ? linha.dataInicio : null,
              parametroAnteriorId: anterior?.parametroAnteriorId ?? null,
              valorReavaliado: bruto,
              valorBaseNovo: bruto,
              percentualResidualNovo: item.novo!.percentualResidualNovo,
              valorResidualAnterior: anterior
                ? new Prisma.Decimal(anterior.valorResidualAnterior)
                : null,
              valorResidualNovo: residual,
              vidaUtilRestanteAnteriorMeses:
                anterior?.vidaUtilRestanteAnteriorMeses ?? null,
              vidaUtilNovaMeses: item.novo!.vidaUtilNovaMeses,
              numeroPatrimonioSnapshot: item.patrimonio!.numeroPatrimonio,
              descricaoPatrimonioSnapshot: item.patrimonio!.descricao,
              nomeComissaoSnapshot: comissao!.nome,
              nomeAutorSnapshot: identidade.nome,
              patrimonioId: item.patrimonioId,
              comissaoId: comissao!.id,
              createdById: identidade.id,
              createdAt: instante,
            });
            if (anterior) {
              const encerrado = await repository.encerrarParametro(
                anterior.parametroAnteriorId,
                dataReferencia,
              );
              if (encerrado.count !== 1) {
                throw this.conflito(
                  "ESTADO_REAVALIACAO_ALTERADO",
                  "O parâmetro vigente mudou. Consulte uma nova prévia.",
                );
              }
            }
            await repository.criarParametro({
              metodo: "LINEAR",
              vidaUtilInicialMeses: item.novo!.vidaUtilNovaMeses,
              percentualResidual: item.novo!.percentualResidualNovo,
              valorResidual: residual,
              valorBaseInicial: bruto,
              dataInicio: dataReferencia,
              patrimonioId: item.patrimonioId,
              reavaliacaoId: registro.id,
            });
            await repository.atualizarSituacao(
              linha.situacaoContabilId!,
              bruto,
              instante,
            );
            const salvo = await repository.consultar(registro.id);
            if (!salvo) throw new Error("Reavaliação não persistida.");
            detalhes.push(ReavaliacaoResponseMapper.paraDetalhe(salvo));
          }
          await repository.salvarIdempotencia({
            usuarioId: identidade.id,
            chave: dados.chaveIdempotencia,
            payloadHash: hash,
            resultado: detalhes as unknown as Prisma.InputJsonValue,
          });
          return detalhes;
        });
      } catch (erro: unknown) {
        if (this.erroSerializacao(erro) && tentativa < 2) continue;
        if (this.erroSerializacao(erro) || this.erroPrisma(erro, "P2002")) {
          throw this.conflito(
            "CONFLITO_CONCORRENTE_REAVALIACAO",
            "A reavaliação concorreu com outra alteração. Consulte uma nova prévia.",
          );
        }
        throw erro;
      }
    }
    throw new Error("Tentativas de transação esgotadas.");
  }

  private montarPrevia(
    dados: PreviaReavaliacaoBodyData,
    comissao: ComissaoEstado,
    linhas: EstadoReavaliacao[],
    competencia: Date,
  ): PreviaReavaliacao {
    const itens = dados.itens.map((pedido, indice): ItemPrevia => {
      const linha = linhas.find(
        (candidato) => candidato.patrimonioId === pedido.patrimonioId,
      );
      const erros: ErroCampo[] = [];
      const erro = (campo: string, codigo: string, mensagem: string) =>
        erros.push({ campo: `itens.${indice}.${campo}`, codigo, mensagem });
      if (!linha) {
        erro(
          "patrimonioId",
          "PATRIMONIO_NAO_ENCONTRADO",
          "Patrimônio não encontrado.",
        );
      } else {
        if (linha.status === "BAIXADO") {
          erro(
            "patrimonioId",
            "PATRIMONIO_BAIXADO",
            "Patrimônio baixado não pode ser reavaliado.",
          );
        }
        if (
          !linha.situacaoContabilId ||
          !linha.valorBrutoAtual ||
          !linha.depreciacaoAcumuladaAtual ||
          !linha.valorBrutoAtual.isPositive() ||
          linha.depreciacaoAcumuladaAtual.isNegative() ||
          linha.depreciacaoAcumuladaAtual.greaterThan(linha.valorBrutoAtual)
        ) {
          erro(
            "patrimonioId",
            "ESTADO_CONTABIL_INCONSISTENTE",
            "Situação contábil inconsistente.",
          );
        } else if (
          linha.quantidadeParametrosTotal === 0n &&
          linha.quantidadeParametrosVigentes === 0n
        ) {
          if (!linha.depreciacaoAcumuladaAtual.isZero()) {
            erro(
              "patrimonioId",
              "ESTADO_CONTABIL_INCONSISTENTE",
              "Há depreciação acumulada sem parâmetro anterior.",
            );
          } else if (!pedido.definirPrimeiroParametro) {
            erro(
              "patrimonioId",
              "PRIMEIRO_PARAMETRO_NECESSARIO",
              "Este patrimônio foi cadastrado sem parâmetros de depreciação. A reavaliação exige um parâmetro. Deseja definir um agora?",
            );
          }
        } else if (pedido.definirPrimeiroParametro) {
          erro(
            "patrimonioId",
            "ESTADO_REAVALIACAO_ALTERADO",
            "O patrimônio já possui histórico de parâmetros. Consulte uma nova prévia.",
          );
        } else if (
          !linha.parametroDepreciacaoId ||
          linha.quantidadeParametrosVigentes !== 1n ||
          !linha.valorResidual ||
          !linha.valorBaseInicial ||
          !linha.vidaUtilInicialMeses ||
          !linha.dataInicio ||
          linha.metodo !== "LINEAR" ||
          linha.dataInicio > this.dataCivil(dados.dataReferencia)
        ) {
          erro(
            "patrimonioId",
            "ESTADO_CONTABIL_INCONSISTENTE",
            "Situação ou parâmetro contábil inconsistente.",
          );
        } else {
          const liquido = linha.valorBrutoAtual.minus(
            linha.depreciacaoAcumuladaAtual,
          );
          const restante =
            linha.vidaUtilInicialMeses - Number(linha.quantidadeRealizada);
          if (
            !linha.valorBrutoAtual.isPositive() ||
            linha.depreciacaoAcumuladaAtual.isNegative() ||
            linha.valorResidual.isNegative() ||
            linha.valorBaseInicial.isNegative() ||
            liquido.lessThan(linha.valorResidual) ||
            restante < 0 ||
            (restante === 0 && liquido.greaterThan(linha.valorResidual))
          ) {
            erro(
              "patrimonioId",
              "ESTADO_CONTABIL_INCONSISTENTE",
              "Valores contábeis inconsistentes.",
            );
          } else if (
            linha.dataInicio < competencia &&
            !linha.jaDepreciadoNaCompetencia &&
            liquido.greaterThan(linha.valorResidual)
          ) {
            erro(
              "patrimonioId",
              "DEPRECIACAO_CORRENTE_PENDENTE",
              "Deprecie este patrimônio na competência corrente antes de reavaliá-lo.",
            );
          }
        }
      }
      const novoBruto = new Prisma.Decimal(pedido.valorReavaliado);
      const percentual =
        pedido.residual.tipo === "PERCENTUAL"
          ? new Prisma.Decimal(pedido.residual.percentual)
          : null;
      const novoResidual =
        pedido.residual.tipo === "VALOR"
          ? new Prisma.Decimal(pedido.residual.valor)
          : novoBruto
              .mul(percentual!)
              .div(100)
              .toDecimalPlaces(7, Prisma.Decimal.ROUND_HALF_UP);
      if (novoResidual.greaterThan(novoBruto)) {
        erro(
          "residual",
          "VALOR_RESIDUAL_INVALIDO",
          "O residual não pode superar o novo valor bruto.",
        );
      }
      const anterior =
        linha &&
        linha.parametroDepreciacaoId &&
        linha.valorBrutoAtual &&
        linha.depreciacaoAcumuladaAtual &&
        linha.valorBaseInicial &&
        linha.valorResidual &&
        linha.vidaUtilInicialMeses
          ? {
              valorBrutoAnterior: linha.valorBrutoAtual.toFixed(7),
              depreciacaoAcumuladaAnterior:
                linha.depreciacaoAcumuladaAtual.toFixed(7),
              valorLiquidoAnterior: linha.valorBrutoAtual
                .minus(linha.depreciacaoAcumuladaAtual)
                .toFixed(7),
              valorBaseAnterior: linha.valorBaseInicial.toFixed(7),
              valorResidualAnterior: linha.valorResidual.toFixed(7),
              percentualResidualAnterior:
                linha.percentualResidual?.toFixed(2) ?? null,
              vidaUtilInicialAnteriorMeses: linha.vidaUtilInicialMeses,
              quantidadeDepreciacoesAnteriores: Number(
                linha.quantidadeRealizada,
              ),
              vidaUtilRestanteAnteriorMeses: Math.max(
                0,
                linha.vidaUtilInicialMeses - Number(linha.quantidadeRealizada),
              ),
              parametroAnteriorId: linha.parametroDepreciacaoId,
            }
          : null;
      const novo = {
        valorBrutoNovo: novoBruto.toFixed(7),
        valorBaseNova: novoBruto.toFixed(7),
        valorResidualNovo: novoResidual.toFixed(7),
        percentualResidualNovo: percentual?.toFixed(2) ?? null,
        vidaUtilNovaMeses: pedido.vidaUtilNovaMeses,
      };
      return {
        indice,
        patrimonioId: pedido.patrimonioId,
        elegivel: erros.length === 0,
        erros,
        patrimonio: linha
          ? {
              id: linha.patrimonioId,
              numeroPatrimonio: linha.numeroPatrimonio,
              descricao: linha.descricao,
            }
          : null,
        status: linha?.status ?? null,
        anterior,
        novo,
        quotaMensalInicialEstimada: novoBruto
          .minus(novoResidual)
          .dividedBy(pedido.vidaUtilNovaMeses)
          .toDecimalPlaces(7, Prisma.Decimal.ROUND_HALF_UP)
          .toFixed(7),
      };
    });
    const valido = itens.every((item) => item.elegivel);
    return {
      versaoPrevia: valido
        ? this.hash({
            dados,
            comissao,
            linhas: [...linhas].sort((a, b) =>
              a.patrimonioId.localeCompare(b.patrimonioId),
            ),
          })
        : null,
      itens,
    };
  }

  private validarComissao(comissao: ComissaoEstado | null, dia: string): void {
    if (!comissao) {
      throw new NotFoundException({
        codigo: "COMISSAO_NAO_ENCONTRADA",
        mensagem: "Comissão não encontrada.",
        erros: [],
      });
    }
    const data = this.dataCivil(dia);
    if (comissao.dataVigenciaInicio > data || comissao.dataVigenciaFim < data) {
      throw this.conflito(
        "COMISSAO_FORA_DA_VIGENCIA",
        "Comissão fora da vigência na data informada.",
      );
    }
  }

  private validarDataReferencia(data: string): void {
    const hoje = diaSaoPaulo(new Date());
    if (data < `${hoje.slice(0, 7)}-01` || data > hoje) {
      throw new BadRequestException({
        codigo: "DATA_REFERENCIA_FORA_PERIODO",
        mensagem:
          "A data de referência deve estar no mês corrente e não pode ser futura.",
        erros: [
          {
            campo: "dataReferencia",
            codigo: "DATA_REFERENCIA_FORA_PERIODO",
            mensagem:
              "Informe um dia do mês corrente até hoje, no calendário de São Paulo.",
          },
        ],
      });
    }
  }

  private competenciaAtual(): Date {
    return this.dataCivil(`${diaSaoPaulo(new Date()).slice(0, 7)}-01`);
  }

  private dataCivil(data: string): Date {
    return new Date(`${data}T00:00:00.000Z`);
  }

  private exigirDiretor(identidade: IdentidadeAutenticada): void {
    if (identidade.perfil !== "DIRETOR_PATRIMONIO")
      throw new ForbiddenException();
  }

  private hash(valor: unknown): string {
    return createHash("sha256")
      .update(
        JSON.stringify(valor, (_, item: unknown) =>
          typeof item === "bigint" ? item.toString() : item,
        ),
      )
      .digest("hex");
  }

  private conflito(codigo: string, mensagem: string): ConflictException {
    return new ConflictException({ codigo, mensagem, erros: [] });
  }

  private erroPrisma(erro: unknown, codigo: string): boolean {
    return (
      erro instanceof Prisma.PrismaClientKnownRequestError &&
      erro.code === codigo
    );
  }

  private erroSerializacao(erro: unknown): boolean {
    if (this.erroPrisma(erro, "P2034")) return true;
    if (typeof erro !== "object" || erro === null) return false;
    const prisma = erro as {
      code?: unknown;
      meta?: {
        code?: unknown;
        driverAdapterError?: { cause?: { originalCode?: unknown } };
      };
    };
    const codigoBanco =
      prisma.meta?.code ?? prisma.meta?.driverAdapterError?.cause?.originalCode;
    return (
      prisma.code === "P2010" &&
      (codigoBanco === "40001" || codigoBanco === "40P01")
    );
  }
}
