import type { Prisma } from "@repo/database";
import type { Readable } from "node:stream";

export const notaFiscalResumoArgs = {
  select: {
    id: true,
    numeroNotaFiscal: true,
    anoNotaFiscal: true,
    dataEmissao: true,
    caminhoAnexoNotaFiscal: true,
    fornecedor: { select: { id: true, razaoSocial: true } },
  },
} satisfies Prisma.NotaFiscalDefaultArgs;

export const notaFiscalDetalheArgs = {
  select: {
    ...notaFiscalResumoArgs.select,
    processoCompra: {
      select: { id: true, numeroProcesso: true, anoProcesso: true },
    },
    createdAt: true,
    updatedAt: true,
  },
} satisfies Prisma.NotaFiscalDefaultArgs;

export type NotaFiscalResumoPayload = Prisma.NotaFiscalGetPayload<
  typeof notaFiscalResumoArgs
>;
export type NotaFiscalDetalhePayload = Prisma.NotaFiscalGetPayload<
  typeof notaFiscalDetalheArgs
>;

export type ListarNotasFiscaisResultado = {
  items: NotaFiscalResumoPayload[];
  total: number;
  pagina: number;
  ultimaPagina: number;
  limite: number;
};

export type ArquivoNotaFiscalMultipart = {
  originalname: string;
  mimetype: string;
  path: string;
  size: number;
};

export type AnexoNotaFiscalAberto = {
  conteudo: Readable;
  tamanho: number;
};
