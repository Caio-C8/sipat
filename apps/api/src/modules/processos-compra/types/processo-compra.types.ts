import type { Prisma } from "@repo/database";

export const processoCompraResumoArgs = {
  select: {
    id: true,
    numeroProcesso: true,
    anoProcesso: true,
    numeroEmpenho: true,
    anoEmpenho: true,
    valorTotal: true,
    _count: { select: { notasFiscais: true } },
  },
} satisfies Prisma.ProcessoCompraDefaultArgs;

export const processoCompraDetalheArgs = {
  select: {
    id: true,
    numeroProcesso: true,
    anoProcesso: true,
    numeroEmpenho: true,
    anoEmpenho: true,
    valorTotal: true,
    observacao: true,
    createdAt: true,
    updatedAt: true,
    notasFiscais: {
      orderBy: [{ createdAt: "asc" as const }, { id: "asc" as const }],
      select: {
        id: true,
        numeroNotaFiscal: true,
        anoNotaFiscal: true,
        dataEmissao: true,
        caminhoAnexoNotaFiscal: true,
        fornecedor: { select: { id: true, razaoSocial: true } },
      },
    },
    _count: { select: { notasFiscais: true } },
  },
} satisfies Prisma.ProcessoCompraDefaultArgs;

export type ProcessoCompraResumoPayload = Prisma.ProcessoCompraGetPayload<
  typeof processoCompraResumoArgs
>;
export type ProcessoCompraDetalhePayload = Prisma.ProcessoCompraGetPayload<
  typeof processoCompraDetalheArgs
>;

export type ListarProcessosCompraResultado = {
  items: ProcessoCompraResumoPayload[];
  total: number;
  pagina: number;
  ultimaPagina: number;
  limite: number;
};

export type ArquivoMultipart = {
  originalname: string;
  mimetype: string;
  path: string;
  size: number;
};
