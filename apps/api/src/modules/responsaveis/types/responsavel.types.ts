import type { Prisma } from "@repo/database";

export const responsavelResumoArgs = {
  select: {
    id: true,
    nome: true,
    matricula: true,
    ativo: true,
  },
} satisfies Prisma.ResponsavelDefaultArgs;

export const responsavelDetalheArgs = {
  select: {
    ...responsavelResumoArgs.select,
    createdById: true,
    createdAt: true,
    updatedAt: true,
  },
} satisfies Prisma.ResponsavelDefaultArgs;

export type ResponsavelResumoPayload = Prisma.ResponsavelGetPayload<
  typeof responsavelResumoArgs
>;
export type ResponsavelDetalhePayload = Prisma.ResponsavelGetPayload<
  typeof responsavelDetalheArgs
>;

export type ListarResponsaveisResultado = {
  items: ResponsavelResumoPayload[];
  total: number;
  pagina: number;
  ultimaPagina: number;
  limite: number;
};
