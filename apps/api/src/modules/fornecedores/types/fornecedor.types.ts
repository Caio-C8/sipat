import type { Prisma } from "@repo/database";

export const fornecedorResumoArgs = {
  select: {
    id: true,
    razaoSocial: true,
    nomeFantasia: true,
    cnpj: true,
    ativo: true,
  },
} satisfies Prisma.FornecedorDefaultArgs;

export const fornecedorDetalheArgs = {
  select: {
    ...fornecedorResumoArgs.select,
    nomeRepresentante: true,
    email: true,
    telefone: true,
    endereco: true,
    createdById: true,
    createdAt: true,
    updatedAt: true,
  },
} satisfies Prisma.FornecedorDefaultArgs;

export type FornecedorResumoPayload = Prisma.FornecedorGetPayload<
  typeof fornecedorResumoArgs
>;
export type FornecedorDetalhePayload = Prisma.FornecedorGetPayload<
  typeof fornecedorDetalheArgs
>;

export type ListarFornecedoresResultado = {
  items: FornecedorResumoPayload[];
  total: number;
  pagina: number;
  ultimaPagina: number;
  limite: number;
};
