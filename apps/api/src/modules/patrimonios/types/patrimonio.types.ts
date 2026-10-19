import type { Prisma } from "@repo/database";

export const patrimonioResumoArgs = {
  select: {
    id: true,
    numeroPatrimonio: true,
    tipoNumeroPatrimonial: true,
    descricao: true,
    marca: true,
    modelo: true,
    numeroSerie: true,
    status: true,
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
  },
} satisfies Prisma.PatrimonioDefaultArgs;

export const patrimonioDetalheArgs = {
  select: {
    ...patrimonioResumoArgs.select,
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
export type PatrimonioResumoPayload = Prisma.PatrimonioGetPayload<
  typeof patrimonioResumoArgs
>;

export const patrimonioParaSubstituicaoArgs = {
  select: {
    id: true,
    numeroPatrimonio: true,
    tipoNumeroPatrimonial: true,
  },
} satisfies Prisma.PatrimonioDefaultArgs;

export type PatrimonioParaSubstituicaoPayload = Prisma.PatrimonioGetPayload<
  typeof patrimonioParaSubstituicaoArgs
>;

export type ListarPatrimoniosResultado = {
  items: PatrimonioResumoPayload[];
  total: number;
  pagina: number;
  ultimaPagina: number;
  limite: number;
};

export type TipoNumeroParaGeracao = "OFICIAL" | "SEM_NUMERO_OFICIAL";
