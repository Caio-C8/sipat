import { Prisma } from "@repo/database";
import type { DepreciacaoCalculadaComLinha, LinhaDepreciacao } from "./types";

export class EstadoContabilDepreciacaoInconsistenteError extends Error {}

export function calcularDepreciacao(
  linha: LinhaDepreciacao,
): DepreciacaoCalculadaComLinha {
  const situacaoId = linha.situacaoContabilId;
  const parametroId = linha.parametroDepreciacaoId;
  const bruto = linha.valorBrutoAtual;
  const acumulada = linha.depreciacaoAcumuladaAtual;
  const residual = linha.valorResidual;
  const vidaInicial = linha.vidaUtilInicialMeses;

  if (
    situacaoId === null ||
    parametroId === null ||
    bruto === null ||
    acumulada === null ||
    residual === null ||
    vidaInicial === null ||
    linha.quantidadeParametrosVigentes !== 1n
  ) {
    throw new EstadoContabilDepreciacaoInconsistenteError(
      "As relações contábeis do patrimônio estão inconsistentes.",
    );
  }

  const liquido = bruto.minus(acumulada);
  const vidaRestante = vidaInicial - Number(linha.quantidadeRealizada);
  const saldoDepreciavel = liquido.minus(residual);

  if (
    bruto.isNegative() ||
    acumulada.isNegative() ||
    residual.isNegative() ||
    liquido.lessThan(residual) ||
    (saldoDepreciavel.isPositive() && vidaRestante <= 0)
  ) {
    throw new EstadoContabilDepreciacaoInconsistenteError(
      "Os valores contábeis do patrimônio estão inconsistentes.",
    );
  }

  const quota =
    vidaRestante === 1
      ? saldoDepreciavel
      : saldoDepreciavel
          .dividedBy(vidaRestante)
          .toDecimalPlaces(7, Prisma.Decimal.ROUND_HALF_UP);
  const limitada = Prisma.Decimal.min(quota, saldoDepreciavel);
  const novoLiquido = liquido.minus(limitada);

  return {
    linha,
    patrimonioId: linha.patrimonioId,
    situacaoContabilId: situacaoId,
    parametroDepreciacaoId: parametroId,
    valorContabilAnterior: liquido,
    valorDepreciado: limitada,
    valorContabilNovo: novoLiquido,
    depreciacaoAcumuladaNova: acumulada.plus(limitada),
    atingiraValorResidual: novoLiquido.equals(residual),
    vidaUtilRestanteMeses: vidaRestante,
  };
}
