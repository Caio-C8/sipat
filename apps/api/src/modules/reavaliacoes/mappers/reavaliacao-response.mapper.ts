import type { ReavaliacaoDetalhe, ReavaliacaoResumo } from "@repo/contracts";
import type { ReavaliacaoPayload } from "../types";

const dataCivil = (data: Date | null) =>
  data?.toISOString().slice(0, 10) ?? null;
const decimal = (valor: { toFixed(casas: number): string }) => valor.toFixed(7);

export class ReavaliacaoResponseMapper {
  static paraResumo(item: ReavaliacaoPayload): ReavaliacaoResumo {
    return {
      id: item.id,
      dataReferencia: dataCivil(item.dataReferencia),
      dataReavaliacao: item.dataReavaliacao.toISOString(),
      patrimonio: {
        id: item.patrimonio.id,
        numeroPatrimonio: item.numeroPatrimonioSnapshot,
        descricao: item.descricaoPatrimonioSnapshot,
      },
      comissao: {
        id: item.comissao.id,
        nome: item.nomeComissaoSnapshot,
      },
      valorLiquidoAnterior: decimal(item.valorLiquidoAnterior),
      valorBrutoNovo: decimal(item.valorReavaliado),
      vidaUtilNovaMeses: item.vidaUtilNovaMeses,
      valorResidualNovo: decimal(item.valorResidualNovo),
    };
  }

  static paraDetalhe(item: ReavaliacaoPayload): ReavaliacaoDetalhe {
    const anterior =
      item.valorBrutoAnterior !== null &&
      item.depreciacaoAcumuladaAnterior !== null &&
      item.valorBaseAnterior !== null &&
      item.vidaUtilInicialAnteriorMeses !== null &&
      item.quantidadeDepreciacoesAnteriores !== null &&
      item.parametroAnteriorId !== null &&
      item.valorResidualAnterior !== null &&
      item.vidaUtilRestanteAnteriorMeses !== null
        ? {
            valorBrutoAnterior: decimal(item.valorBrutoAnterior),
            depreciacaoAcumuladaAnterior: decimal(
              item.depreciacaoAcumuladaAnterior,
            ),
            valorLiquidoAnterior: decimal(item.valorLiquidoAnterior),
            valorBaseAnterior: decimal(item.valorBaseAnterior),
            valorResidualAnterior: decimal(item.valorResidualAnterior),
            percentualResidualAnterior:
              item.percentualResidualAnterior?.toFixed(2) ?? null,
            vidaUtilInicialAnteriorMeses: item.vidaUtilInicialAnteriorMeses,
            quantidadeDepreciacoesAnteriores:
              item.quantidadeDepreciacoesAnteriores,
            vidaUtilRestanteAnteriorMeses: item.vidaUtilRestanteAnteriorMeses,
            parametroAnteriorId: item.parametroAnteriorId,
          }
        : null;
    const novo =
      item.valorBaseNovo !== null
        ? {
            valorBrutoNovo: decimal(item.valorReavaliado),
            valorBaseNova: decimal(item.valorBaseNovo),
            valorResidualNovo: decimal(item.valorResidualNovo),
            percentualResidualNovo:
              item.percentualResidualNovo?.toFixed(2) ?? null,
            vidaUtilNovaMeses: item.vidaUtilNovaMeses,
          }
        : null;
    return {
      ...this.paraResumo(item),
      contabilAnterior:
        item.valorBrutoAnterior !== null &&
        item.depreciacaoAcumuladaAnterior !== null
          ? {
              valorBrutoAnterior: decimal(item.valorBrutoAnterior),
              depreciacaoAcumuladaAnterior: decimal(
                item.depreciacaoAcumuladaAnterior,
              ),
            }
          : null,
      anterior,
      novo,
      parametroNovoId: item.parametroDepreciacao?.id ?? null,
      registradoPor: {
        id: item.createdBy.id,
        nome: item.nomeAutorSnapshot,
      },
      createdAt: item.createdAt.toISOString(),
    };
  }
}
