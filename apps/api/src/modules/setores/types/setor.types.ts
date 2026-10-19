import type { Prisma } from "@repo/database";

const responsavelSetorSelect = {
  id: true,
  nome: true,
  matricula: true,
  ativo: true,
} satisfies Prisma.ResponsavelSelect;

export const setorResumoArgs = {
  select: {
    id: true,
    nome: true,
    sala: true,
    ramal: true,
    ativo: true,
    responsavel: { select: responsavelSetorSelect },
  },
} satisfies Prisma.SetorDefaultArgs;

export const setorDetalheArgs = {
  select: {
    ...setorResumoArgs.select,
    createdById: true,
    createdAt: true,
    updatedAt: true,
  },
} satisfies Prisma.SetorDefaultArgs;

export type SetorResumoPayload = Prisma.SetorGetPayload<typeof setorResumoArgs>;
export type SetorDetalhePayload = Prisma.SetorGetPayload<
  typeof setorDetalheArgs
>;

export type ListarSetoresResultado = {
  items: SetorResumoPayload[];
  total: number;
  pagina: number;
  ultimaPagina: number;
  limite: number;
};
