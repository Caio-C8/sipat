import type { Prisma } from "@repo/database";

export const membroComissaoArgs = {
  select: {
    id: true,
    tipoMembroComissao: true,
    createdAt: true,
    updatedAt: true,
    responsavel: {
      select: { id: true, nome: true, matricula: true, ativo: true },
    },
  },
} satisfies Prisma.MembroComissaoDefaultArgs;

export const comissaoResumoArgs = {
  select: {
    id: true,
    nome: true,
    numeroAto: true,
    dataVigenciaInicio: true,
    dataVigenciaFim: true,
  },
} satisfies Prisma.ComissaoDefaultArgs;

export const comissaoDetalheArgs = {
  select: {
    ...comissaoResumoArgs.select,
    descricao: true,
    createdById: true,
    createdAt: true,
    updatedAt: true,
    membros: {
      orderBy: [{ createdAt: "asc" as const }, { id: "asc" as const }],
      ...membroComissaoArgs,
    },
    _count: {
      select: {
        transferencias: true,
        emprestimos: true,
        manutencoes: true,
        inventarios: true,
        baixas: true,
        devolucoes: true,
        depreciacoes: true,
        reavaliacoes: true,
      },
    },
  },
} satisfies Prisma.ComissaoDefaultArgs;

export type MembroComissaoPayload = Prisma.MembroComissaoGetPayload<
  typeof membroComissaoArgs
>;
export type ComissaoResumoPayload = Prisma.ComissaoGetPayload<
  typeof comissaoResumoArgs
>;
export type ComissaoDetalhePayload = Prisma.ComissaoGetPayload<
  typeof comissaoDetalheArgs
>;

export type ListarComissoesResultado = {
  items: ComissaoResumoPayload[];
  total: number;
  pagina: number;
  ultimaPagina: number;
  limite: number;
};
