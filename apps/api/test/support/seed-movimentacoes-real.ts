import { mkdirSync, writeFileSync } from "node:fs";
import { randomUUID } from "node:crypto";
import { createDatabaseClient } from "@repo/database";
import {
  prepararMovimentacoes,
  exigirBancoMovimentacoes,
} from "./movimentacoes-fixture";
async function main() {
  const url = process.env.MOVIMENTACOES_INTEGRATION_DATABASE_URL;
  exigirBancoMovimentacoes(url);
  const db = createDatabaseClient(url);
  const f = await prepararMovimentacoes(db);
  for (const [i, status] of (
    ["BAIXADO", "EMPRESTADO", "EM_MANUTENCAO"] as const
  ).entries()) {
    await db.patrimonio.create({
      data: {
        id: randomUUID(),
        numeroPatrimonio: String(13 + i),
        tipoNumeroPatrimonial: "OFICIAL",
        descricao: `Bem indisponível ${status}`,
        status,
        especieId: f.bens[0]!.especieId,
        setorAtualId: f.setores[0]!.id,
        dataTombamento: new Date("2026-01-01"),
        valorIncorporacao: 100,
        createdById: f.diretor.id,
        situacaoContabil: {
          create: { valorBrutoAtual: 100, depreciacaoAcumuladaAtual: 0 },
        },
      },
    });
  }
  mkdirSync("apps/web/test-results", { recursive: true });
  writeFileSync(
    "apps/web/test-results/movimentacoes-real-fixture.json",
    JSON.stringify({
      cookieDiretor: f.cookieDiretor,
      cookieAdmin: f.cookieAdmin,
      comissaoId: f.comissao.id,
      setores: f.setores.map((s) => ({ id: s.id, nome: s.nome })),
      bens: f.bens.map((b) => ({
        id: b.id,
        numeroPatrimonio: b.numeroPatrimonio,
      })),
    }),
  );
  await db.$disconnect();
  console.log("Dados exclusivamente de teste preparados.");
}
main().catch(() => {
  console.error("Falha ao preparar os dados isolados.");
  process.exitCode = 1;
});
