import type { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import {
  CABECALHO_CSRF,
  EspecieDetalheSchema,
  ListarEspeciesResponseSchema,
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
const ESPECIE_ID = "e288f366-9f8e-46f9-804c-d5876aa74c78";
const OUTRA_ESPECIE_ID = "f60f9f41-885d-41ba-8dc3-d55ec903c426";
const NATUREZA_ID = "6c167f7a-0e4b-46bb-8c78-bc33585c91fa";
const OUTRA_NATUREZA_ID = "24df3a43-5c02-47fb-ab92-03757a058f9f";
const ORIGEM = "http://localhost:3000";

type NaturezaMemoria = { id: string; nome: string };
type EspecieMemoria = {
  id: string;
  nome: string;
  nomeNormalizado: string;
  descricao: string | null;
  naturezaId: string;
  natureza: NaturezaMemoria;
  createdAt: Date;
  updatedAt: Date | null;
  createdById: string;
};

function especieBase(
  sobrescritas: Partial<EspecieMemoria> = {},
): EspecieMemoria {
  return {
    id: ESPECIE_ID,
    nome: "Notebook",
    nomeNormalizado: "NOTEBOOK",
    descricao: "Computador portátil",
    naturezaId: NATUREZA_ID,
    natureza: { id: NATUREZA_ID, nome: "Equipamentos" },
    createdAt: new Date("2026-10-19T12:00:00.000Z"),
    updatedAt: null,
    createdById: ADMIN_ID,
    ...sobrescritas,
  };
}

describe("gestão de espécies", () => {
  let app: INestApplication;
  let especies: EspecieMemoria[];
  const naturezas: NaturezaMemoria[] = [
    { id: NATUREZA_ID, nome: "Equipamentos" },
    { id: OUTRA_NATUREZA_ID, nome: "Mobiliário" },
  ];
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
    natureza: { findUnique: jest.fn() },
    especie: {
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
          tipo: "WEB",
          accessExpiraAt: null,
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
      ({ where }: { where: { id: string } }) =>
        naturezas.find(({ id }) => id === where.id) ?? null,
    );
    database.especie.findUnique.mockImplementation(
      ({ where }: { where: { id?: string; nomeNormalizado?: string } }) =>
        especies.find(
          (especie) =>
            (where.id !== undefined && especie.id === where.id) ||
            (where.nomeNormalizado !== undefined &&
              especie.nomeNormalizado === where.nomeNormalizado),
        ) ?? null,
    );
    const filtrar = (where: {
      naturezaId?: string;
      OR?: Array<{
        nome?: { contains: string };
        nomeNormalizado?: { contains: string };
      }>;
    }) =>
      especies.filter(
        (especie) =>
          (where.naturezaId === undefined ||
            especie.naturezaId === where.naturezaId) &&
          (where.OR === undefined ||
            where.OR.some((condicao) =>
              condicao.nome !== undefined
                ? especie.nome
                    .toLocaleLowerCase()
                    .includes(condicao.nome.contains.toLocaleLowerCase())
                : especie.nomeNormalizado.includes(
                    condicao.nomeNormalizado?.contains ?? "",
                  ),
            )),
      );
    database.especie.findMany.mockImplementation(
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
    database.especie.count.mockImplementation(
      ({ where }: { where: Parameters<typeof filtrar>[0] }) =>
        filtrar(where).length,
    );
    database.especie.create.mockImplementation(
      ({
        data,
      }: {
        data: {
          nome: string;
          nomeNormalizado: string;
          descricao?: string;
          natureza: { connect: { id: string } };
          createdBy: { connect: { id: string } };
        };
      }) => {
        const natureza = naturezas.find(
          ({ id }) => id === data.natureza.connect.id,
        )!;
        const criada = especieBase({
          id: OUTRA_ESPECIE_ID,
          nome: data.nome,
          nomeNormalizado: data.nomeNormalizado,
          descricao: data.descricao ?? null,
          naturezaId: natureza.id,
          natureza,
          createdById: data.createdBy.connect.id,
        });
        especies.push(criada);
        return criada;
      },
    );
    database.especie.update.mockImplementation(
      ({
        where,
        data,
      }: {
        where: { id: string };
        data: Partial<EspecieMemoria> & {
          natureza?: { connect: { id: string } };
        };
      }) => {
        const indice = especies.findIndex(({ id }) => id === where.id);
        if (indice < 0) throw new Error("Registro não encontrado");
        const natureza = data.natureza
          ? naturezas.find(({ id }) => id === data.natureza!.connect.id)!
          : especies[indice]!.natureza;
        const campos = { ...data };
        delete campos.natureza;
        especies[indice] = {
          ...especies[indice]!,
          ...(campos as Partial<EspecieMemoria>),
          naturezaId: natureza.id,
          natureza,
        };
        return especies[indice];
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
    especies = [especieBase()];
    jest.clearAllMocks();
  });

  afterAll(async () => app.close());

  function cookie(token: string): string {
    return `sipat_session=${token}`;
  }

  function administrador() {
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

  function diretor() {
    return {
      get: (path: string) =>
        request(app.getHttpServer())
          .get(path)
          .set("Cookie", cookie(tokenDiretor)),
      post: (path: string) =>
        request(app.getHttpServer())
          .post(path)
          .set("Cookie", cookie(tokenDiretor))
          .set("Origin", ORIGEM)
          .set(CABECALHO_CSRF, "1"),
      patch: (path: string) =>
        request(app.getHttpServer())
          .patch(path)
          .set("Cookie", cookie(tokenDiretor))
          .set("Origin", ORIGEM)
          .set(CABECALHO_CSRF, "1"),
    };
  }

  function esperarCodigo(resposta: request.Response, codigo: string) {
    const resultado = RespostaErroSchema.safeParse(resposta.body);
    expect(resultado.success).toBe(true);
    if (resultado.success) expect(resultado.data.codigo).toBe(codigo);
  }

  it("exige sessão na listagem e na consulta", async () => {
    const [listagem, consulta] = await Promise.all([
      request(app.getHttpServer()).get("/api/especies"),
      request(app.getHttpServer()).get(`/api/especies/${ESPECIE_ID}`),
    ]);

    expect(listagem.status).toBe(401);
    expect(consulta.status).toBe(401);
    esperarCodigo(listagem, "NAO_AUTENTICADO");
    esperarCodigo(consulta, "NAO_AUTENTICADO");
  });

  it("permite ao administrador e ao diretor listar e consultar espécies", async () => {
    const [
      listaAdministrador,
      detalheAdministrador,
      listaDiretor,
      detalheDiretor,
    ] = await Promise.all([
      administrador().get("/api/especies"),
      administrador().get(`/api/especies/${ESPECIE_ID}`),
      diretor().get("/api/especies"),
      diretor().get(`/api/especies/${ESPECIE_ID}`),
    ]);

    for (const resposta of [listaAdministrador, listaDiretor]) {
      expect(resposta.status).toBe(200);
      expect(
        ListarEspeciesResponseSchema.safeParse(resposta.body).success,
      ).toBe(true);
      expect(resposta.body.dados[0]).toMatchObject({
        id: ESPECIE_ID,
        nome: "Notebook",
        natureza: { id: NATUREZA_ID, nome: "Equipamentos" },
      });
    }

    for (const resposta of [detalheAdministrador, detalheDiretor]) {
      expect(resposta.status).toBe(200);
      expect(EspecieDetalheSchema.safeParse(resposta.body.dados).success).toBe(
        true,
      );
      expect(resposta.body.dados).toMatchObject({
        id: ESPECIE_ID,
        nome: "Notebook",
        natureza: { id: NATUREZA_ID, nome: "Equipamentos" },
      });
    }
  });

  it("nega ao diretor todas as mutações de espécies", async () => {
    const [criacao, alteracao] = await Promise.all([
      diretor().post("/api/especies").send({
        nome: "Câmera",
        naturezaId: NATUREZA_ID,
      }),
      diretor()
        .patch(`/api/especies/${ESPECIE_ID}`)
        .send({ descricao: "Alterada" }),
    ]);

    for (const resposta of [criacao, alteracao]) {
      expect(resposta.status).toBe(403);
      esperarCodigo(resposta, "ACESSO_NEGADO");
    }
  });

  it("lista com busca, filtro por natureza e ordem determinística", async () => {
    especies.push(
      especieBase({
        id: OUTRA_ESPECIE_ID,
        nome: "Câmera",
        nomeNormalizado: "CAMERA",
        naturezaId: OUTRA_NATUREZA_ID,
        natureza: naturezas[1]!,
      }),
    );

    const resposta = await administrador().get(
      `/api/especies?pagina=1&limite=20&busca=camera&naturezaId=${OUTRA_NATUREZA_ID}`,
    );

    expect(resposta.status).toBe(200);
    expect(ListarEspeciesResponseSchema.safeParse(resposta.body).success).toBe(
      true,
    );
    expect(resposta.body.dados).toEqual([
      expect.objectContaining({
        id: OUTRA_ESPECIE_ID,
        natureza: { id: OUTRA_NATUREZA_ID, nome: "Mobiliário" },
      }),
    ]);
    expect(database.especie.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        skip: 0,
        take: 20,
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      }),
    );
  });

  it("exige natureza existente e deriva normalização e auditoria", async () => {
    const semNatureza = await administrador()
      .post("/api/especies")
      .send({ nome: "Câmera" });
    const inexistente = await administrador().post("/api/especies").send({
      nome: "Câmera",
      naturezaId: "7ce084e2-e31b-423d-ac44-03f7829a4658",
    });
    const resposta = await administrador()
      .post("/api/especies")
      .send({ nome: " Câmera ", naturezaId: NATUREZA_ID });

    expect(semNatureza.status).toBe(400);
    expect(inexistente.status).toBe(404);
    esperarCodigo(semNatureza, "VALIDACAO_ENTRADA_INVALIDA");
    esperarCodigo(inexistente, "NATUREZA_NAO_ENCONTRADA");
    expect(resposta.status).toBe(201);
    expect(EspecieDetalheSchema.safeParse(resposta.body.dados).success).toBe(
      true,
    );
    expect(resposta.body.dados).toMatchObject({
      nome: "Câmera",
      nomeNormalizado: "CAMERA",
      createdById: ADMIN_ID,
      natureza: { id: NATUREZA_ID },
    });
  });

  it("rejeita duplicidade e altera o vínculo sem substituir a espécie", async () => {
    const duplicada = await administrador()
      .post("/api/especies")
      .send({ nome: "notebook", naturezaId: NATUREZA_ID });
    const alterada = await administrador()
      .patch(`/api/especies/${ESPECIE_ID}`)
      .send({ naturezaId: OUTRA_NATUREZA_ID, descricao: null });
    const consulta = await administrador().get(`/api/especies/${ESPECIE_ID}`);

    expect(duplicada.status).toBe(409);
    esperarCodigo(duplicada, "NOME_ESPECIE_JA_EXISTENTE");
    expect(alterada.status).toBe(200);
    expect(alterada.body.dados).toMatchObject({
      id: ESPECIE_ID,
      descricao: null,
      natureza: { id: OUTRA_NATUREZA_ID, nome: "Mobiliário" },
    });
    expect(consulta.body.dados.id).toBe(ESPECIE_ID);
    expect(especies).toHaveLength(1);
  });

  it("rejeita PATCH vazio e espécie inexistente", async () => {
    const vazio = await administrador()
      .patch(`/api/especies/${ESPECIE_ID}`)
      .send({});
    const inexistente = await administrador().get(
      "/api/especies/7ce084e2-e31b-423d-ac44-03f7829a4658",
    );

    expect(vazio.status).toBe(400);
    expect(inexistente.status).toBe(404);
    esperarCodigo(vazio, "VALIDACAO_ENTRADA_INVALIDA");
    esperarCodigo(inexistente, "ESPECIE_NAO_ENCONTRADA");
  });
});
