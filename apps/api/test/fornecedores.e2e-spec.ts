import type { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import {
  CABECALHO_CSRF,
  FornecedorDetalheSchema,
  ListarFornecedoresResponseSchema,
  RespostaErroSchema,
} from "@repo/contracts";
import cookieParser from "cookie-parser";
import request from "supertest";
import { AppModule } from "../src/app.module";
import { DATABASE_CLIENT } from "../src/common/database/database.constants";
import { configurarCors } from "../src/configurar-cors";
import { calcularHashTokenSessao } from "../src/modules/auth/token-sessao";

const ADMIN_ID = "28df5e9c-3e60-4a8e-a4d4-8ca70221f4f0";
const DIRETOR_ID = "c5c3cc23-a215-4bba-9ae0-671596433a36";
const FORNECEDOR_ID = "6c167f7a-0e4b-46bb-8c78-bc33585c91fa";
const OUTRO_FORNECEDOR_ID = "24df3a43-5c02-47fb-ab92-03757a058f9f";
const CNPJ = "11222333000181";
const OUTRO_CNPJ = "11444777000161";
const ORIGEM = "http://localhost:3000";

type FornecedorMemoria = {
  id: string;
  razaoSocial: string;
  nomeFantasia: string | null;
  nomeRepresentante: string | null;
  cnpj: string | null;
  email: string | null;
  telefone: string | null;
  endereco: string | null;
  ativo: boolean;
  createdAt: Date;
  updatedAt: Date | null;
  createdById: string;
};

function fornecedorBase(
  sobrescritas: Partial<FornecedorMemoria> = {},
): FornecedorMemoria {
  return {
    id: FORNECEDOR_ID,
    razaoSocial: "Fornecedor de Teste Ltda.",
    nomeFantasia: "Fornecedor Teste",
    nomeRepresentante: "Representante",
    cnpj: CNPJ,
    email: "contato@example.com",
    telefone: "(34) 3333-3333",
    endereco: "Rua de Teste, 1",
    ativo: true,
    createdAt: new Date("2026-10-19T12:00:00.000Z"),
    updatedAt: null,
    createdById: ADMIN_ID,
    ...sobrescritas,
  };
}

describe("gestão de fornecedores", () => {
  let app: INestApplication;
  let fornecedores: FornecedorMemoria[];
  const tokenAdministrador = "A".repeat(43);
  const tokenDiretor = "B".repeat(43);

  const database = {
    $connect: jest.fn(),
    $disconnect: jest.fn(),
    notaFiscal: { findMany: jest.fn().mockResolvedValue([]) },
    sessaoUsuario: {
      findUnique: jest.fn(),
      updateMany: jest.fn(),
    },
    fornecedor: {
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
            trocaSenhaObrigatoria: false,
          },
        };
      },
    );
    database.fornecedor.findUnique.mockImplementation(
      ({ where }: { where: { id?: string; cnpj?: string } }) =>
        fornecedores.find(
          (fornecedor) =>
            (where.id !== undefined && fornecedor.id === where.id) ||
            (where.cnpj !== undefined && fornecedor.cnpj === where.cnpj),
        ) ?? null,
    );
    database.fornecedor.findMany.mockImplementation(
      ({
        where,
        skip,
        take,
      }: {
        where: {
          ativo?: boolean;
          OR?: Array<Record<string, { contains: string }>>;
        };
        skip: number;
        take: number;
      }) =>
        fornecedores
          .filter((fornecedor) => {
            if (where.ativo !== undefined && fornecedor.ativo !== where.ativo) {
              return false;
            }
            if (where.OR === undefined) return true;
            return where.OR.some((condicao) => {
              const busca =
                Object.values(condicao)[0]?.contains.toLowerCase() ?? "";
              return [
                fornecedor.razaoSocial,
                fornecedor.nomeFantasia,
                fornecedor.nomeRepresentante,
                fornecedor.cnpj,
                fornecedor.email,
              ].some((valor) => valor?.toLowerCase().includes(busca));
            });
          })
          .sort(
            (primeiro, segundo) =>
              segundo.createdAt.getTime() - primeiro.createdAt.getTime() ||
              segundo.id.localeCompare(primeiro.id),
          )
          .slice(skip, skip + take),
    );
    database.fornecedor.count.mockImplementation(
      ({ where }: { where: { ativo?: boolean } }) =>
        fornecedores.filter(
          (fornecedor) =>
            where.ativo === undefined || fornecedor.ativo === where.ativo,
        ).length,
    );
    database.fornecedor.create.mockImplementation(
      ({ data }: { data: Record<string, unknown> }) => {
        const createdBy = data.createdBy as { connect: { id: string } };
        const criado = fornecedorBase({
          id: OUTRO_FORNECEDOR_ID,
          razaoSocial: data.razaoSocial as string,
          nomeFantasia: (data.nomeFantasia as string | undefined) ?? null,
          nomeRepresentante:
            (data.nomeRepresentante as string | undefined) ?? null,
          cnpj: (data.cnpj as string | undefined) ?? null,
          email: (data.email as string | undefined) ?? null,
          telefone: (data.telefone as string | undefined) ?? null,
          endereco: (data.endereco as string | undefined) ?? null,
          ativo: data.ativo as boolean,
          createdById: createdBy.connect.id,
        });
        fornecedores.push(criado);
        return criado;
      },
    );
    database.fornecedor.update.mockImplementation(
      ({
        where,
        data,
      }: {
        where: { id: string };
        data: Partial<FornecedorMemoria>;
      }) => {
        const indice = fornecedores.findIndex(
          (fornecedor) => fornecedor.id === where.id,
        );
        if (indice < 0) throw new Error("Registro não encontrado");
        fornecedores[indice] = { ...fornecedores[indice]!, ...data };
        return fornecedores[indice];
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
    fornecedores = [fornecedorBase()];
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
    const anonimo = await request(app.getHttpServer()).get("/api/fornecedores");
    const diretor = await request(app.getHttpServer())
      .get("/api/fornecedores")
      .set("Cookie", cookie(tokenDiretor));
    const administrador =
      await requisicaoAdministrador().get("/api/fornecedores");

    expect(anonimo.status).toBe(401);
    expect(diretor.status).toBe(403);
    expect(administrador.status).toBe(200);
    esperarCodigo(anonimo, "NAO_AUTENTICADO");
    esperarCodigo(diretor, "ACESSO_NEGADO");
  });

  it("lista com paginação, busca, situação e ordem determinística", async () => {
    fornecedores.push(
      fornecedorBase({
        id: OUTRO_FORNECEDOR_ID,
        razaoSocial: "Outro fornecedor",
        cnpj: OUTRO_CNPJ,
        ativo: false,
      }),
    );

    const resposta = await requisicaoAdministrador().get(
      "/api/fornecedores?pagina=1&limite=20&busca=11.444.777%2F0001-61&ativo=false",
    );

    expect(resposta.status).toBe(200);
    expect(
      ListarFornecedoresResponseSchema.safeParse(resposta.body).success,
    ).toBe(true);
    expect(resposta.body.dados).toHaveLength(1);
    expect(database.fornecedor.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        skip: 0,
        take: 20,
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      }),
    );
  });

  it("normaliza CNPJ e contato, cria ativo e deriva auditoria", async () => {
    const resposta = await requisicaoAdministrador()
      .post("/api/fornecedores")
      .send({
        razaoSocial: " Novo Fornecedor Ltda. ",
        cnpj: "11.444.777/0001-61",
        email: " CONTATO@EXAMPLE.COM ",
      });

    expect(resposta.status).toBe(201);
    expect(FornecedorDetalheSchema.safeParse(resposta.body.dados).success).toBe(
      true,
    );
    expect(resposta.body.dados).toMatchObject({
      razaoSocial: "Novo Fornecedor Ltda.",
      cnpj: OUTRO_CNPJ,
      email: "contato@example.com",
      ativo: true,
      createdById: ADMIN_ID,
    });
  });

  it("rejeita CNPJ inválido e duplicado", async () => {
    const invalido = await requisicaoAdministrador()
      .post("/api/fornecedores")
      .send({ razaoSocial: "Inválido", cnpj: "12.345.678/0001-00" });
    const duplicado = await requisicaoAdministrador()
      .post("/api/fornecedores")
      .send({ razaoSocial: "Duplicado", cnpj: "11.222.333/0001-81" });

    expect(invalido.status).toBe(400);
    expect(duplicado.status).toBe(409);
    esperarCodigo(invalido, "VALIDACAO_ENTRADA_INVALIDA");
    esperarCodigo(duplicado, "CNPJ_FORNECEDOR_JA_EXISTENTE");
  });

  it("altera, limpa contato, inativa e mantém consultável", async () => {
    const alterado = await requisicaoAdministrador()
      .patch(`/api/fornecedores/${FORNECEDOR_ID}`)
      .send({ razaoSocial: "Nome alterado", email: null });
    const inativado = await requisicaoAdministrador()
      .patch(`/api/fornecedores/${FORNECEDOR_ID}/situacao`)
      .send({ ativo: false });
    const consulta = await requisicaoAdministrador().get(
      `/api/fornecedores/${FORNECEDOR_ID}`,
    );

    expect(alterado.status).toBe(200);
    expect(alterado.body.dados).toMatchObject({
      razaoSocial: "Nome alterado",
      email: null,
    });
    expect(inativado.status).toBe(200);
    expect(consulta.status).toBe(200);
    expect(consulta.body.dados).toMatchObject({
      id: FORNECEDOR_ID,
      ativo: false,
    });
    expect(fornecedores).toHaveLength(1);
  });

  it("rejeita PATCH vazio e fornecedor inexistente", async () => {
    const vazio = await requisicaoAdministrador()
      .patch(`/api/fornecedores/${FORNECEDOR_ID}`)
      .send({});
    const inexistente = await requisicaoAdministrador().get(
      "/api/fornecedores/7ce084e2-e31b-423d-ac44-03f7829a4658",
    );

    expect(vazio.status).toBe(400);
    expect(inexistente.status).toBe(404);
    esperarCodigo(vazio, "VALIDACAO_ENTRADA_INVALIDA");
    esperarCodigo(inexistente, "FORNECEDOR_NAO_ENCONTRADO");
  });
});
