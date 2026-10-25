import { readFile } from "node:fs/promises";
import { createRequire } from "node:module";
import path from "node:path";

type QueryResult<Row> = { rows: Row[] };
type PoolClient = {
  query<Row = Record<string, unknown>>(sql: string): Promise<QueryResult<Row>>;
  release(): void;
};
type PoolLike = { connect(): Promise<PoolClient>; end(): Promise<void> };
const databaseRequire = createRequire(require.resolve("@repo/database"));
const { Pool } = databaseRequire("pg") as {
  Pool: new (options: { connectionString: string }) => PoolLike;
};

const databaseUrl = process.env.INVENTARIOS_INTEGRATION_DATABASE_URL;
const describeComPostgres = databaseUrl ? describe : describe.skip;
const migrationPath = path.resolve(
  __dirname,
  "../../../packages/database/prisma/migrations/20261024180000_adiciona_inventarios_001/migration.sql",
);

describeComPostgres("migration INVENTARIOS-001 no PostgreSQL", () => {
  let pool: PoolLike;
  let migrationSql: string;

  jest.setTimeout(60_000);

  beforeAll(async () => {
    if (!databaseUrl?.includes("/sipat_inventarios001_test")) {
      throw new Error(
        "INVENTARIOS_INTEGRATION_DATABASE_URL deve apontar para sipat_inventarios001_test.",
      );
    }
    pool = new Pool({ connectionString: databaseUrl });
    migrationSql = await readFile(migrationPath, "utf8");
  });

  afterAll(async () => pool?.end());

  it("preserva registros do schema anterior e acrescenta garantias", async () => {
    const client = await pool.connect();
    const schema = "inventarios_migration_upgrade";
    try {
      await client.query(`DROP SCHEMA IF EXISTS "${schema}" CASCADE`);
      await client.query(`CREATE SCHEMA "${schema}"`);
      await client.query(`SET search_path TO "${schema}"`);
      await client.query(`
        CREATE TYPE "StatusInventario" AS ENUM ('PENDENTE', 'EM_ANDAMENTO', 'FINALIZADO');
        CREATE TYPE "StatusSetorInventario" AS ENUM ('PENDENTE', 'EM_ANDAMENTO', 'CONCLUIDO');
        CREATE TYPE "StatusPatrimonio" AS ENUM ('ATIVO', 'BAIXADO', 'EMPRESTADO', 'EM_MANUTENCAO');
        CREATE TYPE "SituacaoItemInventario" AS ENUM ('DIVERGENCIA', 'CORRETO', 'NAO_LOCALIZADO');
        CREATE TYPE "StatusVerificacaoItemInventario" AS ENUM ('VERIFICADO', 'PENDENTE');
        CREATE TYPE "StatusCorrecaoItemInventario" AS ENUM ('CORRIGIDO', 'PENDENTE');
        CREATE TYPE "TipoCorrecaoItemInventario" AS ENUM ('TRANSFERENCIA_CADASTRAL', 'RETORNO_AO_SETOR_CADASTRADO');
        CREATE TABLE "usuarios" ("id" UUID PRIMARY KEY);
        CREATE TABLE "setores" ("id" UUID PRIMARY KEY);
        CREATE TABLE "patrimonios" ("id" UUID PRIMARY KEY);
        CREATE TABLE "emprestimos_patrimoniais" ("id" UUID PRIMARY KEY, "patrimonio_id" UUID NOT NULL);
        CREATE TABLE "itens_manutencao" ("id" UUID PRIMARY KEY, "patrimonio_id" UUID NOT NULL);
        CREATE TABLE "inventarios" (
          "id" UUID PRIMARY KEY, "status" "StatusInventario" NOT NULL DEFAULT 'PENDENTE',
          "data_inicio" DATE, "data_fim" DATE, "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP
        );
        CREATE TABLE "setores_inventario" (
          "id" UUID PRIMARY KEY, "status" "StatusSetorInventario" NOT NULL DEFAULT 'PENDENTE',
          "data_inicio" TIMESTAMP(6), "data_fim" TIMESTAMP(6), "inventario_id" UUID NOT NULL,
          "setor_id" UUID NOT NULL,
          CONSTRAINT "setores_inventario_inventario_id_setor_id_key" UNIQUE ("inventario_id", "setor_id")
        );
        CREATE TABLE "itens_inventario" (
          "id" UUID PRIMARY KEY, "situacao" "SituacaoItemInventario",
          "status_verificacao" "StatusVerificacaoItemInventario" NOT NULL DEFAULT 'PENDENTE',
          "data_verificacao" TIMESTAMP(6), "status_correcao" "StatusCorrecaoItemInventario",
          "tipo_correcao" "TipoCorrecaoItemInventario", "data_correcao" TIMESTAMP(6),
          "setor_esperado_id" UUID NOT NULL, "patrimonio_id" UUID NOT NULL,
          "setor_inventario_id" UUID NOT NULL, "inventario_id" UUID NOT NULL,
          CONSTRAINT "itens_inventario_setor_inventario_id_fkey" FOREIGN KEY ("setor_inventario_id") REFERENCES "setores_inventario"("id")
        );
      `);
      await client.query(`
        INSERT INTO "usuarios" VALUES ('00000000-0000-4000-8000-000000000001');
        INSERT INTO "setores" VALUES ('00000000-0000-4000-8000-000000000002');
        INSERT INTO "patrimonios" VALUES ('00000000-0000-4000-8000-000000000003');
        INSERT INTO "inventarios" ("id") VALUES ('00000000-0000-4000-8000-000000000004');
        INSERT INTO "setores_inventario" ("id", "inventario_id", "setor_id")
          VALUES ('00000000-0000-4000-8000-000000000005', '00000000-0000-4000-8000-000000000004', '00000000-0000-4000-8000-000000000002');
        INSERT INTO "itens_inventario" ("id", "setor_esperado_id", "patrimonio_id", "setor_inventario_id", "inventario_id")
          VALUES ('00000000-0000-4000-8000-000000000006', '00000000-0000-4000-8000-000000000002', '00000000-0000-4000-8000-000000000003', '00000000-0000-4000-8000-000000000005', '00000000-0000-4000-8000-000000000004');
      `);

      await client.query(migrationSql);

      const item = await client.query<{
        status_verificacao: string;
        verificado_por_id: string | null;
      }>(
        'SELECT "status_verificacao", "verificado_por_id" FROM "itens_inventario"',
      );
      expect(item.rows).toEqual([
        { status_verificacao: "PENDENTE", verificado_por_id: null },
      ]);
      await expect(
        client.query(`
          UPDATE "itens_inventario"
          SET "status_verificacao" = 'VERIFICADO'
          WHERE "id" = '00000000-0000-4000-8000-000000000006'
        `),
      ).rejects.toMatchObject({ code: "23514" });
    } finally {
      await client.query("SET search_path TO public");
      await client.query(`DROP SCHEMA IF EXISTS "${schema}" CASCADE`);
      client.release();
    }
  });
});
