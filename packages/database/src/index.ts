import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

export function createDatabaseClient(
  databaseUrl = process.env.DATABASE_URL,
): PrismaClient {
  if (!databaseUrl) {
    throw new Error("DATABASE_URL is required to create a database client.");
  }

  const adapter = new PrismaPg({ connectionString: databaseUrl });
  return new PrismaClient({ adapter });
}

export {
  MetodoDepreciacao,
  PerfilUsuario,
  Prisma,
  PrismaClient,
  SituacaoItemInventario,
  StatusCorrecaoItemInventario,
  StatusInventario,
  StatusManutencao,
  StatusPatrimonio,
  StatusSetorInventario,
  StatusVerificacaoItemInventario,
  TipoBaixa,
  TipoCorrecaoItemInventario,
  TipoIncorporacao,
  TipoManutencao,
  TipoMembroComissao,
} from "@prisma/client";
export type {
  BaixaPatrimonio,
  Comissao,
  DepreciacaoPatrimonio,
  DevolucaoPatrimonio,
  EmprestimoPatrimonio,
  Especie,
  Fornecedor,
  Inventario,
  ItemInventario,
  ItemManutencao,
  Manutencao,
  MembroComissao,
  Natureza,
  NotaFiscal,
  ParametroDepreciacao,
  Patrimonio,
  ProcessoCompra,
  ReavaliacaoPatrimonio,
  Responsavel,
  Setor,
  SetorInventario,
  SituacaoContabilPatrimonio,
  TransferenciaPatrimonio,
  Usuario,
} from "./types";
export type DatabaseClient = ReturnType<typeof createDatabaseClient>;
