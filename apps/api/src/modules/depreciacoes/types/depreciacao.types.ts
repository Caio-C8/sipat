import type { StatusPatrimonio } from "@repo/database";
import { Prisma } from "@repo/database";

export type LinhaDepreciacao = {
  patrimonioId: string;
  numeroPatrimonio: string;
  descricao: string;
  status: StatusPatrimonio;
  depreciavel: boolean;
  disponibilidadeId: string | null;
  situacaoContabilId: string | null;
  valorBrutoAtual: Prisma.Decimal | null;
  depreciacaoAcumuladaAtual: Prisma.Decimal | null;
  parametroDepreciacaoId: string | null;
  quantidadeParametrosVigentes: bigint;
  vidaUtilInicialMeses: number | null;
  valorResidual: Prisma.Decimal | null;
  dataInicio: Date | null;
  quantidadeRealizada: bigint;
  jaDepreciadoNaCompetencia: boolean;
  primeiraCompetencia: Date | null;
  ultimaCompetenciaProcessada: Date | null;
  competenciaEsperada: Date | null;
};

export type LinhaPendente = LinhaDepreciacao;

export type ComissaoBloqueadaDepreciacao = {
  id: string;
  nome: string;
  dataVigenciaInicio: Date;
  dataVigenciaFim: Date;
};

export type DepreciacaoCalculada = {
  patrimonioId: string;
  situacaoContabilId: string;
  parametroDepreciacaoId: string;
  valorContabilAnterior: Prisma.Decimal;
  valorDepreciado: Prisma.Decimal;
  valorContabilNovo: Prisma.Decimal;
  depreciacaoAcumuladaNova: Prisma.Decimal;
  atingiraValorResidual: boolean;
};

export type DepreciacaoPersistida = {
  id: string;
  dataCompetencia: Date;
  dataDepreciacao: Date;
  valorContabilAnterior: Prisma.Decimal;
  valorDepreciado: Prisma.Decimal;
  valorContabilNovo: Prisma.Decimal;
  createdById: string;
  createdAt: Date;
  patrimonio: { id: string; numeroPatrimonio: string; descricao: string };
  comissao: { id: string; nome: string };
};

export type ResultadoPaginaPendentes = {
  items: DepreciacaoCalculadaComLinha[];
  total: number;
  totalNoValorResidual: number;
  pagina: number;
  ultimaPagina: number;
  limite: number;
};

export type CompetenciaDepreciacaoBanco = {
  competencia: Date;
  quantidadePendente: bigint;
  quantidadeBloqueadaPorAnterior: bigint;
};

export type ResumoPendenciasBanco = {
  totalPendencias: bigint;
  totalPatrimonios: bigint;
  competenciaMaisAntiga: Date | null;
};

export type DepreciacaoCalculadaComLinha = DepreciacaoCalculada & {
  linha: LinhaDepreciacao;
  vidaUtilRestanteMeses: number;
};
