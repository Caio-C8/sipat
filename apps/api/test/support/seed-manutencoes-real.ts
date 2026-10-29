import { randomUUID } from "node:crypto";
import { mkdirSync, writeFileSync } from "node:fs";
import { createDatabaseClient } from "@repo/database";
import { calcularHashTokenSessao } from "../../src/modules/auth/token-sessao";

async function main() {
  const url = process.env.MANUTENCOES_INTEGRATION_DATABASE_URL;
  if (!url || !ehBancoIsolado(url))
    throw new Error(
      "O teste Web só pode usar o PostgreSQL descartável na porta 5434.",
    );
  const db = createDatabaseClient(url);
  const tag = randomUUID();
  try {
    const usuario = await db.usuario.create({
      data: {
        nome: "Diretor Web teste",
        email: `${tag}@example.test`,
        senha: "hash-de-teste",
        perfil: "DIRETOR_PATRIMONIO",
        trocaSenhaObrigatoria: false,
      },
    });
    const token = Buffer.from(
      randomUUID().replace(/-/g, "").repeat(2).slice(0, 64),
      "hex",
    ).toString("base64url");
    const tokenHash = calcularHashTokenSessao(token);
    if (!tokenHash) throw new Error("Token de teste inválido.");
    await db.sessaoUsuario.create({
      data: {
        usuarioId: usuario.id,
        tokenHash,
        expiraAt: new Date(Date.now() + 3_600_000),
      },
    });
    const responsavel = await db.responsavel.create({
      data: {
        nome: "Responsável Web",
        matricula: tag.slice(0, 20),
        createdById: usuario.id,
      },
    });
    const setor = await db.setor.create({
      data: {
        nome: "Setor Web",
        responsavelId: responsavel.id,
        createdById: usuario.id,
      },
    });
    const natureza = await db.natureza.create({
      data: {
        nome: `Natureza ${tag}`,
        nomeNormalizado: tag,
        createdById: usuario.id,
      },
    });
    const especie = await db.especie.create({
      data: {
        nome: `Espécie ${tag}`,
        nomeNormalizado: tag,
        naturezaId: natureza.id,
        createdById: usuario.id,
      },
    });
    const comissao = await db.comissao.create({
      data: {
        nome: `Comissão Web ${tag.slice(0, 8)}`,
        dataVigenciaInicio: new Date("2020-01-01T00:00:00.000Z"),
        dataVigenciaFim: new Date("2030-12-31T00:00:00.000Z"),
        createdById: usuario.id,
      },
    });
    const fornecedor = await db.fornecedor.create({
      data: {
        razaoSocial: `Oficina Web ${tag.slice(0, 8)}`,
        createdById: usuario.id,
      },
    });
    const bens = [];
    for (let indice = 1; indice <= 2; indice++) {
      const numero = `${Date.now()}${indice}`;
      const bem = await db.patrimonio.create({
        data: {
          numeroPatrimonio: numero,
          tipoNumeroPatrimonial: "OFICIAL",
          descricao: `Equipamento Web ${indice}`,
          dataTombamento: new Date("2025-01-01T00:00:00.000Z"),
          valorIncorporacao: "1000",
          especieId: especie.id,
          setorAtualId: setor.id,
          createdById: usuario.id,
        },
      });
      bens.push({ id: bem.id, numero: bem.numeroPatrimonio });
    }
    mkdirSync("apps/web/test-results", { recursive: true });
    writeFileSync(
      "apps/web/test-results/manutencoes-real-fixture.json",
      JSON.stringify({
        token,
        comissaoId: comissao.id,
        fornecedorId: fornecedor.id,
        bens,
      }),
    );
  } finally {
    await db.$disconnect();
  }
}
main().catch(() => {
  console.error("Falha ao preparar dados descartáveis de manutenção.");
  process.exitCode = 1;
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
