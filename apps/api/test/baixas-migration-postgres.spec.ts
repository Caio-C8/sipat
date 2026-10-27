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

const databaseUrl = process.env.BAIXAS_INTEGRATION_DATABASE_URL;
const describeComPostgres = databaseUrl ? describe : describe.skip;
const migrationPath = path.resolve(
  __dirname,
  "../../../packages/database/prisma/migrations/20261027120000_implementa_baixas_001/migration.sql",
);

describeComPostgres("migration BAIXAS-001 no PostgreSQL", () => {
  let pool: PoolLike;
  let migrationSql: string;

  jest.setTimeout(60_000);

  beforeAll(async () => {
    if (!databaseUrl?.includes("/sipat_baixas001_test")) {
      throw new Error(
        "BAIXAS_INTEGRATION_DATABASE_URL deve apontar para sipat_baixas001_test.",
      );
    }
    pool = new Pool({ connectionString: databaseUrl });
    migrationSql = await readFile(migrationPath, "utf8");
  });

  afterAll(async () => pool?.end());

  async function prepararSchema(
    client: PoolClient,
    schema: string,
    registro?: { tipo: string; data: string },
  ): Promise<void> {
    await client.query(`DROP SCHEMA IF EXISTS "${schema}" CASCADE`);
    await client.query(`CREATE SCHEMA "${schema}"`);
    await client.query(`SET search_path TO "${schema}"`);
    await client.query(`
      CREATE TYPE "TipoBaixa" AS ENUM ('ALIENACAO', 'INVERSIBILIDADE', 'PERDA_FISICA', 'AJUSTE_CONTABIL');
      CREATE TABLE "baixas_patrimoniais" (
        "id" UUID PRIMARY KEY,
        "data_baixa" TIMESTAMP(6) NOT NULL,
        "tipo" "TipoBaixa" NOT NULL,
        "patrimonio_id" UUID NOT NULL
      );
    `);
    if (registro) {
      await client.query(`
        INSERT INTO "baixas_patrimoniais" ("id", "data_baixa", "tipo", "patrimonio_id")
        VALUES (
          '00000000-0000-4000-8000-000000000001',
          '${registro.data}',
          '${registro.tipo}',
          '00000000-0000-4000-8000-000000000002'
        )
      `);
    }
  }

  it.each([false, true])(
    "aplica sobre o schema anterior %s registros e preserva ALIENACAO",
    async (comRegistro) => {
      const client = await pool.connect();
      const schema = comRegistro
        ? "baixas_migration_upgrade"
        : "baixas_migration_empty";
      try {
        await prepararSchema(
          client,
          schema,
          comRegistro
            ? { tipo: "ALIENACAO", data: "2026-10-27 00:00:00" }
            : undefined,
        );
        await client.query(migrationSql);

        const coluna = await client.query<{ data_type: string }>(`
          SELECT data_type FROM information_schema.columns
          WHERE table_schema = '${schema}'
            AND table_name = 'baixas_patrimoniais'
            AND column_name = 'data_baixa'
        `);
        expect(coluna.rows).toEqual([{ data_type: "date" }]);
        const enumValues = await client.query<{ enumlabel: string }>(`
          SELECT e.enumlabel
          FROM pg_enum e
          JOIN pg_type t ON t.oid = e.enumtypid
          JOIN pg_namespace n ON n.oid = t.typnamespace
          WHERE n.nspname = '${schema}' AND t.typname = 'TipoBaixa'
          ORDER BY e.enumsortorder
        `);
        expect(enumValues.rows.map(({ enumlabel }) => enumlabel)).toEqual([
          "ALIENACAO",
          "INUTILIZACAO",
          "SINISTRO",
          "FURTO",
          "EXTRAVIO",
          "TRANSFERENCIA",
          "RECLASSIFICACAO",
          "ABANDONO",
          "ERRO_REGISTRO",
          "OUTRO",
        ]);
        if (comRegistro) {
          await expect(
            client.query(`
              INSERT INTO "baixas_patrimoniais" ("id", "data_baixa", "tipo", "patrimonio_id")
              VALUES (
                '00000000-0000-4000-8000-000000000003', '2026-10-28', 'OUTRO',
                '00000000-0000-4000-8000-000000000002'
              )
            `),
          ).rejects.toMatchObject({ code: "23505" });
        }
      } finally {
        await client.query("SET search_path TO public");
        await client.query(`DROP SCHEMA IF EXISTS "${schema}" CASCADE`);
        client.release();
      }
    },
  );

  it.each([
    ["INVERSIBILIDADE", "2026-10-27 00:00:00"],
    ["ALIENACAO", "2026-10-27 10:30:00"],
  ])("interrompe conversão ambígua de tipo ou horário", async (tipo, data) => {
    const client = await pool.connect();
    const schema = "baixas_migration_blocked";
    try {
      await prepararSchema(client, schema, { tipo, data });
      await expect(client.query(migrationSql)).rejects.toThrow();
    } finally {
      await client.query("SET search_path TO public");
      await client.query(`DROP SCHEMA IF EXISTS "${schema}" CASCADE`);
      client.release();
    }
  });
});
