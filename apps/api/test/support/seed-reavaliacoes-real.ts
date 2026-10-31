import { randomBytes, randomUUID } from "node:crypto";
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { createDatabaseClient, Prisma } from "@repo/database";
import { diaSaoPaulo } from "../../src/common/utils/datas-institucionais";
import { calcularHashTokenSessao } from "../../src/modules/auth/token-sessao";

async function main() {
  const url = process.env.REAVALIACOES_INTEGRATION_DATABASE_URL;
  if (!url || !ehBancoIsolado(url))
    throw new Error(
      "Use somente o banco descartável de reavaliações na porta 5435.",
    );
  const db = createDatabaseClient(url);
  const tag = randomUUID();
  try {
    const usuario = await db.usuario.create({
      data: {
        nome: "Diretor Web teste",
        email: `reavaliacoes.${tag}@example.test`,
        senha: "hash-sintetico",
        perfil: "DIRETOR_PATRIMONIO",
        trocaSenhaObrigatoria: false,
      },
    });
    const token = randomBytes(32).toString("base64url");
    const tokenHash = calcularHashTokenSessao(token);
    if (!tokenHash) throw new Error("Token sintético inválido.");
    await db.sessaoUsuario.create({
      data: {
        usuarioId: usuario.id,
        tokenHash,
        expiraAt: new Date(Date.now() + 3_600_000),
      },
    });
    const responsavel = await db.responsavel.create({
      data: {
        nome: "Responsável Web teste",
        matricula: tag.slice(0, 20),
        createdById: usuario.id,
      },
    });
    const setor = await db.setor.create({
      data: {
        nome: "Setor Web teste",
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
        dataVigenciaInicio: new Date("2000-01-01T00:00:00.000Z"),
        dataVigenciaFim: new Date("2999-12-31T00:00:00.000Z"),
        createdById: usuario.id,
      },
    });
    const dia = diaSaoPaulo(new Date());
    const competencia = new Date(`${dia.slice(0, 7)}-01T00:00:00.000Z`);
    const inicioAnterior = new Date(competencia);
    inicioAnterior.setUTCMonth(inicioAnterior.getUTCMonth() - 1);
    const numero = String(Number.parseInt(tag.slice(0, 8), 16));
    const bem = await db.patrimonio.create({
      data: {
        numeroPatrimonio: numero,
        tipoNumeroPatrimonial: "OFICIAL",
        descricao: `Bem sintético Web ${tag.slice(0, 8)}`,
        textoBusca: `BEM SINTETICO WEB ${tag.slice(0, 8).toUpperCase()}`,
        dataTombamento: inicioAnterior,
        valorIncorporacao: new Prisma.Decimal("1000"),
        status: "ATIVO",
        especieId: especie.id,
        setorAtualId: setor.id,
        createdById: usuario.id,
        situacaoContabil: {
          create: {
            valorBrutoAtual: new Prisma.Decimal("1000"),
            depreciacaoAcumuladaAtual: new Prisma.Decimal("10"),
          },
        },
      },
    });
    const parametro = await db.parametroDepreciacao.create({
      data: {
        metodo: "LINEAR",
        vidaUtilInicialMeses: 90,
        valorResidual: new Prisma.Decimal("100"),
        valorBaseInicial: new Prisma.Decimal("1000"),
        dataInicio: inicioAnterior,
        patrimonioId: bem.id,
      },
    });
    await db.depreciacaoPatrimonio.create({
      data: {
        dataDepreciacao: new Date(),
        dataCompetencia: competencia,
        valorContabilAnterior: new Prisma.Decimal("1000"),
        valorDepreciado: new Prisma.Decimal("10"),
        valorContabilNovo: new Prisma.Decimal("990"),
        patrimonioId: bem.id,
        parametroDepreciacaoId: parametro.id,
        comissaoId: comissao.id,
        createdById: usuario.id,
      },
    });
    const pasta = path.resolve(process.cwd(), "apps/web/test-results");
    mkdirSync(pasta, { recursive: true });
    writeFileSync(
      path.join(pasta, "reavaliacoes-real-fixture.json"),
      JSON.stringify({
        token,
        comissaoId: comissao.id,
        bemId: bem.id,
        numero,
        busca: tag.slice(0, 8),
      }),
    );
  } finally {
    await db.$disconnect();
  }
}

function ehBancoIsolado(valor: string): boolean {
  const url = new URL(valor);
  return (
    url.protocol === "postgresql:" &&
    url.hostname === "127.0.0.1" &&
    url.port === "5435" &&
    url.pathname === "/sipat_reavaliacoes_test" &&
    url.username === "sipat_test" &&
    url.searchParams.get("schema") === "public"
  );
}

void main();
