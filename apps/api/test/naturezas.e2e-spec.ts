import type { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import {
  CABECALHO_CSRF,
  ListarNaturezasResponseSchema,
  NaturezaDetalheSchema,
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
const NATUREZA_ID = "6c167f7a-0e4b-46bb-8c78-bc33585c91fa";
const OUTRA_NATUREZA_ID = "24df3a43-5c02-47fb-ab92-03757a058f9f";
const ORIGEM = "http://localhost:3000";

type NaturezaMemoria = {
  id: string;
  nome: string;
  nomeNormalizado: string;
  descricao: string | null;
  createdAt: Date;
  updatedAt: Date | null;
  createdById: string;
};

function naturezaBase(
  sobrescritas: Partial<NaturezaMemoria> = {},
): NaturezaMemoria {
  return {
    id: NATUREZA_ID,
    nome: "Máquinas e equipamentos",
    nomeNormalizado: "MAQUINAS E EQUIPAMENTOS",
    descricao: "Bens de uso permanente",
    createdAt: new Date("2026-10-19T12:00:00.000Z"),
    updatedAt: null,
    createdById: ADMIN_ID,
    ...sobrescritas,
  };
}

describe("gestão de naturezas", () => {
  let app: INestApplication;
  let naturezas: NaturezaMemoria[];
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
    natureza: {
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
    database.natureza.findUnique.mockImplementation(
      ({ where }: { where: { id?: string; nomeNormalizado?: string } }) =>
        naturezas.find(
          (natureza) =>
            (where.id !== undefined && natureza.id === where.id) ||
            (where.nomeNormalizado !== undefined &&
              natureza.nomeNormalizado === where.nomeNormalizado),
        ) ?? null,
    );
    const filtrar = (where: {
      OR?: Array<{
        nome?: { contains: string };
        nomeNormalizado?: { contains: string };
      }>;
    }) =>
      naturezas.filter((natureza) =>
        where.OR === undefined
          ? true
          : where.OR.some((condicao) =>
              condicao.nome !== undefined
                ? natureza.nome
                    .toLocaleLowerCase()
                    .includes(condicao.nome.contains.toLocaleLowerCase())
                : natureza.nomeNormalizado.includes(
                    condicao.nomeNormalizado?.contains ?? "",
                  ),
            ),
      );
    database.natureza.findMany.mockImplementation(
      ({
        where,
        skip,
        take,
      }: {
        where: Parameters<typeof filtrar>[0];
        skip: number;
        take: number;
      }) =>
        filtrar(where)
          .sort(
            (primeiro, segundo) =>
              segundo.createdAt.getTime() - primeiro.createdAt.getTime() ||
              segundo.id.localeCompare(primeiro.id),
          )
          .slice(skip, skip + take),
    );
    database.natureza.count.mockImplementation(
      ({ where }: { where: Parameters<typeof filtrar>[0] }) =>
        filtrar(where).length,
    );
    database.natureza.create.mockImplementation(
      ({
        data,
      }: {
        data: {
          nome: string;
          nomeNormalizado: string;
          descricao?: string;
          createdBy: { connect: { id: string } };
        };
      }) => {
        const criada = naturezaBase({
          id: OUTRA_NATUREZA_ID,
          nome: data.nome,
          nomeNormalizado: data.nomeNormalizado,
          descricao: data.descricao ?? null,
          createdById: data.createdBy.connect.id,
        });
        naturezas.push(criada);
        return criada;
      },
    );
    database.natureza.update.mockImplementation(
      ({
        where,
        data,
      }: {
        where: { id: string };
        data: Partial<NaturezaMemoria>;
      }) => {
        const indice = naturezas.findIndex(
          (natureza) => natureza.id === where.id,
        );
        if (indice < 0) throw new Error("Registro não encontrado");
        naturezas[indice] = { ...naturezas[indice]!, ...data };
        return naturezas[indice];
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
    naturezas = [naturezaBase()];
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
    const anonimo = await request(app.getHttpServer()).get("/api/naturezas");
    const diretor = await request(app.getHttpServer())
      .get("/api/naturezas")
      .set("Cookie", cookie(tokenDiretor));
    const administrador = await requisicaoAdministrador().get("/api/naturezas");

    expect(anonimo.status).toBe(401);
    expect(diretor.status).toBe(403);
    expect(administrador.status).toBe(200);
    esperarCodigo(anonimo, "NAO_AUTENTICADO");
    esperarCodigo(diretor, "ACESSO_NEGADO");
  });

  it("lista com paginação, busca sem acento e ordem determinística", async () => {
    naturezas.push(
      naturezaBase({
        id: OUTRA_NATUREZA_ID,
        nome: "Móveis",
        nomeNormalizado: "MOVEIS",
      }),
    );

    const resposta = await requisicaoAdministrador().get(
      "/api/naturezas?pagina=1&limite=20&busca=moveis",
    );

    expect(resposta.status).toBe(200);
    expect(ListarNaturezasResponseSchema.safeParse(resposta.body).success).toBe(
      true,
    );
    expect(resposta.body.dados).toEqual([
      expect.objectContaining({ id: OUTRA_NATUREZA_ID, nome: "Móveis" }),
    ]);
    expect(database.natureza.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        skip: 0,
        take: 20,
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      }),
    );
  });

  it("normaliza o nome e deriva auditoria sem aceitar campos protegidos", async () => {
    const protegido = await requisicaoAdministrador()
      .post("/api/naturezas")
      .send({ nome: "Móveis", nomeNormalizado: "FORJADO" });
    const resposta = await requisicaoAdministrador()
      .post("/api/naturezas")
      .send({ nome: " Móveis ", descricao: "Bens móveis" });

    expect(protegido.status).toBe(400);
    esperarCodigo(protegido, "VALIDACAO_ENTRADA_INVALIDA");
    expect(resposta.status).toBe(201);
    expect(NaturezaDetalheSchema.safeParse(resposta.body.dados).success).toBe(
      true,
    );
    expect(resposta.body.dados).toMatchObject({
      nome: "Móveis",
      nomeNormalizado: "MOVEIS",
      createdById: ADMIN_ID,
    });
  });

  it("rejeita nomes equivalentes na criação e na alteração", async () => {
    const criacao = await requisicaoAdministrador()
      .post("/api/naturezas")
      .send({ nome: "maquinas e equipamentos" });
    naturezas.push(
      naturezaBase({
        id: OUTRA_NATUREZA_ID,
        nome: "Móveis",
        nomeNormalizado: "MOVEIS",
      }),
    );
    const alteracao = await requisicaoAdministrador()
      .patch(`/api/naturezas/${NATUREZA_ID}`)
      .send({ nome: "moveis" });

    expect(criacao.status).toBe(409);
    expect(alteracao.status).toBe(409);
    esperarCodigo(criacao, "NOME_NATUREZA_JA_EXISTENTE");
    esperarCodigo(alteracao, "NOME_NATUREZA_JA_EXISTENTE");
  });

  it("altera e mantém a natureza consultável sem exclusão", async () => {
    const alterada = await requisicaoAdministrador()
      .patch(`/api/naturezas/${NATUREZA_ID}`)
      .send({ nome: "Máquinas industriais", descricao: null });
    const consulta = await requisicaoAdministrador().get(
      `/api/naturezas/${NATUREZA_ID}`,
    );

    expect(alterada.status).toBe(200);
    expect(alterada.body.dados).toMatchObject({
      nome: "Máquinas industriais",
      nomeNormalizado: "MAQUINAS INDUSTRIAIS",
      descricao: null,
    });
    expect(consulta.status).toBe(200);
    expect(consulta.body.dados.id).toBe(NATUREZA_ID);
    expect(naturezas).toHaveLength(1);
  });

  it("rejeita PATCH vazio e natureza inexistente", async () => {
    const vazio = await requisicaoAdministrador()
      .patch(`/api/naturezas/${NATUREZA_ID}`)
      .send({});
    const inexistente = await requisicaoAdministrador().get(
      "/api/naturezas/7ce084e2-e31b-423d-ac44-03f7829a4658",
    );

    expect(vazio.status).toBe(400);
    expect(inexistente.status).toBe(404);
    esperarCodigo(vazio, "VALIDACAO_ENTRADA_INVALIDA");
    esperarCodigo(inexistente, "NATUREZA_NAO_ENCONTRADA");
  });
});
