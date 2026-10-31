import { randomUUID } from "node:crypto";
import type { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import { createDatabaseClient, type DatabaseClient } from "@repo/database";
import {
  CABECALHO_CSRF,
  ConsultarManutencaoResponseSchema,
  CriarManutencaoResponseSchema,
  EnviarDocumentoManutencaoResponseSchema,
  ListarManutencoesResponseSchema,
  RegistrarRetornoManutencaoResponseSchema,
  RespostaErroSchema,
} from "@repo/contracts";
import cookieParser from "cookie-parser";
import request from "supertest";
import { AppModule } from "../src/app.module";
import { DATABASE_CLIENT } from "../src/common/database/database.constants";
import { configurarCors } from "../src/configurar-cors";
import { calcularHashTokenSessao } from "../src/modules/auth/token-sessao";

const url = process.env.MANUTENCOES_INTEGRATION_DATABASE_URL;
const suite = url ? describe : describe.skip;
const ORIGEM = "http://localhost:3000";

suite("manutenções HTTP + PostgreSQL descartável", () => {
  jest.setTimeout(60_000);
  let app: INestApplication;
  let db: DatabaseClient;
  let adminCookie: string;
  let diretorCookie: string;
  let comissaoId: string;
  let setorId: string;
  let especieId: string;

  beforeAll(async () => {
    if (!url || !ehBancoIsolado(url))
      throw new Error(
        "O E2E só pode usar o PostgreSQL descartável de manutenção na porta 5434.",
      );
    db = createDatabaseClient(url);
    const modulo = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(DATABASE_CLIENT)
      .useValue(db)
      .compile();
    app = modulo.createNestApplication();
    app.use(cookieParser());
    app.setGlobalPrefix("api");
    configurarCors(app, `${ORIGEM},http://localhost:8081`);
    await app.init();
    const tag = randomUUID();
    const admin = await db.usuario.create({
      data: {
        nome: "Admin teste",
        email: `${tag}-admin@example.test`,
        senha: "hash",
        perfil: "ADMINISTRADOR",
        trocaSenhaObrigatoria: false,
      },
    });
    const diretor = await db.usuario.create({
      data: {
        nome: "Diretor teste",
        email: `${tag}-diretor@example.test`,
        senha: "hash",
        perfil: "DIRETOR_PATRIMONIO",
        trocaSenhaObrigatoria: false,
      },
    });
    async function sessao(usuarioId: string) {
      const token = Buffer.from(
        randomUUID().replace(/-/g, "").repeat(2).slice(0, 64),
        "hex",
      ).toString("base64url");
      const tokenHash = calcularHashTokenSessao(token);
      if (!tokenHash) throw new Error("Token de teste inválido.");
      await db.sessaoUsuario.create({
        data: {
          usuarioId,
          tokenHash,
          expiraAt: new Date(Date.now() + 3_600_000),
        },
      });
      return `sipat_session=${token}`;
    }
    adminCookie = await sessao(admin.id);
    diretorCookie = await sessao(diretor.id);
    const responsavel = await db.responsavel.create({
      data: {
        nome: "Responsável",
        matricula: tag.slice(0, 20),
        createdById: admin.id,
      },
    });
    const setor = await db.setor.create({
      data: {
        nome: "Setor HTTP",
        responsavelId: responsavel.id,
        createdById: admin.id,
      },
    });
    setorId = setor.id;
    const natureza = await db.natureza.create({
      data: {
        nome: `Natureza ${tag}`,
        nomeNormalizado: tag,
        createdById: admin.id,
      },
    });
    const especie = await db.especie.create({
      data: {
        nome: `Espécie ${tag}`,
        nomeNormalizado: tag,
        naturezaId: natureza.id,
        createdById: admin.id,
      },
    });
    especieId = especie.id;
    const comissao = await db.comissao.create({
      data: {
        nome: "Comissão HTTP",
        dataVigenciaInicio: new Date("2020-01-01T00:00:00.000Z"),
        dataVigenciaFim: new Date("2026-10-28T00:00:00.000Z"),
        createdById: admin.id,
      },
    });
    comissaoId = comissao.id;
  });
  afterAll(async () => app?.close());

  async function criarBem(createdById: string) {
    const numero = String(
      BigInt(Date.now()) + BigInt(Math.floor(Math.random() * 100_000)),
    );
    return db.patrimonio.create({
      data: {
        numeroPatrimonio: numero,
        tipoNumeroPatrimonial: "OFICIAL",
        descricao: `Bem HTTP ${numero}`,
        dataTombamento: new Date("2025-01-01T00:00:00.000Z"),
        valorIncorporacao: "1000",
        especieId,
        setorAtualId: setorId,
        createdById,
      },
    });
  }
  const post = (cookie: string, body: object) =>
    request(app.getHttpServer())
      .post("/api/manutencoes")
      .set("Cookie", cookie)
      .set("Origin", ORIGEM)
      .set(CABECALHO_CSRF, "1")
      .send(body);
  const get = (path: string, cookie: string) =>
    request(app.getHttpServer())
      .get(`/api/manutencoes${path}`)
      .set("Cookie", cookie);

  it("protege sessão, CSRF e oferece seletores aos dois perfis", async () => {
    await request(app.getHttpServer()).get("/api/manutencoes").expect(401);
    await get("", adminCookie).expect(200);
    await get("", diretorCookie).expect(200);
    await get("/opcoes/fornecedores", diretorCookie).expect(200);
    await get("/opcoes/comissoes?dataEnvio=2026-10-20", diretorCookie).expect(
      200,
    );
    await request(app.getHttpServer())
      .post("/api/manutencoes")
      .set("Cookie", adminCookie)
      .set("Origin", ORIGEM)
      .send({})
      .expect(403);
  });

  it("cria, consulta, revisa, recebe e transmite PDFs por rotas reais", async () => {
    const adminId = (
      await db.usuario.findFirstOrThrow({
        where: {
          perfil: "ADMINISTRADOR",
          email: { endsWith: "-admin@example.test" },
        },
        orderBy: { createdAt: "desc" },
      })
    ).id;
    const bem = await criarBem(adminId);
    const body = {
      chaveIdempotencia: randomUUID(),
      dataEnvio: "2026-10-20",
      comissaoId,
      itens: [
        { patrimonioId: bem.id, tipo: "CORRETIVA", descricaoProblema: "Falha" },
      ],
    };
    const criado = CriarManutencaoResponseSchema.parse(
      (await post(adminCookie, body).expect(201)).body,
    ).dados;
    const item = criado.itens[0]!;
    expect((await post(adminCookie, body).expect(409)).body.codigo).toBe(
      "OPERACAO_JA_PROCESSADA",
    );
    ListarManutencoesResponseSchema.parse(
      (await get("?busca=" + bem.numeroPatrimonio, diretorCookie).expect(200))
        .body,
    );
    ConsultarManutencaoResponseSchema.parse(
      (await get(`/${criado.id}`, diretorCookie).expect(200)).body,
    );
    await request(app.getHttpServer())
      .patch(`/api/manutencoes/${criado.id}/itens/${item.id}/orcamento`)
      .set("Cookie", diretorCookie)
      .set("Origin", ORIGEM)
      .set(CABECALHO_CSRF, "1")
      .send({
        versaoEsperada: 0,
        dataOrcamento: "2026-10-21",
        descricaoOrcamento: "Peças",
        valorOrcamento: "20",
      })
      .expect(200);
    const pdf = Buffer.from("%PDF-1.7\n1 0 obj\n<<>>\nendobj\n%%EOF");
    const doc = EnviarDocumentoManutencaoResponseSchema.parse(
      (
        await request(app.getHttpServer())
          .post(`/api/manutencoes/${criado.id}/documentos`)
          .set("Cookie", adminCookie)
          .set("Origin", ORIGEM)
          .set(CABECALHO_CSRF, "1")
          .field(
            "dados",
            JSON.stringify({ chaveIdempotencia: randomUUID(), fase: "PEDIDO" }),
          )
          .attach("documento", pdf, {
            filename: "pedido.pdf",
            contentType: "application/pdf",
          })
          .expect(201)
      ).body,
    ).dados;
    await get(`/${criado.id}/documentos/${doc.id}`, diretorCookie)
      .expect(200)
      .expect("Content-Type", /pdf/);
    await request(app.getHttpServer())
      .get(`/api/manutencoes/${criado.id}/documentos/${doc.id}`)
      .expect(401);
    const retorno = {
      chaveIdempotencia: randomUUID(),
      dataRetorno: "2026-10-22",
      descricaoServicoRealizado: "Conserto",
      valorRealizado: "20",
      garantia: null,
    };
    const recebido = RegistrarRetornoManutencaoResponseSchema.parse(
      (
        await request(app.getHttpServer())
          .post(`/api/manutencoes/${criado.id}/itens/${item.id}/retorno`)
          .set("Cookie", diretorCookie)
          .set("Origin", ORIGEM)
          .set(CABECALHO_CSRF, "1")
          .send(retorno)
          .expect(200)
      ).body,
    ).dados;
    expect(recebido.statusPedido).toBe("CONCLUIDA");
    expect(
      (await db.patrimonio.findUniqueOrThrow({ where: { id: bem.id } })).status,
    ).toBe("ATIVO");
    const repetido = await request(app.getHttpServer())
      .post(`/api/manutencoes/${criado.id}/itens/${item.id}/retorno`)
      .set("Cookie", diretorCookie)
      .set("Origin", ORIGEM)
      .set(CABECALHO_CSRF, "1")
      .send(retorno)
      .expect(409);
    expect(repetido.body.codigo).toBe("OPERACAO_JA_PROCESSADA");
    const invalido = await request(app.getHttpServer())
      .post(`/api/manutencoes/${criado.id}/documentos`)
      .set("Cookie", adminCookie)
      .set("Origin", ORIGEM)
      .set(CABECALHO_CSRF, "1")
      .field(
        "dados",
        JSON.stringify({
          chaveIdempotencia: randomUUID(),
          fase: "RECEBIMENTO",
          itemId: item.id,
        }),
      )
      .attach("documento", Buffer.from("texto"), {
        filename: "texto.txt",
        contentType: "text/plain",
      })
      .expect(415);
    RespostaErroSchema.parse(invalido.body);
  });

  it("permite criação ao diretor e orçamento e retorno ao administrador", async () => {
    const diretorId = (
      await db.usuario.findFirstOrThrow({
        where: {
          perfil: "DIRETOR_PATRIMONIO",
          email: { endsWith: "-diretor@example.test" },
        },
        orderBy: { createdAt: "desc" },
      })
    ).id;
    const bem = await criarBem(diretorId);
    const criado = CriarManutencaoResponseSchema.parse(
      (
        await post(diretorCookie, {
          chaveIdempotencia: randomUUID(),
          dataEnvio: "2026-10-20",
          comissaoId,
          itens: [{ patrimonioId: bem.id, tipo: "PREVENTIVA" }],
        }).expect(201)
      ).body,
    ).dados;
    const itemId = criado.itens[0]!.id;
    await request(app.getHttpServer())
      .patch(`/api/manutencoes/${criado.id}/itens/${itemId}/orcamento`)
      .set("Cookie", adminCookie)
      .set("Origin", ORIGEM)
      .set(CABECALHO_CSRF, "1")
      .send({
        versaoEsperada: 0,
        dataOrcamento: "2026-10-21",
        descricaoOrcamento: "Revisão",
        valorOrcamento: "0",
      })
      .expect(200);
    await request(app.getHttpServer())
      .post(`/api/manutencoes/${criado.id}/itens/${itemId}/retorno`)
      .set("Cookie", adminCookie)
      .set("Origin", ORIGEM)
      .set(CABECALHO_CSRF, "1")
      .send({
        chaveIdempotencia: randomUUID(),
        dataRetorno: "2026-10-22",
        descricaoServicoRealizado: "Revisão",
        valorRealizado: "0",
        garantia: null,
      })
      .expect(200);
    expect(
      (await db.patrimonio.findUniqueOrThrow({ where: { id: bem.id } })).status,
    ).toBe("ATIVO");
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
