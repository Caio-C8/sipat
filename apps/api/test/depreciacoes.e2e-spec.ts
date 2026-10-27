import type { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import {
  CABECALHO_CSRF,
  ExecutarDepreciacoesEmMassaResponseSchema,
  ListarDepreciacoesPendentesResponseSchema,
} from "@repo/contracts";
import cookieParser from "cookie-parser";
import request from "supertest";
import { AppModule } from "../src/app.module";
import { DATABASE_CLIENT } from "../src/common/database/database.constants";
import { configurarCors } from "../src/configurar-cors";
import { calcularHashTokenSessao } from "../src/modules/auth/token-sessao";
import { DepreciacoesService } from "../src/modules/depreciacoes/depreciacoes.service";

const ADMIN_ID = "00000000-0000-4000-8000-000000000001";
const DIRETOR_ID = "00000000-0000-4000-8000-000000000002";
const COMISSAO_ID = "00000000-0000-4000-8000-000000000003";
const ORIGEM = "http://localhost:3000";

describe("depreciações patrimoniais", () => {
  let app: INestApplication;
  const tokenAdministrador = "A".repeat(43);
  const tokenDiretor = "B".repeat(43);
  const database = {
    $connect: jest.fn(),
    $disconnect: jest.fn(),
    notaFiscal: { findMany: jest.fn().mockResolvedValue([]) },
    baixaPatrimonio: { findMany: jest.fn().mockResolvedValue([]) },
    sessaoUsuario: { findUnique: jest.fn(), updateMany: jest.fn() },
  };
  const service = {
    listarPendentes: jest.fn(),
    executarEmMassa: jest.fn(),
    executarIndividual: jest.fn(),
  };

  beforeAll(async () => {
    database.sessaoUsuario.findUnique.mockImplementation(
      ({ where }: { where: { tokenHash: string } }) => {
        const perfil =
          where.tokenHash === calcularHashTokenSessao(tokenAdministrador)
            ? "ADMINISTRADOR"
            : where.tokenHash === calcularHashTokenSessao(tokenDiretor)
              ? "DIRETOR_PATRIMONIO"
              : null;
        if (perfil === null) return null;
        const diretor = perfil === "DIRETOR_PATRIMONIO";
        return {
          id: diretor
            ? "00000000-0000-4000-8000-000000000010"
            : "00000000-0000-4000-8000-000000000011",
          expiraAt: new Date("2999-01-01T00:00:00.000Z"),
          ultimaAtividadeAt: new Date("2998-01-01T00:00:00.000Z"),
          revogadoAt: null,
          usuario: {
            id: diretor ? DIRETOR_ID : ADMIN_ID,
            nome: diretor ? "Diretor" : "Administrador",
            email: diretor ? "diretor@example.com" : "admin@example.com",
            perfil,
            ativo: true,
            trocaSenhaObrigatoria: false,
          },
        };
      },
    );
    const modulo = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(DATABASE_CLIENT)
      .useValue(database)
      .overrideProvider(DepreciacoesService)
      .useValue(service)
      .compile();
    app = modulo.createNestApplication();
    app.use(cookieParser());
    app.setGlobalPrefix("api");
    configurarCors(app, `${ORIGEM},http://localhost:8081`);
    await app.init();
  });

  beforeEach(() => {
    jest.clearAllMocks();
    service.listarPendentes.mockResolvedValue({
      items: [],
      total: 0,
      totalNoValorResidual: 0,
      pagina: 1,
      ultimaPagina: 1,
      limite: 20,
    });
    service.executarEmMassa.mockResolvedValue({
      competencia: "2026-10",
      comissao: { id: COMISSAO_ID, nome: "Comissão" },
      dataDepreciacao: "2026-10-27T12:00:00.000Z",
      quantidadeProcessada: 0,
      quantidadeAtingiuValorResidual: 0,
      quantidadesInelegiveis: {
        baixado: 0,
        semParametroVigente: 0,
        dataInicioNaoAtingida: 0,
        jaDepreciadoNaCompetencia: 0,
        valorResidualAtingido: 0,
      },
    });
  });

  afterAll(async () => app.close());

  const cookie = (token: string) => `sipat_session=${token}`;

  it("aplica 401 ao anônimo, 403 ao administrador e permite o diretor", async () => {
    const rota = "/api/depreciacoes/pendentes?competencia=2026-10";
    const anonimo = await request(app.getHttpServer()).get(rota);
    const administrador = await request(app.getHttpServer())
      .get(rota)
      .set("Cookie", cookie(tokenAdministrador));
    const diretor = await request(app.getHttpServer())
      .get(rota)
      .set("Cookie", cookie(tokenDiretor));

    expect(anonimo.status).toBe(401);
    expect(administrador.status).toBe(403);
    expect(diretor.status).toBe(200);
    expect(
      ListarDepreciacoesPendentesResponseSchema.safeParse(diretor.body).success,
    ).toBe(true);
  });

  it("protege a mutação com CSRF e deriva a identidade da sessão", async () => {
    const body = {
      competencia: "2026-10",
      comissaoId: COMISSAO_ID,
      confirmarIgnorarValorResidual: true,
    };
    const semCsrf = await request(app.getHttpServer())
      .post("/api/depreciacoes")
      .set("Cookie", cookie(tokenDiretor))
      .set("Origin", ORIGEM)
      .send(body);
    const resposta = await request(app.getHttpServer())
      .post("/api/depreciacoes")
      .set("Cookie", cookie(tokenDiretor))
      .set("Origin", ORIGEM)
      .set(CABECALHO_CSRF, "1")
      .send(body);

    expect(semCsrf.status).toBe(403);
    expect(resposta.status).toBe(201);
    expect(
      ExecutarDepreciacoesEmMassaResponseSchema.safeParse(resposta.body)
        .success,
    ).toBe(true);
    expect(service.executarEmMassa).toHaveBeenCalledWith(
      body,
      expect.objectContaining({ id: DIRETOR_ID }),
    );
  });

  it("rejeita propriedades extras e confirmação textual no boundary", async () => {
    const resposta = await request(app.getHttpServer())
      .post("/api/depreciacoes")
      .set("Cookie", cookie(tokenDiretor))
      .set("Origin", ORIGEM)
      .set(CABECALHO_CSRF, "1")
      .send({
        competencia: "2026-10",
        comissaoId: COMISSAO_ID,
        confirmarIgnorarValorResidual: "true",
        patrimonioIds: [],
      });

    expect(resposta.status).toBe(400);
    expect(service.executarEmMassa).not.toHaveBeenCalled();
  });
});
