import type { Prisma } from "@repo/database";

export const patrimonioDetalheArgs = {
  select: {
    id: true,
    numeroPatrimonio: true,
    tipoNumeroPatrimonial: true,
    descricao: true,
    marca: true,
    modelo: true,
    numeroSerie: true,
    status: true,
    dataTombamento: true,
    tipoIncorporacao: true,
    valorIncorporacao: true,
    createdAt: true,
    updatedAt: true,
    setorAtual: {
      select: {
        id: true,
        nome: true,
        responsavel: { select: { id: true, nome: true } },
      },
    },
    especie: {
      select: {
        id: true,
        nome: true,
        natureza: { select: { id: true, nome: true } },
      },
    },
    processoCompra: {
      select: { id: true, numeroProcesso: true, anoProcesso: true },
    },
    situacaoContabil: {
      select: {
        valorBrutoAtual: true,
        depreciacaoAcumuladaAtual: true,
      },
    },
    parametrosDepreciacao: {
      where: { dataFim: null },
      orderBy: [{ createdAt: "desc" as const }, { id: "desc" as const }],
      take: 1,
      select: {
        metodo: true,
        vidaUtilInicialMeses: true,
        percentualResidual: true,
        valorResidual: true,
        valorBaseInicial: true,
        dataInicio: true,
        dataFim: true,
      },
    },
  },
} satisfies Prisma.PatrimonioDefaultArgs;

export type PatrimonioDetalhePayload = Prisma.PatrimonioGetPayload<
  typeof patrimonioDetalheArgs
>;

export type TipoNumeroParaGeracao = "OFICIAL" | "SEM_NUMERO_OFICIAL";
