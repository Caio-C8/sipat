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
    localizacoesPosteriores: {
      take: 1,
      orderBy: [{ dataLocalizacao: "desc" as const }, { id: "desc" as const }],
      select: {
        id: true,
        dataLocalizacao: true,
        localizadoPorId: true,
        statusCorrecao: true,
        tipoCorrecao: true,
        dataCorrecao: true,
        corrigidoPorId: true,
        transferenciaCorrecaoId: true,
        observacao: true,
        setorInventarioEncontrado: {
          select: { setor: { select: { id: true, nome: true } } },
        },
      },
    },
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

export type InventarioOperacional = {
  id: string;
  status: "PENDENTE" | "EM_ANDAMENTO" | "FINALIZADO";
  comissaoId: string;
};

export type SetorInventarioOperacional = {
  id: string;
  inventarioId: string;
  setorId: string;
  status: "PENDENTE" | "EM_ANDAMENTO" | "CONCLUIDO";
};

export type ItemInventarioOperacional = {
  id: string;
  inventarioId: string;
  patrimonioId: string;
  setorEsperadoId: string;
  setorEncontradoId: string | null;
  statusVerificacao: "PENDENTE" | "VERIFICADO";
  situacao: "CORRETO" | "DIVERGENCIA" | "NAO_LOCALIZADO" | null;
  statusCorrecao: "PENDENTE" | "CORRIGIDO" | null;
  dataVerificacao: Date | null;
  patrimonioStatus: "ATIVO" | "EMPRESTADO" | "EM_MANUTENCAO" | "BAIXADO";
  patrimonioSetorAtualId: string;
};

export type TransferenciaPosterior = { id: string };

export type LocalizacaoPosteriorOperacional = {
  id: string;
  itemInventarioId: string;
  setorInventarioEncontradoId: string;
  setorEncontradoId: string;
  statusCorrecao: "PENDENTE" | "CORRIGIDO";
};

export type VerificacaoItemResultado = {
  tipo:
    | "CONFERENCIA_REGISTRADA"
    | "LEITURA_IDEMPOTENTE"
    | "LOCALIZACAO_POSTERIOR_REGISTRADA"
    | "LOCALIZACAO_POSTERIOR_IDEMPOTENTE";
  item: ItemInventarioPayload;
};

export type ItemJaVerificadoDados = {
  itemInventarioId: string;
  setorPrimeiraVerificacao: { id: string; nome: string };
  verificadoEm: string;
  contextoLocalizacao:
    "TRANSFERENCIA_POSTERIOR_REGISTRADA" | "MOVIMENTACAO_FISICA_SEM_HISTORICO";
  transferenciaId?: string;
};
