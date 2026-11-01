import { mkdirSync, writeFileSync } from "node:fs";
import { createDatabaseClient } from "@repo/database";
import { SenhaHasher } from "../../src/common/security/senha-hasher";
import { exigirBancoRelatorios, fixtureRelatorios } from "./relatorios-fixture";
async function main() {
  const url = process.env.RELATORIOS_INTEGRATION_DATABASE_URL;
  exigirBancoRelatorios(url);
  const email = process.env.SIPAT_RELATORIOS_EMAIL,
    senha = process.env.SIPAT_RELATORIOS_SENHA;
  if (!email || !senha)
    throw new Error(
      "Informe as credenciais somente pelas variáveis locais do teste.",
    );
  const db = createDatabaseClient(url);
  try {
    const f = await fixtureRelatorios(db);
    const hash = await new SenhaHasher().criarHash(senha);
    const existente = await db.usuario.findUnique({
      where: { email },
      select: { id: true },
    });
    if (existente)
      throw new Error("Usuário já existe; não sobrescrever credenciais.");
    await db.usuario.update({
      where: { id: f.usuarios[0]!.id },
      data: { email, senha: hash, nome: "Arthur — ambiente de teste" },
    });
    await db.usuario.update({
      where: { id: f.usuarios[1]!.id },
      data: { senha: hash },
    });
    mkdirSync("apps/web/test-results", { recursive: true });
    writeFileSync(
      "apps/web/test-results/relatorios-real-fixture.json",
      JSON.stringify({
        tag: f.tag,
        patrimonioId: f.bem.id,
        inventarioId: f.inventario.id,
        emailDiretor: f.usuarios[1]!.email,
      }),
    );
    console.log(
      "Fixtures de relatórios e usuário criados somente no banco isolado.",
    );
  } finally {
    await db.$disconnect();
  }
}
void main();
