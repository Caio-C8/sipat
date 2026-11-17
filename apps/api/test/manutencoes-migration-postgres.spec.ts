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
const databaseUrl = process.env.MANUTENCOES_INTEGRATION_DATABASE_URL;
const suite = databaseUrl ? describe : describe.skip;
const migrationPath = path.resolve(
  __dirname,
  "../../../packages/database/prisma/migrations/20261116120000_adiciona_numero_pedido_manutencao/migration.sql",
);
const anexoMigrationPath = path.resolve(
  __dirname,
  "../../../packages/database/prisma/migrations/20261116173000_simplifica_anexos_observacao_manutencao/migration.sql",
);

suite("migration WEB-MANUTENCOES-003 no PostgreSQL", () => {
  let pool: PoolLike;
  let migrationSql: string;

  jest.setTimeout(60_000);

  beforeAll(async () => {
    if (!databaseUrl || !ehBancoIsolado(databaseUrl))
      throw new Error(
        "MANUTENCOES_INTEGRATION_DATABASE_URL deve apontar para o banco descartável sipat_test na porta 5434.",
      );
    pool = new Pool({ connectionString: databaseUrl });
    migrationSql = await readFile(migrationPath, "utf8");
  });

  afterAll(async () => pool?.end());

  it("retropreenche por criação e id e continua a sequência global", async () => {
    const client = await pool.connect();
    const schema = "web_manutencoes_003_backfill";
    try {
      await client.query(`DROP SCHEMA IF EXISTS "${schema}" CASCADE`);
      await client.query(`CREATE SCHEMA "${schema}"`);
      await client.query(`SET search_path TO "${schema}"`);
      await client.query(`
        CREATE TABLE "manutencoes" (
          "id" UUID PRIMARY KEY,
          "created_at" TIMESTAMP(6) NOT NULL
        );
        INSERT INTO "manutencoes" ("id", "created_at") VALUES
          ('00000000-0000-4000-8000-000000000003', TIMESTAMP '2026-01-02'),
          ('00000000-0000-4000-8000-000000000002', TIMESTAMP '2026-01-01'),
          ('00000000-0000-4000-8000-000000000001', TIMESTAMP '2026-01-01');
      `);
      await client.query(migrationSql);
      const existentes = await client.query<{
        id: string;
        numero_pedido: string;
      }>(
        'SELECT "id", "numero_pedido"::text FROM "manutencoes" ORDER BY "numero_pedido"',
      );
      expect(existentes.rows).toEqual([
        {
          id: "00000000-0000-4000-8000-000000000001",
          numero_pedido: "1",
        },
        {
          id: "00000000-0000-4000-8000-000000000002",
          numero_pedido: "2",
        },
        {
          id: "00000000-0000-4000-8000-000000000003",
          numero_pedido: "3",
        },
      ]);
      const novo = await client.query<{ numero_pedido: string }>(`
        INSERT INTO "manutencoes" ("id", "created_at")
        VALUES ('00000000-0000-4000-8000-000000000004', TIMESTAMP '2026-01-03')
        RETURNING "numero_pedido"::text
      `);
      expect(novo.rows[0]?.numero_pedido).toBe("4");
    } finally {
      await client.query("SET search_path TO public");
      await client.query(`DROP SCHEMA IF EXISTS "${schema}" CASCADE`);
      client.release();
    }
  });

  it("funciona em tabela vazia e inicia em um", async () => {
    const client = await pool.connect();
    const schema = "web_manutencoes_003_vazio";
    try {
      await client.query(`DROP SCHEMA IF EXISTS "${schema}" CASCADE`);
      await client.query(`CREATE SCHEMA "${schema}"`);
      await client.query(`SET search_path TO "${schema}"`);
      await client.query(`
        CREATE TABLE "manutencoes" (
          "id" UUID PRIMARY KEY,
          "created_at" TIMESTAMP(6) NOT NULL
        )
      `);
      await client.query(migrationSql);
      const novo = await client.query<{ numero_pedido: string }>(`
        INSERT INTO "manutencoes" ("id", "created_at")
        VALUES ('00000000-0000-4000-8000-000000000001', CURRENT_TIMESTAMP)
        RETURNING "numero_pedido"::text
      `);
      expect(novo.rows[0]?.numero_pedido).toBe("1");
    } finally {
      await client.query("SET search_path TO public");
      await client.query(`DROP SCHEMA IF EXISTS "${schema}" CASCADE`);
      client.release();
    }
  });
});

suite("migration de anexo único da observação", () => {
  let pool: PoolLike;

  jest.setTimeout(60_000);

  beforeAll(() => {
    if (!databaseUrl || !ehBancoIsolado(databaseUrl))
      throw new Error("Use o PostgreSQL descartável sipat_test na porta 5434.");
    pool = new Pool({ connectionString: databaseUrl });
  });

  afterAll(async () => pool?.end());

  it("preserva o anexo mais recente por proprietário e remove a coleção", async () => {
    const client = await pool.connect();
    const schema = "web_manutencoes_003_anexo_unico";
    try {
      await client.query(`DROP SCHEMA IF EXISTS "${schema}" CASCADE`);
      await client.query(`CREATE SCHEMA "${schema}"`);
      await client.query(`SET search_path TO "${schema}"`);
      await client.query(`
        CREATE TYPE "FaseDocumentoManutencao" AS ENUM ('PEDIDO', 'ENVIO', 'RECEBIMENTO', 'LEGADO');
        CREATE TABLE manutencoes (id UUID PRIMARY KEY, caminho_anexo_observacao VARCHAR(500));
        CREATE TABLE itens_manutencao (id UUID PRIMARY KEY, manutencao_id UUID NOT NULL, caminho_anexo_observacao VARCHAR(500));
        CREATE TABLE documentos_manutencao (
          id UUID PRIMARY KEY, manutencao_id UUID NOT NULL, item_id UUID,
          fase "FaseDocumentoManutencao" NOT NULL, chave VARCHAR(500) NOT NULL,
          created_at TIMESTAMP(6) NOT NULL
        );
        CREATE TABLE idempotencias_manutencao (
          id UUID PRIMARY KEY, tipo VARCHAR(20) NOT NULL, documento_id UUID
        );
        ALTER TABLE idempotencias_manutencao ADD CONSTRAINT idempotencias_manutencao_tipo_documento_check CHECK ((tipo = 'DOCUMENTO') = (documento_id IS NOT NULL));
        ALTER TABLE idempotencias_manutencao ADD CONSTRAINT idempotencias_manutencao_documento_id_fkey FOREIGN KEY (documento_id) REFERENCES documentos_manutencao(id);
        INSERT INTO manutencoes VALUES ('00000000-0000-4000-8000-000000000001', 'legado-pedido.pdf');
        INSERT INTO itens_manutencao VALUES ('00000000-0000-4000-8000-000000000002', '00000000-0000-4000-8000-000000000001', 'legado-item.pdf');
        INSERT INTO documentos_manutencao VALUES
          ('00000000-0000-4000-8000-000000000010', '00000000-0000-4000-8000-000000000001', NULL, 'PEDIDO', 'pedido-antigo.pdf', '2026-01-01'),
          ('00000000-0000-4000-8000-000000000011', '00000000-0000-4000-8000-000000000001', NULL, 'PEDIDO', 'pedido-recente.pdf', '2026-01-02'),
          ('00000000-0000-4000-8000-000000000012', '00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000002', 'ENVIO', 'item.pdf', '2026-01-01');
      `);
      await client.query(await readFile(anexoMigrationPath, "utf8"));
      const resultado = await client.query<{ pedido: string; item: string }>(`
        SELECT m.caminho_anexo_observacao AS pedido, i.caminho_anexo_observacao AS item
        FROM manutencoes m JOIN itens_manutencao i ON i.manutencao_id = m.id
      `);
      expect(resultado.rows[0]).toEqual({
        pedido: "pedido-recente.pdf",
        item: "item.pdf",
      });
      const tabela = await client.query<{ existe: string | null }>(
        `SELECT to_regclass('documentos_manutencao')::text AS existe`,
      );
      expect(tabela.rows[0]?.existe).toBeNull();
    } finally {
      await client.query("SET search_path TO public");
      await client.query(`DROP SCHEMA IF EXISTS "${schema}" CASCADE`);
      client.release();
    }
  });
});

function ehBancoIsolado(valor: string): boolean {
  const url = new URL(valor);
  return (
    url.protocol === "postgresql:" &&
    url.hostname === "127.0.0.1" &&
    url.port === "5434" &&
    url.pathname === "/sipat_test" &&
    url.username === "sipat_test" &&
    url.searchParams.get("schema") === "public"
  );
}
