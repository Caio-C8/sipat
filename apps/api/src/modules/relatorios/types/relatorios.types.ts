import { Prisma } from "@repo/database";
export type FonteRelatorio = {
  sql: Prisma.Sql;
  ordem: Prisma.Sql;
  criterio: string;
  ordenacao: string;
};
export type LinhaBanco = { dados: unknown };
export type ResumoBanco = { resumo: unknown };
