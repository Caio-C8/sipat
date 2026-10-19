import type { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import {
  CABECALHO_CSRF,
  ListarResponsaveisResponseSchema,
  RespostaErroSchema,
  ResponsavelDetalheSchema,
} from "@repo/contracts";
import cookieParser from "cookie-parser";
import request from "supertest";
import { AppModule } from "../src/app.module";
import { DATABASE_CLIENT } from "../src/common/database/database.constants";
import { configurarCors } from "../src/configurar-cors";
import { calcularHashTokenSessao } from "../src/modules/auth/token-sessao";

const ADMIN_ID = "28df5e9c-3e60-4a8e-a4d4-8ca70221f4f0";
const DIRETOR_ID = "c5c3cc23-a215-4bba-9ae0-671596433a36";
const RESPONSAVEL_ID = "6c167f7a-0e4b-46bb-8c78-bc33585c91fa";
const OUTRO_RESPONSAVEL_ID = "24df3a43-5c02-47fb-ab92-03757a058f9f";
const ORIGEM = "http://localhost:3000";

type ResponsavelMemoria = {
  id: string;
  nome: string;
  matricula: string;
  ativo: boolean;
  createdAt: Date;
  updatedAt: Date | null;
  createdById: string;
};

function responsavelBase(
  sobrescritas: Partial<ResponsavelMemoria> = {},
): ResponsavelMemoria {
  return {
    id: RESPONSAVEL_ID,
    nome: "Responsável de Teste",
    matricula: "MAT-001",
    ativo: true,
    createdAt: new Date("2026-10-19T12:00:00.000Z"),
    updatedAt: null,
    createdById: ADMIN_ID,
    ...sobrescritas,
  };
}

describe("gestão de responsáveis", () => {
  let app: INestApplication;
  let responsaveis: ResponsavelMemoria[];
  const tokenAdministrador = "A".repeat(43);
  const tokenDiretor = "B".repeat(43);

  const database = {
    $connect: jest.fn(),
    $disconnect: jest.fn(),
    sessaoUsuario: {
      findUnique: jest.fn(),
      updateMany: jest.fn(),
    },
    responsavel: {
      create: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  };

  beforeAll(async () => {
    database.sessaoUsuario.findUnique.mockImplementation(
      ({ where }: { where: { tokenHash: string } }) => {
        const hashAdministrador = calcularHashTokenSessao(tokenAdministrador);
        const hashDiretor = calcularHashTokenSessao(tokenDiretor);
        const perfil =
          where.tokenHash === hashAdministrador
            ? "ADMINISTRADOR"
            : where.tokenHash === hashDiretor
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
    database.responsavel.findUnique.mockImplementation(
      ({ where }: { where: { id?: string; matricula?: string } }) =>
        responsaveis.find(
          (responsavel) =>
            (where.id !== undefined && responsavel.id === where.id) ||
            (where.matricula !== undefined &&
              responsavel.matricula === where.matricula),
        ) ?? null,
    );
    database.responsavel.findMany.mockImplementation(
      ({
        where,
        skip,
        take,
      }: {
        where: {
          ativo?: boolean;
          OR?: Array<{
            nome?: { contains: string };
            matricula?: { contains: string };
          }>;
        };
        skip: number;
        take: number;
      }) =>
        responsaveis
          .filter((responsavel) => {
            if (
              where.ativo !== undefined &&
              responsavel.ativo !== where.ativo
            ) {
              return false;
            }
            if (where.OR === undefined) return true;
            return where.OR.some((condicao) => {
              const busca = (
                condicao.nome?.contains ??
                condicao.matricula?.contains ??
                ""
              ).toLocaleLowerCase();
              return (
                responsavel.nome.toLocaleLowerCase().includes(busca) ||
                responsavel.matricula.toLocaleLowerCase().includes(busca)
              );
            });
          })
          .sort(
            (primeiro, segundo) =>
              segundo.createdAt.getTime() - primeiro.createdAt.getTime() ||
              segundo.id.localeCompare(primeiro.id),
          )
          .slice(skip, skip + take),
    );
    database.responsavel.count.mockImplementation(
      ({ where }: { where: { ativo?: boolean } }) =>
        responsaveis.filter(
          (responsavel) =>
            where.ativo === undefined || responsavel.ativo === where.ativo,
        ).length,
    );
    database.responsavel.create.mockImplementation(
      ({
        data,
      }: {
        data: {
          nome: string;
          matricula: string;
          ativo: boolean;
          createdBy: { connect: { id: string } };
        };
      }) => {
        const criado = responsavelBase({
          id: OUTRO_RESPONSAVEL_ID,
          nome: data.nome,
          matricula: data.matricula,
          ativo: data.ativo,
          createdById: data.createdBy.connect.id,
        });
        responsaveis.push(criado);
        return criado;
      },
    );
    database.responsavel.update.mockImplementation(
      ({
        where,
        data,
      }: {
        where: { id: string };
        data: Partial<ResponsavelMemoria>;
      }) => {
        const indice = responsaveis.findIndex(
          (responsavel) => responsavel.id === where.id,
        );
        if (indice < 0) throw new Error("Registro não encontrado");
        responsaveis[indice] = { ...responsaveis[indice]!, ...data };
        return responsaveis[indice];
      },
    );

    const module = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(DATABASE_CLIENT)
      .useValue(database)
      .compile();

    app = module.createNestApplication();
    app.use(cookieParser());
    app.setGlobalPrefix("api");
    configurarCors(app, `${ORIGEM},http://localhost:8081`);
    await app.init();
  });

  beforeEach(() => {
    responsaveis = [responsavelBase()];
    jest.clearAllMocks();
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
    };
  }

  function esperarCodigo(resposta: request.Response, codigo: string) {
    const resultado = RespostaErroSchema.safeParse(resposta.body);
    expect(resultado.success).toBe(true);
    if (resultado.success) expect(resultado.data.codigo).toBe(codigo);
  }

  it("aplica 401 ao anônimo, 403 ao diretor e permite o administrador", async () => {
    const anonimo = await request(app.getHttpServer()).get("/api/responsaveis");
    const diretor = await request(app.getHttpServer())
      .get("/api/responsaveis")
      .set("Cookie", cookie(tokenDiretor));
    const administrador =
      await requisicaoAdministrador().get("/api/responsaveis");

    expect(anonimo.status).toBe(401);
    expect(diretor.status).toBe(403);
    expect(administrador.status).toBe(200);
    esperarCodigo(anonimo, "NAO_AUTENTICADO");
    esperarCodigo(diretor, "ACESSO_NEGADO");
  });

  it("lista com paginação, busca, situação e ordem determinística", async () => {
    responsaveis.push(
      responsavelBase({
        id: OUTRO_RESPONSAVEL_ID,
        nome: "Outro responsável",
        matricula: "MAT-002",
        ativo: false,
      }),
    );

    const resposta = await requisicaoAdministrador().get(
      "/api/responsaveis?pagina=1&limite=20&busca=MAT-002&ativo=false",
    );

    expect(resposta.status).toBe(200);
    expect(
      ListarResponsaveisResponseSchema.safeParse(resposta.body).success,
    ).toBe(true);
    expect(resposta.body.dados).toHaveLength(1);
    expect(database.responsavel.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        skip: 0,
        take: 20,
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      }),
    );
  });

  it("cria ativo, exige matrícula e deriva auditoria da sessão", async () => {
    const invalido = await requisicaoAdministrador()
      .post("/api/responsaveis")
      .send({ nome: "Sem matrícula" });
    const resposta = await requisicaoAdministrador()
      .post("/api/responsaveis")
      .send({ nome: "Novo responsável", matricula: " MAT-002 " });

    expect(invalido.status).toBe(400);
    esperarCodigo(invalido, "VALIDACAO_ENTRADA_INVALIDA");
    expect(resposta.status).toBe(201);
    expect(
      ResponsavelDetalheSchema.safeParse(resposta.body.dados).success,
    ).toBe(true);
    expect(resposta.body.dados).toMatchObject({
      matricula: "MAT-002",
      ativo: true,
      createdById: ADMIN_ID,
    });
    expect(database.responsavel.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          createdBy: { connect: { id: ADMIN_ID } },
        }),
      }),
    );
  });

  it("rejeita matrícula duplicada na criação e na alteração", async () => {
    responsaveis.push(
      responsavelBase({
        id: OUTRO_RESPONSAVEL_ID,
        matricula: "MAT-002",
      }),
    );

    const criacao = await requisicaoAdministrador()
      .post("/api/responsaveis")
      .send({ nome: "Duplicado", matricula: "MAT-002" });
    const alteracao = await requisicaoAdministrador()
      .patch(`/api/responsaveis/${RESPONSAVEL_ID}`)
      .send({ matricula: "MAT-002" });

    expect(criacao.status).toBe(409);
    expect(alteracao.status).toBe(409);
    esperarCodigo(criacao, "MATRICULA_RESPONSAVEL_JA_EXISTENTE");
    esperarCodigo(alteracao, "MATRICULA_RESPONSAVEL_JA_EXISTENTE");
  });

  it("altera, inativa e mantém o responsável consultável", async () => {
    const alterado = await requisicaoAdministrador()
      .patch(`/api/responsaveis/${RESPONSAVEL_ID}`)
      .send({ nome: "Nome alterado" });
    const inativado = await requisicaoAdministrador()
      .patch(`/api/responsaveis/${RESPONSAVEL_ID}/situacao`)
      .send({ ativo: false });
    const consulta = await requisicaoAdministrador().get(
      `/api/responsaveis/${RESPONSAVEL_ID}`,
    );

    expect(alterado.status).toBe(200);
    expect(alterado.body.dados.nome).toBe("Nome alterado");
    expect(inativado.status).toBe(200);
    expect(inativado.body.dados.ativo).toBe(false);
    expect(consulta.status).toBe(200);
    expect(consulta.body.dados).toMatchObject({
      id: RESPONSAVEL_ID,
      ativo: false,
    });
    expect(responsaveis).toHaveLength(1);
  });

  it("rejeita PATCH vazio e responsável inexistente", async () => {
    const vazio = await requisicaoAdministrador()
      .patch(`/api/responsaveis/${RESPONSAVEL_ID}`)
      .send({});
    const inexistente = await requisicaoAdministrador().get(
      "/api/responsaveis/7ce084e2-e31b-423d-ac44-03f7829a4658",
    );

    expect(vazio.status).toBe(400);
    expect(inexistente.status).toBe(404);
    esperarCodigo(vazio, "VALIDACAO_ENTRADA_INVALIDA");
    esperarCodigo(inexistente, "RESPONSAVEL_NAO_ENCONTRADO");
  });
});
