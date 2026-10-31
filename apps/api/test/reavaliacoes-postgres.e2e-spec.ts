import { createHash, randomBytes, randomUUID } from "node:crypto";
import type { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import {
  CABECALHO_CSRF,
  CriarReavaliacaoResponseSchema,
  PreviaReavaliacaoResponseSchema,
} from "@repo/contracts";
import {
  createDatabaseClient,
  Prisma,
  type DatabaseClient,
} from "@repo/database";
import cookieParser from "cookie-parser";
import request from "supertest";
import { AppModule } from "../src/app.module";
import { DATABASE_CLIENT } from "../src/common/database/database.constants";
import { diaSaoPaulo } from "../src/common/utils/datas-institucionais";
import { calcularDepreciacao } from "../src/modules/depreciacoes/depreciacao-calculo";
import { DepreciacoesRepository } from "../src/modules/depreciacoes/depreciacoes.repository";
import { ReavaliacoesRepository } from "../src/modules/reavaliacoes/reavaliacoes.repository";

const url = process.env.REAVALIACOES_INTEGRATION_DATABASE_URL;
const suite = url ? describe : describe.skip;

suite("reavaliações HTTP e PostgreSQL isolado", () => {
  jest.setTimeout(60_000);
  let app: INestApplication;
  let db: DatabaseClient;
  let cookieDiretor: string;
  let cookieAdmin: string;
  let comissaoId: string;
  let bens: { id: string }[];
  let dia: string;

  beforeAll(async () => {
    const destino = new URL(url!);
    if (
      destino.hostname !== "127.0.0.1" ||
      destino.port !== "5435" ||
      destino.pathname !== "/sipat_reavaliacoes_test"
    ) {
      throw new Error(
        "Use somente o banco descartável de reavaliações na porta 5435.",
      );
    }
    db = createDatabaseClient(url);
    const module = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(DATABASE_CLIENT)
      .useValue(db)
      .compile();
    app = module.createNestApplication();
    app.use(cookieParser());
    app.setGlobalPrefix("api");
    await app.init();
  });

  afterAll(async () => {
    await app?.close();
    await db?.$disconnect();
  });

  beforeEach(async () => {
    await db.$executeRawUnsafe('TRUNCATE TABLE "usuarios" CASCADE');
    dia = diaSaoPaulo(new Date());
    const usuarios = await Promise.all([
      db.usuario.create({
        data: {
          nome: "Diretor de teste",
          email: "diretor.reavaliacoes@example.com",
          senha: "hash-sintetico",
          perfil: "DIRETOR_PATRIMONIO",
          trocaSenhaObrigatoria: false,
        },
      }),
      db.usuario.create({
        data: {
          nome: "Administrador de teste",
          email: "admin.reavaliacoes@example.com",
          senha: "hash-sintetico",
          perfil: "ADMINISTRADOR",
          trocaSenhaObrigatoria: false,
        },
      }),
    ]);
    const cookies: string[] = [];
    for (const usuario of usuarios) {
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
    cookieDiretor = cookies[0]!;
    cookieAdmin = cookies[1]!;
    const autorId = usuarios[0]!.id;
    const responsavel = await db.responsavel.create({
      data: {
        nome: "Responsável teste",
        matricula: "REA001",
        createdById: autorId,
      },
    });
    const setor = await db.setor.create({
      data: {
        nome: "Setor teste",
        responsavelId: responsavel.id,
        createdById: autorId,
      },
    });
    const natureza = await db.natureza.create({
      data: {
        nome: "Natureza teste",
        nomeNormalizado: "natureza teste",
        createdById: autorId,
      },
    });
    const especie = await db.especie.create({
      data: {
        nome: "Espécie teste",
        nomeNormalizado: "especie teste",
        naturezaId: natureza.id,
        createdById: autorId,
      },
    });
    const comissao = await db.comissao.create({
      data: {
        nome: "Comissão de teste",
        dataVigenciaInicio: new Date("2000-01-01T00:00:00.000Z"),
        dataVigenciaFim: new Date("2999-12-31T00:00:00.000Z"),
        createdById: autorId,
      },
    });
    comissaoId = comissao.id;
    const inicioCompetencia = new Date(`${dia.slice(0, 7)}-01T00:00:00.000Z`);
    const inicioAnterior = new Date(inicioCompetencia);
    inicioAnterior.setUTCMonth(inicioAnterior.getUTCMonth() - 1);
    bens = [];
    for (const indice of [1, 2, 3]) {
      const bem = await db.patrimonio.create({
        data: {
          numeroPatrimonio: String(indice),
          tipoNumeroPatrimonial: "OFICIAL",
          descricao: `Bem sintético ${indice}`,
          textoBusca: `bem sintetico ${indice}`,
          dataTombamento: inicioAnterior,
          valorIncorporacao: new Prisma.Decimal("1000"),
          status: indice === 3 ? "BAIXADO" : "ATIVO",
          especieId: especie.id,
          setorAtualId: setor.id,
          createdById: autorId,
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
          percentualResidual: null,
          valorResidual: new Prisma.Decimal("100"),
          valorBaseInicial: new Prisma.Decimal("1000"),
          dataInicio: inicioAnterior,
          patrimonioId: bem.id,
        },
      });
      await db.depreciacaoPatrimonio.create({
        data: {
          dataDepreciacao: new Date(),
          dataCompetencia: inicioCompetencia,
          valorContabilAnterior: new Prisma.Decimal("1000"),
          valorDepreciado: new Prisma.Decimal("10"),
          valorContabilNovo: new Prisma.Decimal("990"),
          patrimonioId: bem.id,
          parametroDepreciacaoId: parametro.id,
          comissaoId,
          createdById: autorId,
        },
      });
      bens.push(bem);
    }
  });

  const body = () => ({
    dataReferencia: dia,
    comissaoId,
    itens: [
      {
        patrimonioId: bens[0]!.id,
        valorReavaliado: "1200",
        vidaUtilNovaMeses: 60,
        residual: { tipo: "PERCENTUAL", percentual: "12.50" },
      },
      {
        patrimonioId: bens[1]!.id,
        valorReavaliado: "800",
        vidaUtilNovaMeses: 40,
        residual: { tipo: "VALOR", valor: "80" },
      },
    ],
  });
  const post = (rota: string, dados: object, cookie = cookieDiretor) =>
    request(app.getHttpServer())
      .post(`/api/reavaliacoes${rota}`)
      .set("Cookie", cookie)
      .set("Origin", "http://localhost:3000")
      .set(CABECALHO_CSRF, "1")
      .send(dados);

  it("protege prévia e registro por sessão, perfil e CSRF", async () => {
    await request(app.getHttpServer()).get("/api/reavaliacoes").expect(401);
    await post("/previa", body(), cookieAdmin).expect(403);
    await request(app.getHttpServer())
      .post("/api/reavaliacoes/previa")
      .set("Cookie", cookieDiretor)
      .set("Origin", "http://localhost:3000")
      .send(body())
      .expect(403);
    await request(app.getHttpServer())
      .get("/api/reavaliacoes?pagina=1&limite=20")
      .set("Cookie", cookieAdmin)
      .expect(200);
  });

  it("recusa data de referência de competência anterior antes de escrever", async () => {
    const anterior = new Date(`${dia.slice(0, 7)}-01T12:00:00.000Z`);
    anterior.setUTCDate(0);
    const resposta = await post("/previa", {
      ...body(),
      dataReferencia: anterior.toISOString().slice(0, 10),
    }).expect(400);
    expect(resposta.body.codigo).toBe("DATA_REFERENCIA_FORA_PERIODO");
    expect(await db.reavaliacaoPatrimonio.count()).toBe(0);
  });

  it("consulta registro legado sem inventar snapshots históricos", async () => {
    const autor = await db.usuario.findUniqueOrThrow({
      where: { email: "diretor.reavaliacoes@example.com" },
    });
    const legado = await db.reavaliacaoPatrimonio.create({
      data: {
        dataReavaliacao: new Date("2025-01-15T12:00:00.000Z"),
        valorLiquidoAnterior: new Prisma.Decimal("900"),
        valorReavaliado: new Prisma.Decimal("1200"),
        valorResidualAnterior: new Prisma.Decimal("100"),
        valorResidualNovo: new Prisma.Decimal("150"),
        vidaUtilRestanteAnteriorMeses: 80,
        vidaUtilNovaMeses: 60,
        patrimonioId: bens[0]!.id,
        comissaoId,
        createdById: autor.id,
      },
    });
    const detalhe = await request(app.getHttpServer())
      .get(`/api/reavaliacoes/${legado.id}`)
      .set("Cookie", cookieAdmin)
      .expect(200);
    expect(detalhe.body.dados).toMatchObject({
      dataReferencia: null,
      patrimonio: { numeroPatrimonio: null, descricao: null },
      comissao: { nome: null },
      registradoPor: { nome: null },
      anterior: null,
      novo: null,
    });
  });

  it("reavalia dois bens atomicamente, preserva histórico e rejeita repetição", async () => {
    const previaHttp = await post("/previa", body()).expect(200);
    const previa = PreviaReavaliacaoResponseSchema.parse(previaHttp.body);
    expect(previa.dados.versaoPrevia).toMatch(/^[a-f0-9]{64}$/);
    const confirmacao = {
      ...body(),
      versaoPrevia: previa.dados.versaoPrevia,
      chaveIdempotencia: randomUUID(),
    };
    const criadaHttp = await post("", confirmacao).expect(201);
    const criada = CriarReavaliacaoResponseSchema.parse(criadaHttp.body);
    expect(criada.dados).toHaveLength(2);
    expect(criada.dados[0]?.anterior?.valorLiquidoAnterior).toBe("990.0000000");
    expect(criada.dados[0]?.novo?.valorResidualNovo).toBe("150.0000000");
    expect((await post("", confirmacao).expect(409)).body.codigo).toBe(
      "OPERACAO_JA_PROCESSADA",
    );
    await post("", { ...confirmacao, dataReferencia: "2000-01-01" }).expect(
      409,
    );
    expect(await db.reavaliacaoPatrimonio.count()).toBe(2);
    expect(await db.depreciacaoPatrimonio.count()).toBe(3);
    for (const bem of bens.slice(0, 2)) {
      const atual = await db.situacaoContabilPatrimonio.findUniqueOrThrow({
        where: { patrimonioId: bem.id },
      });
      expect(atual.depreciacaoAcumuladaAtual.toString()).toBe("0");
      expect(
        await db.parametroDepreciacao.count({
          where: { patrimonioId: bem.id, dataFim: null },
        }),
      ).toBe(1);
      expect(
        await db.parametroDepreciacao.count({
          where: { patrimonioId: bem.id, dataFim: { not: null } },
        }),
      ).toBe(1);
    }
    const detalhe = await request(app.getHttpServer())
      .get(`/api/reavaliacoes/${criada.dados[0]!.id}`)
      .set("Cookie", cookieAdmin)
      .expect(200);
    expect(detalhe.body.dados.anterior.valorBrutoAnterior).toBe("1000.0000000");
  });

  it("recusa bem baixado e prévia desatualizada sem escrita", async () => {
    const invalido = body();
    invalido.itens[1]!.patrimonioId = bens[2]!.id;
    const impedida = await post("/previa", invalido).expect(200);
    expect(impedida.body.dados.versaoPrevia).toBeNull();
    expect(impedida.body.dados.itens[1].erros[0].codigo).toBe(
      "PATRIMONIO_BAIXADO",
    );
    const valida = await post("/previa", body()).expect(200);
    await db.situacaoContabilPatrimonio.update({
      where: { patrimonioId: bens[0]!.id },
      data: { depreciacaoAcumuladaAtual: new Prisma.Decimal("20") },
    });
    await post("", {
      ...body(),
      versaoPrevia: valida.body.dados.versaoPrevia,
      chaveIdempotencia: randomUUID(),
    }).expect(409);
    expect(await db.reavaliacaoPatrimonio.count()).toBe(0);
  });

  it("recusa confirmação quando a baixa ocorre depois da prévia", async () => {
    const previa = await post("/previa", body()).expect(200);
    await db.patrimonio.update({
      where: { id: bens[0]!.id },
      data: { status: "BAIXADO" },
    });
    const resposta = await post("", {
      ...body(),
      versaoPrevia: previa.body.dados.versaoPrevia,
      chaveIdempotencia: randomUUID(),
    }).expect(409);
    expect(resposta.body.codigo).toBe("REAVALIACAO_IMPEDIDA");
    expect(await db.reavaliacaoPatrimonio.count()).toBe(0);
  });

  it("desfaz todo o pedido se o segundo parâmetro falhar", async () => {
    const previa = await post("/previa", body()).expect(200);
    const original = ReavaliacoesRepository.prototype.criarParametro;
    let chamadas = 0;
    const falha = jest
      .spyOn(ReavaliacoesRepository.prototype, "criarParametro")
      .mockImplementation(function (this: ReavaliacoesRepository, dados) {
        chamadas += 1;
        if (chamadas === 2) throw new Error("Falha de teste no segundo bem");
        return original.call(this, dados);
      });
    try {
      await post("", {
        ...body(),
        versaoPrevia: previa.body.dados.versaoPrevia,
        chaveIdempotencia: randomUUID(),
      }).expect(500);
    } finally {
      falha.mockRestore();
    }
    expect(await db.reavaliacaoPatrimonio.count()).toBe(0);
    for (const bem of bens.slice(0, 2)) {
      expect(
        await db.parametroDepreciacao.count({
          where: { patrimonioId: bem.id, dataFim: null },
        }),
      ).toBe(1);
      expect(
        (
          await db.situacaoContabilPatrimonio.findUniqueOrThrow({
            where: { patrimonioId: bem.id },
          })
        ).depreciacaoAcumuladaAtual.toString(),
      ).toBe("10");
    }
  });

  it("serializa duas confirmações concorrentes do mesmo bem", async () => {
    const previa = await post("/previa", body()).expect(200);
    const pedido = {
      ...body(),
      versaoPrevia: previa.body.dados.versaoPrevia,
    };
    const respostas = await Promise.all([
      post("", { ...pedido, chaveIdempotencia: randomUUID() }),
      post("", { ...pedido, chaveIdempotencia: randomUUID() }),
    ]);
    expect(respostas.map((resposta) => resposta.status).sort()).toEqual([
      201, 409,
    ]);
    expect(await db.reavaliacaoPatrimonio.count()).toBe(2);
    for (const bem of bens.slice(0, 2)) {
      expect(
        await db.parametroDepreciacao.count({
          where: { patrimonioId: bem.id, dataFim: null },
        }),
      ).toBe(1);
    }
  });

  it("a depreciação da competência seguinte usa o novo parâmetro e o novo residual", async () => {
    const previa = await post("/previa", body()).expect(200);
    await post("", {
      ...body(),
      versaoPrevia: previa.body.dados.versaoPrevia,
      chaveIdempotencia: randomUUID(),
    }).expect(201);
    const diretor = await db.usuario.findUniqueOrThrow({
      where: { email: "diretor.reavaliacoes@example.com" },
    });
    const inicioProxima = new Date(`${dia.slice(0, 7)}-01T12:00:00.000Z`);
    inicioProxima.setUTCMonth(inicioProxima.getUTCMonth() + 1);
    const competencia = inicioProxima.toISOString().slice(0, 7);
    const repository = new DepreciacoesRepository(db);
    const [linha] = await repository.bloquearAcervo(
      new Date(`${competencia}-01T00:00:00.000Z`),
      bens[0]!.id,
    );
    expect(linha?.dataInicio).toEqual(new Date(`${dia}T00:00:00.000Z`));
    expect(linha?.valorResidual?.toString()).toBe("150");
    const calculo = calcularDepreciacao(linha!);
    expect(calculo.valorDepreciado.toString()).toBe("17.5");
    expect(calculo.valorContabilNovo.toString()).toBe("1182.5");
    await repository.persistirEmLote({
      calculos: [calculo],
      competencia: new Date(`${competencia}-01T00:00:00.000Z`),
      instante: new Date(),
      comissaoId,
      usuarioId: diretor.id,
    });
    expect(
      await db.depreciacaoPatrimonio.count({
        where: { patrimonioId: bens[0]!.id },
      }),
    ).toBe(2);
    expect(
      (
        await db.situacaoContabilPatrimonio.findUniqueOrThrow({
          where: { patrimonioId: bens[0]!.id },
        })
      ).depreciacaoAcumuladaAtual.toString(),
    ).toBe("17.5");
  });
});
