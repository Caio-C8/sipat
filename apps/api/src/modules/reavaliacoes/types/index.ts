import type { StatusPatrimonio, Prisma } from "@repo/database";

export type EstadoReavaliacao = {
  patrimonioId: string;
  numeroPatrimonio: string;
  descricao: string;
  status: StatusPatrimonio;
  situacaoContabilId: string | null;
  valorBrutoAtual: Prisma.Decimal | null;
  depreciacaoAcumuladaAtual: Prisma.Decimal | null;
  parametroDepreciacaoId: string | null;
  quantidadeParametrosVigentes: bigint;
  quantidadeParametrosTotal: bigint;
  metodo: string | null;
  vidaUtilInicialMeses: number | null;
  percentualResidual: Prisma.Decimal | null;
  valorResidual: Prisma.Decimal | null;
  valorBaseInicial: Prisma.Decimal | null;
  dataInicio: Date | null;
  quantidadeRealizada: bigint;
  jaDepreciadoNaCompetencia: boolean;
};

export const reavaliacaoArgs = {
  select: {
    id: true,
    dataReavaliacao: true,
    dataReferencia: true,
    valorLiquidoAnterior: true,
    valorBrutoAnterior: true,
    depreciacaoAcumuladaAnterior: true,
    valorBaseAnterior: true,
    percentualResidualAnterior: true,
    vidaUtilInicialAnteriorMeses: true,
    quantidadeDepreciacoesAnteriores: true,
    parametroAnteriorId: true,
    valorReavaliado: true,
    valorBaseNovo: true,
    percentualResidualNovo: true,
    valorResidualAnterior: true,
    valorResidualNovo: true,
    vidaUtilRestanteAnteriorMeses: true,
    vidaUtilNovaMeses: true,
    numeroPatrimonioSnapshot: true,
    descricaoPatrimonioSnapshot: true,
    nomeComissaoSnapshot: true,
    nomeAutorSnapshot: true,
    createdAt: true,
    patrimonio: {
      select: { id: true, numeroPatrimonio: true, descricao: true },
    },
    comissao: { select: { id: true, nome: true } },
    createdBy: { select: { id: true, nome: true } },
    parametroDepreciacao: { select: { id: true } },
  },
} satisfies Prisma.ReavaliacaoPatrimonioDefaultArgs;

export type ReavaliacaoPayload = Prisma.ReavaliacaoPatrimonioGetPayload<
  typeof reavaliacaoArgs
>;
