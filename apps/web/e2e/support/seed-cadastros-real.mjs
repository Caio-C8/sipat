import { randomBytes, randomUUID, createHash } from "node:crypto";
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createDatabaseClient } from "../../../../packages/database/src/index.ts";
const fixtureDirectory = fileURLToPath(new URL(".", import.meta.url));

async function main() {
  const valor = process.env.CADASTROS_INTEGRATION_DATABASE_URL;
  const url = valor ? new URL(valor) : null;
  if (
    !url ||
    url.protocol !== "postgresql:" ||
    url.hostname !== "127.0.0.1" ||
    url.port !== "55434" ||
    url.pathname !== "/sipat_cadastros" ||
    url.searchParams.get("schema") !== "public"
  ) {
    throw new Error(
      "Use somente o PostgreSQL isolado sipat_cadastros na porta 55434.",
    );
  }
  const db = createDatabaseClient(valor);
  const fixture = {};
  const tag = randomUUID();
  try {
    for (const [chave, perfil] of [
      ["admin", "ADMINISTRADOR"],
      ["diretor", "DIRETOR_PATRIMONIO"],
    ]) {
      const usuario = await db.usuario.create({
        data: {
          nome:
            chave === "admin" ? "Administrador Cadastros" : "Diretor Cadastros",
          email: chave + "-" + tag + "@example.test",
          senha: "hash-sintetico",
          perfil,
          trocaSenhaObrigatoria: false,
        },
      });
      const token = randomBytes(32).toString("base64url");
      await db.sessaoUsuario.create({
        data: {
          usuarioId: usuario.id,
          tokenHash: createHash("sha256").update(token).digest("hex"),
          expiraAt: new Date(Date.now() + 3_600_000),
        },
      });
      fixture[chave] = { token };
    }
    const usuario = await db.usuario.findUniqueOrThrow({
      where: { email: "admin-" + tag + "@example.test" },
    });
    const fornecedor = await db.fornecedor.create({
      data: {
        razaoSocial: "Fornecedor sintético " + tag,
        createdById: usuario.id,
      },
    });
    fixture.fornecedorId = fornecedor.id;
    const destino = path.resolve(fixtureDirectory, "../../../../test-results");
    mkdirSync(destino, { recursive: true });
    writeFileSync(
      path.join(destino, "cadastros-real-fixture.json"),
      JSON.stringify(fixture),
    );
    console.log("Fixture dos dois perfis criada no PostgreSQL isolado.");
  } finally {
    await db.$disconnect();
  }
}
main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
