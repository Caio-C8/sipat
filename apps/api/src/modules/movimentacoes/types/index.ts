import type { Prisma } from "@repo/database";
export const movimentacaoArgs = {
  select: {
    id: true,
    dataTransferencia: true,
    observacao: true,
    createdAt: true,
    patrimonio: {
      select: {
        id: true,
        numeroPatrimonio: true,
        tipoNumeroPatrimonial: true,
        descricao: true,
      },
    },
    setorAntigo: { select: { id: true, nome: true } },
    setorAtual: { select: { id: true, nome: true } },
    comissao: { select: { id: true, nome: true } },
    createdBy: { select: { id: true, nome: true } },
    itemInventarioCorrecao: { select: { id: true, inventarioId: true } },
  },
} satisfies Prisma.TransferenciaPatrimonioDefaultArgs;
export type MovimentacaoPayload = Prisma.TransferenciaPatrimonioGetPayload<
  typeof movimentacaoArgs
>;
export type PaginaMovimentacoes<T> = {
  items: T[];
  total: number;
  pagina: number;
  limite: number;
  ultimaPagina: number;
};
