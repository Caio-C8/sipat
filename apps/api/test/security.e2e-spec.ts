import { Controller, Get, Post } from "@nestjs/common";
import type { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import { CABECALHO_CSRF, RespostaErroSchema } from "@repo/contracts";
import cookieParser from "cookie-parser";
import request from "supertest";
import { AppModule } from "../src/app.module";
import { DATABASE_CLIENT } from "../src/common/database/database.constants";
import { configurarCors } from "../src/configurar-cors";
import { PerfisPermitidos } from "../src/modules/auth/decorators/perfis-permitidos.decorator";
import { Publica } from "../src/modules/auth/decorators/publica.decorator";
import { calcularHashTokenSessao } from "../src/modules/auth/token-sessao";

@Controller("test/seguranca")
class SegurancaTestController {
  @Get("protegida")
  protegida() {
    return { ok: true };
  }

  @Get("administrativa")
  @PerfisPermitidos("ADMINISTRADOR")
  administrativa() {
    return { ok: true };
  }

  @Post("administrativa")
  @PerfisPermitidos("ADMINISTRADOR")
  mutacaoAdministrativa() {
    return { ok: true };
  }

  @Post("publica")
  @Publica()
  mutacaoPublica() {
    return { ok: true };
  }
}

describe("barreira global de segurança", () => {
  let app: INestApplication;

  const tokens = {
    administrador: "A".repeat(43),
    diretor: "B".repeat(43),
    expirada: "C".repeat(43),
    revogada: "D".repeat(43),
    inativo: "E".repeat(43),
  } as const;

  const usuarioBase = {
    id: "28df5e9c-3e60-4a8e-a4d4-8ca70221f4f0",
    nome: "Maria da Silva",
    email: "maria@example.com",
    ativo: true,
    trocaSenhaObrigatoria: false,
  } as const;

  const sessoes = new Map([
    [
      calcularHashTokenSessao(tokens.administrador),
      {
        id: "00000000-0000-4000-8000-000000000001",
        expiraAt: new Date("2999-01-01T00:00:00.000Z"),
        ultimaAtividadeAt: new Date("2998-01-01T00:00:00.000Z"),
        revogadoAt: null,
        usuario: { ...usuarioBase, perfil: "ADMINISTRADOR" },
      },
    ],
    [
      calcularHashTokenSessao(tokens.diretor),
      {
        id: "00000000-0000-4000-8000-000000000002",
        expiraAt: new Date("2999-01-01T00:00:00.000Z"),
        ultimaAtividadeAt: new Date("2998-01-01T00:00:00.000Z"),
        revogadoAt: null,
        usuario: { ...usuarioBase, perfil: "DIRETOR_PATRIMONIO" },
      },
    ],
    [
      calcularHashTokenSessao(tokens.expirada),
      {
        id: "00000000-0000-4000-8000-000000000003",
        expiraAt: new Date("2000-01-01T00:00:00.000Z"),
        ultimaAtividadeAt: new Date("1999-01-01T00:00:00.000Z"),
        revogadoAt: null,
        usuario: { ...usuarioBase, perfil: "ADMINISTRADOR" },
      },
    ],
    [
      calcularHashTokenSessao(tokens.revogada),
      {
        id: "00000000-0000-4000-8000-000000000004",
        expiraAt: new Date("2999-01-01T00:00:00.000Z"),
        ultimaAtividadeAt: new Date("2998-01-01T00:00:00.000Z"),
        revogadoAt: new Date("2026-01-01T00:00:00.000Z"),
        usuario: { ...usuarioBase, perfil: "ADMINISTRADOR" },
      },
    ],
    [
      calcularHashTokenSessao(tokens.inativo),
      {
        id: "00000000-0000-4000-8000-000000000005",
        expiraAt: new Date("2999-01-01T00:00:00.000Z"),
        ultimaAtividadeAt: new Date("2998-01-01T00:00:00.000Z"),
        revogadoAt: null,
        usuario: { ...usuarioBase, perfil: "ADMINISTRADOR", ativo: false },
      },
    ],
  ]);

  beforeAll(async () => {
    const database = {
      $connect: jest.fn(),
      $disconnect: jest.fn(),
      notaFiscal: { findMany: jest.fn().mockResolvedValue([]) },
      sessaoUsuario: {
        findUnique: jest.fn(
          ({ where }: { where: { tokenHash: string } }) =>
            sessoes.get(where.tokenHash) ?? null,
        ),
      },
    };

    const module = await Test.createTestingModule({
      imports: [AppModule],
      controllers: [SegurancaTestController],
    })
      .overrideProvider(DATABASE_CLIENT)
      .useValue(database)
      .compile();

    app = module.createNestApplication();
    app.use(cookieParser());
    app.setGlobalPrefix("api");
    configurarCors(app, "http://localhost:3000,http://localhost:8081");
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  function cookie(token: string): string {
    return `sipat_session=${token}`;
  }

  async function esperarErro(
    resposta: request.Response,
    status: number,
    codigo: string,
  ) {
    expect(resposta.status).toBe(status);
    const resultado = RespostaErroSchema.safeParse(resposta.body);
    expect(resultado.success).toBe(true);
    if (resultado.success) {
      expect(resultado.data.codigo).toBe(codigo);
    }
  }

  it("mantém GET /api/health como rota pública", async () => {
    await request(app.getHttpServer()).get("/api/health").expect(200);
  });

  it("retorna 401 para rota protegida sem sessão", async () => {
    await esperarErro(
      await request(app.getHttpServer()).get("/api/test/seguranca/protegida"),
      401,
      "NAO_AUTENTICADO",
    );
  });

  it("administrador acessa rota administrativa", async () => {
    await request(app.getHttpServer())
      .get("/api/test/seguranca/administrativa")
      .set("Cookie", cookie(tokens.administrador))
      .expect(200, { ok: true });
  });

  it("diretor recebe 403 na rota administrativa", async () => {
    await esperarErro(
      await request(app.getHttpServer())
        .get("/api/test/seguranca/administrativa")
        .set("Cookie", cookie(tokens.diretor)),
      403,
      "ACESSO_NEGADO",
    );
  });

  it("nega por padrão uma rota protegida sem metadata de perfil", async () => {
    await esperarErro(
      await request(app.getHttpServer())
        .get("/api/test/seguranca/protegida")
        .set("Cookie", cookie(tokens.administrador)),
      403,
      "ACESSO_NEGADO",
    );
  });

  it.each([
    ["expirada", tokens.expirada],
    ["revogada", tokens.revogada],
    ["de usuário inativo", tokens.inativo],
  ])("retorna 401 para sessão %s", async (_caso, token) => {
    await esperarErro(
      await request(app.getHttpServer())
        .get("/api/test/seguranca/administrativa")
        .set("Cookie", cookie(token)),
      401,
      "NAO_AUTENTICADO",
    );
  });

  it("rejeita método mutável com CSRF inválido", async () => {
    await esperarErro(
      await request(app.getHttpServer())
        .post("/api/test/seguranca/administrativa")
        .set("Cookie", cookie(tokens.administrador))
        .set("Origin", "http://localhost:3000")
        .set(CABECALHO_CSRF, "0"),
      403,
      "ACESSO_NEGADO",
    );
  });

  it("executa autenticação antes do CSRF em método mutável", async () => {
    await esperarErro(
      await request(app.getHttpServer())
        .post("/api/test/seguranca/administrativa")
        .set("Origin", "https://origem-nao-permitida.example"),
      401,
      "NAO_AUTENTICADO",
    );
  });

  it("permite método mutável autorizado com Origin e header válidos", async () => {
    await request(app.getHttpServer())
      .post("/api/test/seguranca/administrativa")
      .set("Cookie", cookie(tokens.administrador))
      .set("Origin", "http://localhost:3000")
      .set(CABECALHO_CSRF, "1")
      .expect(201, { ok: true });
  });

  it("não permite que @Publica ignore automaticamente o CSRF", async () => {
    await esperarErro(
      await request(app.getHttpServer()).post("/api/test/seguranca/publica"),
      403,
      "ACESSO_NEGADO",
    );
  });
});
