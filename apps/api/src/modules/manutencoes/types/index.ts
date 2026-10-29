import type { Prisma } from "@repo/database";

export const manutencaoDetalheArgs = {
  include: {
    comissao: { select: { id: true, nome: true } },
    createdBy: { select: { id: true, nome: true } },
    documentos: {
      orderBy: [{ createdAt: "asc" as const }, { id: "asc" as const }],
    },
    itens: {
      orderBy: { createdAt: "asc" as const },
      include: {
        patrimonio: {
          select: {
            id: true,
            numeroPatrimonio: true,
            descricao: true,
            status: true,
          },
        },
        fornecedor: { select: { id: true, razaoSocial: true } },
        recebidoPor: { select: { id: true, nome: true } },
        revisoesOrcamento: {
          orderBy: { versao: "asc" as const },
          include: {
            fornecedor: { select: { id: true, razaoSocial: true } },
            createdBy: { select: { id: true, nome: true } },
          },
        },
        documentos: {
          orderBy: [{ createdAt: "asc" as const }, { id: "asc" as const }],
        },
      },
    },
  },
} satisfies Prisma.ManutencaoDefaultArgs;

export type ManutencaoPayload = Prisma.ManutencaoGetPayload<
  typeof manutencaoDetalheArgs
>;
export type ItemManutencaoPayload = ManutencaoPayload["itens"][number];
