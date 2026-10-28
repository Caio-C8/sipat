import type { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import {
  CABECALHO_CSRF,
  ListarSetoresResponseSchema,
  RespostaErroSchema,
  SetorDetalheSchema,
} from "@repo/contracts";
import cookieParser from "cookie-parser";
import request from "supertest";
import { AppModule } from "../src/app.module";
import { DATABASE_CLIENT } from "../src/common/database/database.constants";
import { configurarCors } from "../src/configurar-cors";
import { calcularHashTokenSessao } from "../src/modules/auth/token-sessao";

const ADMIN_ID = "28df5e9c-3e60-4a8e-a4d4-8ca70221f4f0";
const DIRETOR_ID = "c5c3cc23-a215-4bba-9ae0-671596433a36";
const SETOR_ID = "6c167f7a-0e4b-46bb-8c78-bc33585c91fa";
const OUTRO_SETOR_ID = "24df3a43-5c02-47fb-ab92-03757a058f9f";
const RESPONSAVEL_ID = "1843fd9f-c521-49d6-b87c-510f04c5380d";
const RESPONSAVEL_INATIVO_ID = "a42d5508-4c6d-4b7b-9bb1-b61df0724470";
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

type SetorMemoria = {
  id: string;
  nome: string;
  sala: string | null;
  ramal: string | null;
  ativo: boolean;
  responsavel: ResponsavelMemoria;
  createdAt: Date;
  updatedAt: Date | null;
  createdById: string;
};

describe("gestão de setores", () => {
  let app: INestApplication;
  let setores: SetorMemoria[];
  const tokenAdministrador = "A".repeat(43);
  const tokenDiretor = "B".repeat(43);
  const responsavelAtivo: ResponsavelMemoria = {
    id: RESPONSAVEL_ID,
    nome: "Responsável ativo",
    matricula: "MAT-001",
    ativo: true,
    createdAt: new Date("2026-10-19T10:00:00.000Z"),
    updatedAt: null,
    createdById: ADMIN_ID,
  };
  const responsavelInativo: ResponsavelMemoria = {
    ...responsavelAtivo,
    id: RESPONSAVEL_INATIVO_ID,
    nome: "Responsável inativo",
    matricula: "MAT-002",
    ativo: false,
  };

  function setorBase(sobrescritas: Partial<SetorMemoria> = {}): SetorMemoria {
    return {
      id: SETOR_ID,
      nome: "Almoxarifado",
      sala: "12",
      ramal: "123",
      ativo: true,
      responsavel: responsavelAtivo,
      createdAt: new Date("2026-10-19T12:00:00.000Z"),
      updatedAt: null,
      createdById: ADMIN_ID,
      ...sobrescritas,
    };
  }

  const database = {
    $connect: jest.fn(),
    $disconnect: jest.fn(),
    notaFiscal: { findMany: jest.fn().mockResolvedValue([]) },
    setorInventario: { count: jest.fn().mockResolvedValue(0) },
    sessaoUsuario: {
      findUnique: jest.fn(),
      updateMany: jest.fn(),
    },
    responsavel: { findUnique: jest.fn() },
    setor: {
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
    database.responsavel.findUnique.mockImplementation(
      ({ where }: { where: { id: string } }) =>
        [responsavelAtivo, responsavelInativo].find(
          (responsavel) => responsavel.id === where.id,
        ) ?? null,
    );
    database.setor.findUnique.mockImplementation(
      ({ where }: { where: { id: string } }) =>
        setores.find((setor) => setor.id === where.id) ?? null,
    );
    const filtrar = (where: {
      ativo?: boolean;
      responsavelId?: string;
      OR?: Array<Record<string, { contains: string }>>;
    }) =>
      setores.filter((setor) => {
        if (where.ativo !== undefined && setor.ativo !== where.ativo) {
          return false;
        }
        if (
          where.responsavelId !== undefined &&
          setor.responsavel.id !== where.responsavelId
        ) {
          return false;
        }
        if (where.OR === undefined) return true;
        return where.OR.some((condicao) => {
          const busca = Object.values(condicao)[0]?.contains ?? "";
          return [setor.nome, setor.sala ?? "", setor.ramal ?? ""].some(
            (valor) => valor.toLowerCase().includes(busca.toLowerCase()),
          );
        });
      });
    database.setor.findMany.mockImplementation(
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
    database.setor.count.mockImplementation(
      ({ where }: { where: Parameters<typeof filtrar>[0] }) =>
        filtrar(where).length,
    );
    database.setor.create.mockImplementation(
      ({
        data,
      }: {
        data: {
          nome: string;
          sala?: string;
          ramal?: string;
          ativo: boolean;
          responsavel: { connect: { id: string } };
          createdBy: { connect: { id: string } };
        };
      }) => {
        const criado = setorBase({
          id: OUTRO_SETOR_ID,
          nome: data.nome,
          sala: data.sala ?? null,
          ramal: data.ramal ?? null,
          ativo: data.ativo,
          responsavel: responsavelAtivo,
          createdById: data.createdBy.connect.id,
        });
        setores.push(criado);
        return criado;
      },
    );
    database.setor.update.mockImplementation(
      ({
        where,
        data,
      }: {
        where: { id: string };
        data: {
          nome?: string;
          sala?: string | null;
          ramal?: string | null;
          ativo?: boolean;
          responsavel?: { connect: { id: string } };
          updatedAt?: Date;
        };
      }) => {
        const indice = setores.findIndex((setor) => setor.id === where.id);
        if (indice < 0) throw new Error("Registro não encontrado");
        const atual = setores[indice]!;
        setores[indice] = {
          ...atual,
          ...data,
          responsavel:
            data.responsavel === undefined
              ? atual.responsavel
              : data.responsavel.connect.id === RESPONSAVEL_ID
                ? responsavelAtivo
                : responsavelInativo,
        };
        return setores[indice];
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
    setores = [setorBase()];
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
      request(app.getHttpServer()).get("/api/setores"),
      request(app.getHttpServer()).get(`/api/setores/${SETOR_ID}`),
    ]);

    expect(listagem.status).toBe(401);
    expect(consulta.status).toBe(401);
    esperarCodigo(listagem, "NAO_AUTENTICADO");
    esperarCodigo(consulta, "NAO_AUTENTICADO");
  });

  it("permite ao administrador e ao diretor listar e consultar setores", async () => {
    const [
      listaAdministrador,
      detalheAdministrador,
      listaDiretor,
      detalheDiretor,
    ] = await Promise.all([
      administrador().get("/api/setores"),
      administrador().get(`/api/setores/${SETOR_ID}`),
      diretor().get("/api/setores"),
      diretor().get(`/api/setores/${SETOR_ID}`),
    ]);

    for (const resposta of [listaAdministrador, listaDiretor]) {
      expect(resposta.status).toBe(200);
      expect(ListarSetoresResponseSchema.safeParse(resposta.body).success).toBe(
        true,
      );
      expect(resposta.body.dados[0]).toMatchObject({
        nome: "Almoxarifado",
        sala: "12",
        ativo: true,
        responsavel: { id: RESPONSAVEL_ID, nome: "Responsável ativo" },
      });
    }

    for (const resposta of [detalheAdministrador, detalheDiretor]) {
      expect(resposta.status).toBe(200);
      expect(SetorDetalheSchema.safeParse(resposta.body.dados).success).toBe(
        true,
      );
      expect(resposta.body.dados).toMatchObject({
        id: SETOR_ID,
        nome: "Almoxarifado",
        sala: "12",
        ativo: true,
        responsavel: { id: RESPONSAVEL_ID, nome: "Responsável ativo" },
      });
    }
  });

  it("nega ao diretor todas as mutações de setores", async () => {
    const [criacao, alteracao, situacao] = await Promise.all([
      diretor().post("/api/setores").send({
        nome: "Arquivo",
        responsavelId: RESPONSAVEL_ID,
      }),
      diretor().patch(`/api/setores/${SETOR_ID}`).send({ sala: "20" }),
      diretor()
        .patch(`/api/setores/${SETOR_ID}/situacao`)
        .send({ ativo: false }),
    ]);

    for (const resposta of [criacao, alteracao, situacao]) {
      expect(resposta.status).toBe(403);
      esperarCodigo(resposta, "ACESSO_NEGADO");
    }
  });

  it("lista com paginação, busca, responsável, situação e ordem", async () => {
    setores.push(
      setorBase({ id: OUTRO_SETOR_ID, nome: "Arquivo", ativo: false }),
    );
    const resposta = await administrador().get(
      `/api/setores?pagina=1&limite=20&busca=arquivo&responsavelId=${RESPONSAVEL_ID}&ativo=false`,
    );

    expect(resposta.status).toBe(200);
    expect(ListarSetoresResponseSchema.safeParse(resposta.body).success).toBe(
      true,
    );
    expect(resposta.body.dados).toEqual([
      expect.objectContaining({ id: OUTRO_SETOR_ID }),
    ]);
    expect(database.setor.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        skip: 0,
        take: 20,
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      }),
    );
  });

  it("cria ativo com responsável ativo e auditoria derivada", async () => {
    const resposta = await administrador().post("/api/setores").send({
      nome: "Arquivo",
      sala: "20",
      responsavelId: RESPONSAVEL_ID,
    });

    expect(resposta.status).toBe(201);
    expect(SetorDetalheSchema.safeParse(resposta.body.dados).success).toBe(
      true,
    );
    expect(resposta.body.dados).toMatchObject({
      nome: "Arquivo",
      ativo: true,
      createdById: ADMIN_ID,
      responsavel: { id: RESPONSAVEL_ID },
    });
  });

  it("rejeita responsável inativo na criação e na troca", async () => {
    const criacao = await administrador().post("/api/setores").send({
      nome: "Arquivo",
      responsavelId: RESPONSAVEL_INATIVO_ID,
    });
    const alteracao = await administrador()
      .patch(`/api/setores/${SETOR_ID}`)
      .send({ responsavelId: RESPONSAVEL_INATIVO_ID });

    expect(criacao.status).toBe(409);
    expect(alteracao.status).toBe(409);
    esperarCodigo(criacao, "RESPONSAVEL_INATIVO");
    esperarCodigo(alteracao, "RESPONSAVEL_INATIVO");
  });

  it("altera, inativa e preserva o setor e seu responsável", async () => {
    const alterado = await administrador()
      .patch(`/api/setores/${SETOR_ID}`)
      .send({ sala: null, ramal: "456" });
    const inativado = await administrador()
      .patch(`/api/setores/${SETOR_ID}/situacao`)
      .send({ ativo: false });
    const consulta = await administrador().get(`/api/setores/${SETOR_ID}`);

    expect(alterado.status).toBe(200);
    expect(alterado.body.dados).toMatchObject({ sala: null, ramal: "456" });
    expect(inativado.status).toBe(200);
    expect(inativado.body.dados.ativo).toBe(false);
    expect(consulta.body.dados).toMatchObject({
      id: SETOR_ID,
      ativo: false,
      responsavel: { id: RESPONSAVEL_ID },
    });
    expect(setores).toHaveLength(1);
  });

  it("rejeita PATCH vazio e setor inexistente", async () => {
    const vazio = await administrador()
      .patch(`/api/setores/${SETOR_ID}`)
      .send({});
    const inexistente = await administrador().get(
      "/api/setores/7ce084e2-e31b-423d-ac44-03f7829a4658",
    );

    expect(vazio.status).toBe(400);
    expect(inexistente.status).toBe(404);
    esperarCodigo(vazio, "VALIDACAO_ENTRADA_INVALIDA");
    esperarCodigo(inexistente, "SETOR_NAO_ENCONTRADO");
  });
});
