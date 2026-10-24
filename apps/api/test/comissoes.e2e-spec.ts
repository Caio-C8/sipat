import { ConflictException, type INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import {
  CABECALHO_CSRF,
  ComissaoDetalheSchema,
  ListarComissoesResponseSchema,
  MembroComissaoResponseSchema,
  RespostaErroSchema,
} from "@repo/contracts";
import cookieParser from "cookie-parser";
import request from "supertest";
import { AppModule } from "../src/app.module";
import { DATABASE_CLIENT } from "../src/common/database/database.constants";
import { configurarCors } from "../src/configurar-cors";
import { calcularHashTokenSessao } from "../src/modules/auth/token-sessao";
import { ComissoesService } from "../src/modules/comissoes/comissoes.service";
import type {
  ComissaoDetalhePayload,
  MembroComissaoPayload,
} from "../src/modules/comissoes/types";

const ADMIN_ID = "28df5e9c-3e60-4a8e-a4d4-8ca70221f4f0";
const DIRETOR_ID = "c5c3cc23-a215-4bba-9ae0-671596433a36";
const COMISSAO_ID = "6c167f7a-0e4b-46bb-8c78-bc33585c91fa";
const MEMBRO_ID = "24df3a43-5c02-47fb-ab92-03757a058f9f";
const RESPONSAVEL_ID = "7ce084e2-e31b-423d-ac44-03f7829a4658";
const ORIGEM = "http://localhost:3000";

function membroBase(): MembroComissaoPayload {
  return {
    id: MEMBRO_ID,
    tipoMembroComissao: "MEMBRO",
    responsavel: {
      id: RESPONSAVEL_ID,
      nome: "Responsável",
      matricula: "MAT-001",
      ativo: true,
    },
    createdAt: new Date("2026-10-24T12:00:00.000Z"),
    updatedAt: null,
  };
}

function comissaoBase(): ComissaoDetalhePayload {
  return {
    id: COMISSAO_ID,
    nome: "Comissão de inventário",
    descricao: null,
    numeroAto: "Portaria 10/2026",
    dataVigenciaInicio: new Date("2026-01-01T00:00:00.000Z"),
    dataVigenciaFim: new Date("2026-12-31T00:00:00.000Z"),
    createdById: ADMIN_ID,
    createdAt: new Date("2026-10-24T12:00:00.000Z"),
    updatedAt: null,
    membros: [membroBase()],
    _count: {
      transferencias: 0,
      emprestimos: 0,
      manutencoes: 0,
      inventarios: 0,
      baixas: 0,
      devolucoes: 0,
      depreciacoes: 0,
      reavaliacoes: 0,
    },
  };
}

describe("gestão de comissões", () => {
  let app: INestApplication;
  const tokenAdministrador = "A".repeat(43);
  const tokenDiretor = "B".repeat(43);

  const database = {
    $connect: jest.fn(),
    $disconnect: jest.fn(),
    sessaoUsuario: {
      findUnique: jest.fn(),
      updateMany: jest.fn(),
    },
  };
  const comissoesService = {
    listar: jest.fn(),
    consultar: jest.fn(),
    criar: jest.fn(),
    alterar: jest.fn(),
    adicionarMembro: jest.fn(),
    alterarMembro: jest.fn(),
    removerMembro: jest.fn(),
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
        const administrador = perfil === "ADMINISTRADOR";
        return {
          id: administrador
            ? "00000000-0000-4000-8000-000000000001"
            : "00000000-0000-4000-8000-000000000002",
          expiraAt: new Date("2999-01-01T00:00:00.000Z"),
          ultimaAtividadeAt: new Date("2998-01-01T00:00:00.000Z"),
          revogadoAt: null,
          usuario: {
            id: administrador ? ADMIN_ID : DIRETOR_ID,
            nome: administrador ? "Administrador" : "Diretor",
            email: administrador ? "admin@example.com" : "diretor@example.com",
            perfil,
            ativo: true,
          },
        };
      },
    );

    const module = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(DATABASE_CLIENT)
      .useValue(database)
      .overrideProvider(ComissoesService)
      .useValue(comissoesService)
      .compile();

    app = module.createNestApplication();
    app.use(cookieParser());
    app.setGlobalPrefix("api");
    configurarCors(app, `${ORIGEM},http://localhost:8081`);
    await app.init();
  });

  beforeEach(() => {
    jest.clearAllMocks();
    comissoesService.listar.mockResolvedValue({
      items: [comissaoBase()],
      total: 1,
      pagina: 1,
      ultimaPagina: 1,
      limite: 20,
    });
    comissoesService.consultar.mockResolvedValue(comissaoBase());
    comissoesService.criar.mockResolvedValue(comissaoBase());
    comissoesService.alterar.mockResolvedValue(comissaoBase());
    comissoesService.adicionarMembro.mockResolvedValue(membroBase());
    comissoesService.alterarMembro.mockResolvedValue({
      ...membroBase(),
      tipoMembroComissao: "PRESIDENTE",
    });
    comissoesService.removerMembro.mockResolvedValue(undefined);
  });

  afterAll(async () => app.close());

  function cookie(token: string): string {
    return `sipat_session=${token}`;
  }

  function requisicaoAdministrador() {
    return {
      get: (path: string) =>
        request(app.getHttpServer())
          .get(path)
          .set("Cookie", cookie(tokenAdministrador)),
      post: (path: string) =>
        request(app.getHttpServer())
          .post(path)
          .set("Cookie", cookie(tokenAdministrador))
          .set("Origin", ORIGEM)
          .set(CABECALHO_CSRF, "1"),
      patch: (path: string) =>
        request(app.getHttpServer())
          .patch(path)
          .set("Cookie", cookie(tokenAdministrador))
          .set("Origin", ORIGEM)
          .set(CABECALHO_CSRF, "1"),
      delete: (path: string) =>
        request(app.getHttpServer())
          .delete(path)
          .set("Cookie", cookie(tokenAdministrador))
          .set("Origin", ORIGEM)
          .set(CABECALHO_CSRF, "1"),
    };
  }

  function esperarCodigo(resposta: request.Response, codigo: string) {
    const resultado = RespostaErroSchema.safeParse(resposta.body);
    expect(resultado.success).toBe(true);
    if (resultado.success) expect(resultado.data.codigo).toBe(codigo);
  }

  it("aplica 401 ao anônimo, 403 ao diretor e permite o administrador", async () => {
    const anonimo = await request(app.getHttpServer()).get("/api/comissoes");
    const diretor = await request(app.getHttpServer())
      .get("/api/comissoes")
      .set("Cookie", cookie(tokenDiretor));
    const administrador = await requisicaoAdministrador().get("/api/comissoes");

    expect(anonimo.status).toBe(401);
    expect(diretor.status).toBe(403);
    expect(administrador.status).toBe(200);
    expect(
      ListarComissoesResponseSchema.safeParse(administrador.body).success,
    ).toBe(true);
    esperarCodigo(anonimo, "NAO_AUTENTICADO");
    esperarCodigo(diretor, "ACESSO_NEGADO");
  });

  it("valida o body, aplica CSRF e deriva a auditoria da sessão", async () => {
    const semCsrf = await request(app.getHttpServer())
      .post("/api/comissoes")
      .set("Cookie", cookie(tokenAdministrador))
      .set("Origin", ORIGEM)
      .send({
        nome: "Comissão",
        dataVigenciaInicio: "2026-01-01",
        dataVigenciaFim: "2026-12-31",
      });
    const invalido = await requisicaoAdministrador()
      .post("/api/comissoes")
      .send({
        nome: "Comissão",
        dataVigenciaInicio: "2026-12-31",
        dataVigenciaFim: "2026-01-01",
      });
    const criado = await requisicaoAdministrador()
      .post("/api/comissoes")
      .send({
        nome: "Comissão de inventário",
        numeroAto: "Portaria 10/2026",
        dataVigenciaInicio: "2026-01-01",
        dataVigenciaFim: "2026-12-31",
        membros: [{ responsavelId: RESPONSAVEL_ID, papel: "MEMBRO" }],
      });

    expect(semCsrf.status).toBe(403);
    expect(invalido.status).toBe(400);
    expect(criado.status).toBe(201);
    expect(ComissaoDetalheSchema.safeParse(criado.body.dados).success).toBe(
      true,
    );
    esperarCodigo(invalido, "VALIDACAO_ENTRADA_INVALIDA");
    expect(comissoesService.criar).toHaveBeenCalledWith(
      expect.objectContaining({ nome: "Comissão de inventário" }),
      expect.objectContaining({ id: ADMIN_ID, perfil: "ADMINISTRADOR" }),
    );
  });

  it("expõe detalhe e as três mutações de integrantes", async () => {
    const detalhe = await requisicaoAdministrador().get(
      `/api/comissoes/${COMISSAO_ID}`,
    );
    const adicionado = await requisicaoAdministrador()
      .post(`/api/comissoes/${COMISSAO_ID}/membros`)
      .send({ responsavelId: RESPONSAVEL_ID, papel: "MEMBRO" });
    const alterado = await requisicaoAdministrador()
      .patch(`/api/comissoes/${COMISSAO_ID}/membros/${MEMBRO_ID}`)
      .send({ papel: "PRESIDENTE" });
    const removido = await requisicaoAdministrador().delete(
      `/api/comissoes/${COMISSAO_ID}/membros/${MEMBRO_ID}`,
    );

    expect(detalhe.status).toBe(200);
    expect(ComissaoDetalheSchema.safeParse(detalhe.body.dados).success).toBe(
      true,
    );
    expect(adicionado.status).toBe(201);
    expect(
      MembroComissaoResponseSchema.safeParse(adicionado.body.dados).success,
    ).toBe(true);
    expect(alterado.status).toBe(200);
    expect(alterado.body.dados.papel).toBe("PRESIDENTE");
    expect(removido.status).toBe(204);
    expect(removido.body).toEqual({});
  });

  it("preserva o código público de conflito de presidente", async () => {
    comissoesService.adicionarMembro.mockRejectedValueOnce(
      new ConflictException({
        codigo: "PRESIDENTE_COMISSAO_JA_EXISTENTE",
        mensagem: "A comissão já possui um presidente.",
        erros: [],
      }),
    );

    const resposta = await requisicaoAdministrador()
      .post(`/api/comissoes/${COMISSAO_ID}/membros`)
      .send({ responsavelId: RESPONSAVEL_ID, papel: "PRESIDENTE" });

    expect(resposta.status).toBe(409);
    esperarCodigo(resposta, "PRESIDENTE_COMISSAO_JA_EXISTENTE");
  });
});
