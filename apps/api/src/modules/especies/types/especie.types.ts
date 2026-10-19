import type { Prisma } from "@repo/database";

const naturezaVinculadaSelect = {
  id: true,
  nome: true,
} satisfies Prisma.NaturezaSelect;

export const especieResumoArgs = {
  select: {
    id: true,
    nome: true,
    natureza: { select: naturezaVinculadaSelect },
  },
} satisfies Prisma.EspecieDefaultArgs;

export const especieDetalheArgs = {
  select: {
    ...especieResumoArgs.select,
    descricao: true,
    nomeNormalizado: true,
    createdById: true,
    createdAt: true,
    updatedAt: true,
  },
} satisfies Prisma.EspecieDefaultArgs;

export type EspecieResumoPayload = Prisma.EspecieGetPayload<
  typeof especieResumoArgs
>;
export type EspecieDetalhePayload = Prisma.EspecieGetPayload<
  typeof especieDetalheArgs
>;

export type ListarEspeciesResultado = {
  items: EspecieResumoPayload[];
  total: number;
  pagina: number;
  ultimaPagina: number;
  limite: number;
};
