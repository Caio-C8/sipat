import type { Prisma } from "@repo/database";
import type { Readable } from "node:stream";
import type { ArquivoPdfTemporario } from "../../../common/utils/arquivo-pdf";

export const baixaDetalheArgs = {
  select: {
    id: true,
    dataBaixa: true,
    tipo: true,
    motivo: true,
    observacao: true,
    caminhoAnexoDocumento: true,
    createdById: true,
    createdAt: true,
    patrimonio: {
      select: { id: true, numeroPatrimonio: true, descricao: true },
    },
    comissao: { select: { id: true, nome: true } },
  },
} satisfies Prisma.BaixaPatrimonioDefaultArgs;

export type BaixaDetalhePayload = Prisma.BaixaPatrimonioGetPayload<
  typeof baixaDetalheArgs
>;

export type ArquivoBaixaMultipart = ArquivoPdfTemporario;

export type DocumentoBaixaAberto = {
  conteudo: Readable;
  tamanho: number;
};

export type PatrimonioBloqueado = {
  id: string;
  status: "ATIVO" | "BAIXADO" | "EMPRESTADO" | "EM_MANUTENCAO";
};

export type ComissaoBloqueada = {
  id: string;
  dataVigenciaInicio: Date;
  dataVigenciaFim: Date;
};
