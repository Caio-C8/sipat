import type { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import {
  BaixarPatrimonioResponseSchema,
  CABECALHO_CSRF,
  ConsultarBaixaPatrimonioResponseSchema,
  LIMITE_BYTES_DOCUMENTO_BAIXA_PATRIMONIO,
} from "@repo/contracts";
import cookieParser from "cookie-parser";
import { Readable } from "node:stream";
import request from "supertest";
import { AppModule } from "../src/app.module";
import { DATABASE_CLIENT } from "../src/common/database/database.constants";
import { configurarCors } from "../src/configurar-cors";
import { calcularHashTokenSessao } from "../src/modules/auth/token-sessao";
import { BaixasService } from "../src/modules/baixas/baixas.service";

const ADMIN_ID = "00000000-0000-4000-8000-000000000001";
const DIRETOR_ID = "00000000-0000-4000-8000-000000000002";
const PATRIMONIO_ID = "00000000-0000-4000-8000-000000000003";
const COMISSAO_ID = "00000000-0000-4000-8000-000000000004";
const BAIXA_ID = "00000000-0000-4000-8000-000000000005";
const ORIGEM = "http://localhost:3000";

function baixa() {
  return {
    id: BAIXA_ID,
    dataBaixa: new Date("2026-10-27T00:00:00.000Z"),
    tipo: "ALIENACAO" as const,
    motivo: "Alienação autorizada",
    observacao: null,
    caminhoAnexoDocumento: "uploads/baixas/documento.pdf",
    createdById: DIRETOR_ID,
    createdAt: new Date("2026-10-27T12:00:00.000Z"),
    patrimonio: {
      id: PATRIMONIO_ID,
      numeroPatrimonio: "123",
      descricao: "Notebook",
    },
    comissao: { id: COMISSAO_ID, nome: "Comissão" },
  };
}

describe("baixas patrimoniais", () => {
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
    criar: jest.fn(),
    consultar: jest.fn(),
    abrirDocumento: jest.fn(),
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
      .overrideProvider(BaixasService)
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
    service.criar.mockResolvedValue(baixa());
    service.consultar.mockResolvedValue(baixa());
    service.abrirDocumento.mockResolvedValue({
      conteudo: Readable.from("%PDF-1.7"),
      tamanho: 8,
    });
  });

  afterAll(async () => app.close());

  const cookie = (token: string) => `sipat_session=${token}`;
  const rota = `/api/patrimonios/${PATRIMONIO_ID}/baixa`;

  it("aplica 401 ao anônimo, 403 ao administrador e permite o diretor", async () => {
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
      ConsultarBaixaPatrimonioResponseSchema.safeParse(diretor.body).success,
    ).toBe(true);
  });

  it("protege a criação com CSRF e deriva a identidade da sessão", async () => {
    const dados = JSON.stringify({
      dataBaixa: "2026-10-27",
      tipo: "ALIENACAO",
      motivo: "Alienação autorizada",
      comissaoId: COMISSAO_ID,
    });
    const semCsrf = await request(app.getHttpServer())
      .post(rota)
      .set("Cookie", cookie(tokenDiretor))
      .set("Origin", ORIGEM)
      .field("dados", dados);
    const criado = await request(app.getHttpServer())
      .post(rota)
      .set("Cookie", cookie(tokenDiretor))
      .set("Origin", ORIGEM)
      .set(CABECALHO_CSRF, "1")
      .field("dados", dados)
      .attach("documento", Buffer.from("%PDF-1.7"), "documento.pdf");

    expect(semCsrf.status).toBe(403);
    expect(criado.status).toBe(201);
    expect(BaixarPatrimonioResponseSchema.safeParse(criado.body).success).toBe(
      true,
    );
    expect(service.criar).toHaveBeenCalledWith(
      PATRIMONIO_ID,
      expect.objectContaining({ dados }),
      expect.objectContaining({ mimetype: "application/pdf" }),
      expect.objectContaining({ id: DIRETOR_ID }),
    );
  });

  it("aplica o limite multipart antes do service", async () => {
    const resposta = await request(app.getHttpServer())
      .post(rota)
      .set("Cookie", cookie(tokenDiretor))
      .set("Origin", ORIGEM)
      .set(CABECALHO_CSRF, "1")
      .field("dados", "{}")
      .attach(
        "documento",
        Buffer.alloc(LIMITE_BYTES_DOCUMENTO_BAIXA_PATRIMONIO + 1),
        "grande.pdf",
      );

    expect(resposta.status).toBe(413);
    expect(service.criar).not.toHaveBeenCalled();
  });

  it("transmite o PDF com headers privados e não expõe a chave persistida", async () => {
    const resposta = await request(app.getHttpServer())
      .get(`${rota}/anexo`)
      .set("Cookie", cookie(tokenDiretor));

    expect(resposta.status).toBe(200);
    expect(resposta.headers["content-type"]).toContain("application/pdf");
    expect(resposta.headers["cache-control"]).toBe("private, no-store");
    expect(resposta.headers["content-disposition"]).toContain(
      `baixa-${PATRIMONIO_ID}.pdf`,
    );
    expect(
      JSON.stringify(
        (
          await request(app.getHttpServer())
            .get(rota)
            .set("Cookie", cookie(tokenDiretor))
        ).body,
      ),
    ).not.toContain("uploads/baixas");
  });

  it("não expõe rotas de alteração, exclusão ou estorno", async () => {
    const patch = await request(app.getHttpServer())
      .patch(rota)
      .set("Cookie", cookie(tokenDiretor))
      .set("Origin", ORIGEM)
      .set(CABECALHO_CSRF, "1")
      .send({});
    const excluir = await request(app.getHttpServer())
      .delete(rota)
      .set("Cookie", cookie(tokenDiretor))
      .set("Origin", ORIGEM)
      .set(CABECALHO_CSRF, "1");

    expect(patch.status).toBe(404);
    expect(excluir.status).toBe(404);
  });
});
