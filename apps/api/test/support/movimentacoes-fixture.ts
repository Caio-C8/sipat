import { createHash, randomBytes } from "node:crypto";
import type { DatabaseClient } from "@repo/database";
export function exigirBancoMovimentacoes(
  url: string | undefined,
): asserts url is string {
  if (
    !url ||
    !["localhost", "127.0.0.1"].includes(new URL(url).hostname) ||
    !/^\/sipat_movimentacoes001_test_\d+$/.test(new URL(url).pathname)
  )
    throw new Error(
      "Use somente o banco isolado sipat_movimentacoes001_test_<numero>.",
    );
}
export async function prepararMovimentacoes(db: DatabaseClient) {
  exigirBancoMovimentacoes(process.env.MOVIMENTACOES_INTEGRATION_DATABASE_URL);
  await db.$executeRawUnsafe('TRUNCATE TABLE "usuarios" CASCADE');
  const diretor = await db.usuario.create({
    data: {
      nome: "Diretor teste",
      email: "diretor.mov@example.com",
      senha: "hash-exclusivo-teste",
      perfil: "DIRETOR_PATRIMONIO",
      trocaSenhaObrigatoria: false,
    },
  });
  const admin = await db.usuario.create({
    data: {
      nome: "Administrador teste",
      email: "admin.mov@example.com",
      senha: "hash-exclusivo-teste",
      perfil: "ADMINISTRADOR",
      trocaSenhaObrigatoria: false,
    },
  });
  const cookies: string[] = [];
  for (const usuario of [diretor, admin]) {
    const token = randomBytes(32).toString("base64url");
    await db.sessaoUsuario.create({
      data: {
        tokenHash: createHash("sha256").update(token).digest("hex"),
        usuarioId: usuario.id,
        expiraAt: new Date(Date.now() + 3_600_000),
        ultimaAtividadeAt: new Date(),
      },
    });
    cookies.push(`sipat_session=${token}`);
  }
  const responsavel = await db.responsavel.create({
    data: {
      nome: "Responsável teste",
      matricula: "MOV001",
      createdById: diretor.id,
    },
  });
  const setores = await Promise.all(
    ["Almoxarifado", "Compras", "Secretaria"].map((nome) =>
      db.setor.create({
        data: { nome, responsavelId: responsavel.id, createdById: diretor.id },
      }),
    ),
  );
  const natureza = await db.natureza.create({
    data: {
      nome: "Móveis",
      nomeNormalizado: "moveis",
      createdById: diretor.id,
    },
  });
  const especie = await db.especie.create({
    data: {
      nome: "Mesa",
      nomeNormalizado: "mesa",
      naturezaId: natureza.id,
      createdById: diretor.id,
    },
  });
  const bens = await Promise.all(
    Array.from({ length: 12 }, (_, i) =>
      db.patrimonio.create({
        data: {
          numeroPatrimonio: String(i + 1),
          tipoNumeroPatrimonial: "OFICIAL",
          descricao: `Mesa de teste ${i + 1}`,
          textoBusca: `mesa de teste ${i + 1}`,
          dataTombamento: new Date("2026-01-01T00:00:00Z"),
          valorIncorporacao: 100,
          situacaoContabil: {
            create: { valorBrutoAtual: 100, depreciacaoAcumuladaAtual: 0 },
          },
          especieId: especie.id,
          setorAtualId: setores[0]!.id,
          createdById: diretor.id,
        },
      }),
    ),
  );
  const comissao = await db.comissao.create({
    data: {
      nome: "Comissão vigente",
      dataVigenciaInicio: new Date("2000-01-01"),
      dataVigenciaFim: new Date("2999-12-31"),
      createdById: diretor.id,
    },
  });
  return {
    diretor,
    admin,
    setores,
    bens,
    comissao,
    cookieDiretor: cookies[0]!,
    cookieAdmin: cookies[1]!,
    identidade: {
      id: diretor.id,
      nome: diretor.nome,
      email: diretor.email,
      perfil: "DIRETOR_PATRIMONIO" as const,
      trocaSenhaObrigatoria: false,
    },
  };
}
export type FixtureMovimentacoes = Awaited<
  ReturnType<typeof prepararMovimentacoes>
>;
