import type { Prisma } from "@repo/database";

export const naturezaResumoArgs = {
  select: {
    id: true,
    nome: true,
  },
} satisfies Prisma.NaturezaDefaultArgs;

export const naturezaDetalheArgs = {
  select: {
    ...naturezaResumoArgs.select,
    descricao: true,
    nomeNormalizado: true,
    createdById: true,
    createdAt: true,
    updatedAt: true,
  },
} satisfies Prisma.NaturezaDefaultArgs;

export type NaturezaResumoPayload = Prisma.NaturezaGetPayload<
  typeof naturezaResumoArgs
>;
export type NaturezaDetalhePayload = Prisma.NaturezaGetPayload<
  typeof naturezaDetalheArgs
>;

export type ListarNaturezasResultado = {
  items: NaturezaResumoPayload[];
  total: number;
  pagina: number;
  ultimaPagina: number;
  limite: number;
};
