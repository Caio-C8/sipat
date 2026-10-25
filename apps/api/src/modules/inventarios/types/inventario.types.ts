import type { Prisma } from "@repo/database";

export const inventarioResumoArgs = {
  select: {
    id: true,
    nome: true,
    status: true,
    dataInicio: true,
    dataFim: true,
    iniciadoPorId: true,
    finalizadoPorId: true,
    createdAt: true,
    updatedAt: true,
    comissao: { select: { id: true, nome: true } },
  },
} satisfies Prisma.InventarioDefaultArgs;

export const inventarioDetalheArgs = {
  select: {
    ...inventarioResumoArgs.select,
    descricao: true,
    observacao: true,
    createdById: true,
  },
} satisfies Prisma.InventarioDefaultArgs;

export const setorInventarioResumoArgs = {
  select: {
    id: true,
    status: true,
    dataInicio: true,
    dataFim: true,
    iniciadoPorId: true,
    concluidoPorId: true,
    setor: { select: { id: true, nome: true } },
  },
} satisfies Prisma.SetorInventarioDefaultArgs;

export const itemInventarioArgs = {
  select: {
    id: true,
    statusVerificacao: true,
    situacao: true,
    observacao: true,
    dataVerificacao: true,
    verificadoPorId: true,
    statusPatrimonioNaVerificacao: true,
    emprestimoPatrimonioId: true,
    itemManutencaoId: true,
    statusCorrecao: true,
    tipoCorrecao: true,
    dataCorrecao: true,
    corrigidoPorId: true,
    transferenciaCorrecaoId: true,
    patrimonio: {
      select: { id: true, numeroPatrimonio: true, descricao: true },
    },
    setorEsperado: { select: { id: true, nome: true } },
    setorEncontrado: { select: { id: true, nome: true } },
  },
} satisfies Prisma.ItemInventarioDefaultArgs;

export type InventarioResumoPayload = Prisma.InventarioGetPayload<
  typeof inventarioResumoArgs
>;
export type InventarioDetalhePayload = Prisma.InventarioGetPayload<
  typeof inventarioDetalheArgs
>;
export type SetorInventarioResumoPayload = Prisma.SetorInventarioGetPayload<
  typeof setorInventarioResumoArgs
>;
export type ItemInventarioPayload = Prisma.ItemInventarioGetPayload<
  typeof itemInventarioArgs
>;

export type ProgressoInventarioPayload = {
  totalSetores: number;
  setoresPendentes: number;
  setoresEmAndamento: number;
  setoresConcluidos: number;
  totalItens: number;
  itensPendentes: number;
  itensVerificados: number;
  corretos: number;
  divergencias: number;
  naoLocalizados: number;
  correcoesPendentes: number;
  correcoesCorrigidas: number;
};

export type ProgressoSetorPayload = {
  totalItens: number;
  itensPendentes: number;
  itensVerificados: number;
  corretos: number;
  divergencias: number;
  naoLocalizados: number;
};

export type ComProgresso<T, P> = T & { progresso: P };
export type ResultadoPaginado<T> = {
  items: T[];
  total: number;
  pagina: number;
  ultimaPagina: number;
  limite: number;
};
