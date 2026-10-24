import { readFile } from "node:fs/promises";
import { createRequire } from "node:module";
import path from "node:path";

type QueryResult<Row> = { rows: Row[] };
type PoolClient = {
  query<Row = Record<string, unknown>>(sql: string): Promise<QueryResult<Row>>;
  release(): void;
};
type PoolLike = {
  connect(): Promise<PoolClient>;
  end(): Promise<void>;
};

const databaseRequire = createRequire(require.resolve("@repo/database"));
const { Pool } = databaseRequire("pg") as {
  Pool: new (options: { connectionString: string }) => PoolLike;
};

const databaseUrl = process.env.COMISSOES_INTEGRATION_DATABASE_URL;
const describeComPostgres = databaseUrl ? describe : describe.skip;
const migrationPath = path.resolve(
  __dirname,
  "../../../packages/database/prisma/migrations/20261024120000_adiciona_comissoes_001/migration.sql",
);

describeComPostgres("migration COMISSOES-001 no PostgreSQL", () => {
  let pool: PoolLike;
  let migrationSql: string;

  jest.setTimeout(60_000);

  beforeAll(async () => {
    if (!databaseUrl?.includes("/sipat_comissoes001_test")) {
      throw new Error(
        "COMISSOES_INTEGRATION_DATABASE_URL deve apontar para sipat_comissoes001_test.",
      );
    }
    pool = new Pool({ connectionString: databaseUrl });
    migrationSql = await readFile(migrationPath, "utf8");
  });

  afterAll(async () => pool?.end());

  async function prepararSchema(
    client: PoolClient,
    schema: string,
    membroNulo: boolean,
  ): Promise<void> {
    await client.query(`DROP SCHEMA IF EXISTS "${schema}" CASCADE`);
    await client.query(`CREATE SCHEMA "${schema}"`);
    await client.query(`SET search_path TO "${schema}"`);
    await client.query(
      "CREATE TYPE \"tipo_membro_comissao\" AS ENUM ('PRESIDENTE', 'MEMBRO')",
    );
    await client.query(`
      CREATE TABLE "comissoes" (
        "id" UUID PRIMARY KEY,
        "numero_ato" DATE,
        "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
      CREATE TABLE "membros_comissao" (
        "id" UUID PRIMARY KEY,
        "tipo_membro_comissao" "tipo_membro_comissao",
        "comissao_id" UUID NOT NULL,
        "responsavel_id" UUID NOT NULL
      );
    `);

    for (const tabela of [
      "transferencias_patrimoniais",
      "emprestimos_patrimoniais",
      "devolucoes_patrimoniais",
      "manutencoes",
      "inventarios",
      "baixas_patrimoniais",
      "depreciacoes_patrimoniais",
      "reavaliacoes_patrimoniais",
    ]) {
      await client.query(
        `CREATE TABLE "${tabela}" ("comissao_id" UUID NOT NULL)`,
      );
    }

    await client.query(`
      INSERT INTO "comissoes" ("id", "numero_ato")
      VALUES ('00000000-0000-4000-8000-000000000001', DATE '2026-10-24')
    `);
    if (membroNulo) {
      await client.query(`
        INSERT INTO "membros_comissao"
          ("id", "tipo_membro_comissao", "comissao_id", "responsavel_id")
        VALUES (
          '00000000-0000-4000-8000-000000000002',
          NULL,
          '00000000-0000-4000-8000-000000000001',
          '00000000-0000-4000-8000-000000000003'
        )
      `);
    }
  }

  it("converte numero_ato existente para texto sem perder o valor", async () => {
    const client = await pool.connect();
    const schema = "comissoes_migration_valida";
    try {
      await prepararSchema(client, schema, false);
      await client.query(migrationSql);

      const valor = await client.query<{ numero_ato: string }>(
        'SELECT "numero_ato" FROM "comissoes"',
      );
      const coluna = await client.query<{ data_type: string }>(`
        SELECT data_type
        FROM information_schema.columns
        WHERE table_schema = '${schema}' AND table_name = 'comissoes'
          AND column_name = 'numero_ato'
      `);

      expect(valor.rows[0]?.numero_ato).toBe("2026-10-24");
      expect(coluna.rows[0]?.data_type).toBe("character varying");
    } finally {
      await client.query("SET search_path TO public");
      await client.query(`DROP SCHEMA IF EXISTS "${schema}" CASCADE`);
      client.release();
    }
  });

  it("falha com diagnóstico antes de escolher papel para integrante nulo", async () => {
    const client = await pool.connect();
    const schema = "comissoes_migration_nulo";
    try {
      await prepararSchema(client, schema, true);
      await expect(client.query(migrationSql)).rejects.toMatchObject({
        code: "23502",
        message: expect.stringContaining("existem integrantes sem papel"),
      });
    } finally {
      await client.query("SET search_path TO public");
      await client.query(`DROP SCHEMA IF EXISTS "${schema}" CASCADE`);
      client.release();
    }
  });
});
