import type { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import {
  CABECALHO_CSRF,
  ConsultarPatrimonioResponseSchema,
  CriarPatrimonioResponseSchema,
  ListarPatrimoniosResponseSchema,
  RespostaErroSchema,
  SubstituirNumeroPatrimonialResponseSchema,
} from "@repo/contracts";
import { Prisma } from "@repo/database";
import cookieParser from "cookie-parser";
import request from "supertest";
import { AppModule } from "../src/app.module";
import { DATABASE_CLIENT } from "../src/common/database/database.constants";
import { configurarCors } from "../src/configurar-cors";
import { calcularHashTokenSessao } from "../src/modules/auth/token-sessao";

const ADMIN_ID = "28df5e9c-3e60-4a8e-a4d4-8ca70221f4f0";
const DIRETOR_ID = "c5c3cc23-a215-4bba-9ae0-671596433a36";
const PATRIMONIO_ID = "5c0945b2-7d3c-4b75-8bc6-5b0bf04086ab";
const SETOR_ID = "fbcb9251-7ad8-4d64-ad1f-1fd3b5545fc8";
const ESPECIE_ID = "24df3a43-5c02-47fb-ab92-03757a058f9f";
const ORIGEM = "http://localhost:3000";

describe("patrimônios", () => {
  let app: INestApplication;
  const tokenAdministrador = "A".repeat(43);
  const tokenDiretor = "B".repeat(43);
  let proximoOficial = 1n;
  let proximoSemNumero = 1n;
  let numeroAtual = "1";
  const historicosSubstituicao: Array<{
    numeroAnterior: string;
    numeroNovo: string;
    createdById: string;
  }> = [];

  const database = {
    $connect: jest.fn(),
    $disconnect: jest.fn(),
    notaFiscal: { findMany: jest.fn().mockResolvedValue([]) },
    $transaction: jest.fn(),
    $queryRaw: jest.fn(),
    usuario: { findUnique: jest.fn() },
    sessaoUsuario: { findUnique: jest.fn(), updateMany: jest.fn() },
    setor: { findUnique: jest.fn() },
    especie: { findUnique: jest.fn() },
    processoCompra: { findUnique: jest.fn() },
    patrimonio: {
      create: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      findUnique: jest.fn(),
      updateMany: jest.fn(),
    },
    substituicaoNumeroPatrimonial: { create: jest.fn() },
  };

  function patrimonioPersistido(numeroPatrimonio = "1") {
    return {
      id: PATRIMONIO_ID,
      numeroPatrimonio,
      tipoNumeroPatrimonial: numeroPatrimonio.startsWith("SP-")
        ? ("SEM_NUMERO_OFICIAL" as const)
        : ("OFICIAL" as const),
      descricao: "CAMERA FOTOGRAFICA",
      marca: "SAO JOSE",
      modelo: "OPTICO",
      numeroSerie: "SERIE-1",
      status: "ATIVO" as const,
      dataTombamento: new Date("2026-10-18T00:00:00.000Z"),
      tipoIncorporacao: "AQUISICAO" as const,
      valorIncorporacao: new Prisma.Decimal("1000"),
      createdAt: new Date("2026-10-18T12:00:00.000Z"),
      updatedAt: null,
      setorAtual: {
        id: SETOR_ID,
        nome: "Almoxarifado",
        responsavel: {
          id: "eb70f7e5-61ce-4d90-b8e0-908199ecde77",
          nome: "Responsável",
        },
      },
      especie: {
        id: ESPECIE_ID,
        nome: "Câmera",
        natureza: {
          id: "f39c12aa-8823-41ed-889b-0a81d2e7ca13",
          nome: "Equipamentos",
        },
      },
      processoCompra: null,
      situacaoContabil: {
        valorBrutoAtual: new Prisma.Decimal("1000"),
        depreciacaoAcumuladaAtual: new Prisma.Decimal(0),
      },
      parametrosDepreciacao: [],
    };
  }

  beforeAll(async () => {
    database.$transaction.mockImplementation(
      async (operacao: (cliente: typeof database) => Promise<unknown>) =>
        operacao(database),
    );
    database.sessaoUsuario.findUnique.mockImplementation(
      ({ where }: { where: { tokenHash: string } }) => {
        const perfil =
          where.tokenHash === calcularHashTokenSessao(tokenAdministrador)
            ? "ADMINISTRADOR"
            : where.tokenHash === calcularHashTokenSessao(tokenDiretor)
              ? "DIRETOR_PATRIMONIO"
              : null;
        if (perfil === null) return null;

        return {
          id: perfil === "ADMINISTRADOR" ? ADMIN_ID : DIRETOR_ID,
          tipo: "WEB",
          accessExpiraAt: null,
          expiraAt: new Date("2999-01-01T00:00:00.000Z"),
          ultimaAtividadeAt: new Date(),
          revogadoAt: null,
          usuario: {
            id: perfil === "ADMINISTRADOR" ? ADMIN_ID : DIRETOR_ID,
            nome: perfil === "ADMINISTRADOR" ? "Administrador" : "Diretor",
            email:
              perfil === "ADMINISTRADOR"
                ? "admin@example.com"
                : "diretor@example.com",
            perfil,
            ativo: true,
            trocaSenhaObrigatoria: false,
          },
        };
      },
    );
    database.setor.findUnique.mockResolvedValue({ ativo: true });
    database.especie.findUnique.mockResolvedValue({ id: ESPECIE_ID });
    database.processoCompra.findUnique.mockResolvedValue(null);
    database.$queryRaw.mockImplementation((strings: TemplateStringsArray) => {
      const sql = strings.join("");
      if (sql.includes('FROM "setores"')) {
        return [{ ativo: true }];
      }
      if (sql.includes("patrimonios_numero_oficial_seq")) {
        return [{ valor: proximoOficial++ }];
      }
      return [{ valor: proximoSemNumero++ }];
    });
    database.patrimonio.create.mockImplementation(
      ({ data }: { data: Prisma.PatrimonioCreateInput }) => ({
        ...patrimonioPersistido(data.numeroPatrimonio),
        descricao: data.descricao,
        marca: data.marca ?? null,
        modelo: data.modelo ?? null,
        numeroSerie: data.numeroSerie ?? null,
        status: data.status,
        dataTombamento: data.dataTombamento,
        tipoIncorporacao: data.tipoIncorporacao,
        valorIncorporacao: new Prisma.Decimal(String(data.valorIncorporacao)),
      }),
    );
    database.patrimonio.findMany.mockResolvedValue([patrimonioPersistido()]);
    database.patrimonio.count.mockResolvedValue(1);
    database.patrimonio.findUnique.mockImplementation(() =>
      Promise.resolve(patrimonioPersistido(numeroAtual)),
    );
    database.patrimonio.updateMany.mockImplementation(
      ({
        where,
        data,
      }: {
        where: { numeroPatrimonio: string; tipoNumeroPatrimonial: string };
        data: { numeroPatrimonio: string };
      }) => {
        if (
          where.numeroPatrimonio !== numeroAtual ||
          where.tipoNumeroPatrimonial !== "OFICIAL" ||
          numeroAtual.startsWith("SP-")
        ) {
          return { count: 0 };
        }

        numeroAtual = data.numeroPatrimonio;
        return { count: 1 };
      },
    );
    database.substituicaoNumeroPatrimonial.create.mockImplementation(
      ({
        data,
      }: {
        data: {
          numeroAnterior: string;
          numeroNovo: string;
          createdBy: { connect: { id: string } };
        };
      }) => {
        historicosSubstituicao.push({
          numeroAnterior: data.numeroAnterior,
          numeroNovo: data.numeroNovo,
          createdById: data.createdBy.connect.id,
        });
        return { id: "historico" };
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
    jest.clearAllMocks();
    proximoOficial = 1n;
    proximoSemNumero = 1n;
    numeroAtual = "1";
    historicosSubstituicao.length = 0;
  });

  afterAll(async () => app.close());

  function body(semNumeroOficial = false) {
    return {
      semNumeroOficial,
      dataTombamento: "2026-10-18",
      tipoIncorporacao: "AQUISICAO",
      descricao: "Câmera fotográfica",
      marca: "São José",
      modelo: "Óptico",
      numeroSerie: semNumeroOficial ? "série-2" : "série-1",
      valorIncorporacao: "1000.00",
      especieId: ESPECIE_ID,
      setorAtualId: SETOR_ID,
    };
  }

  function postAutenticado(token: string) {
    return request(app.getHttpServer())
      .post("/api/patrimonios")
      .set("Cookie", `sipat_session=${token}`)
      .set("Origin", ORIGEM)
      .set(CABECALHO_CSRF, "1");
  }

  function getAutenticado(token: string, caminho = "/api/patrimonios") {
    return request(app.getHttpServer())
      .get(caminho)
      .set("Cookie", `sipat_session=${token}`);
  }

  function postSubstituicao(token: string, caminho = "") {
    return request(app.getHttpServer())
      .post(`/api/patrimonios/${PATRIMONIO_ID}/substituicoes-numero${caminho}`)
      .set("Cookie", `sipat_session=${token}`)
      .set("Origin", ORIGEM)
      .set(CABECALHO_CSRF, "1");
  }

  it("protege consultas e permite os dois perfis autenticados", async () => {
    const anonimo = await request(app.getHttpServer()).get("/api/patrimonios");
    expect(anonimo.status).toBe(401);
    expect(RespostaErroSchema.safeParse(anonimo.body).success).toBe(true);

    for (const token of [tokenAdministrador, tokenDiretor]) {
      const response = await getAutenticado(token);
      expect(response.status).toBe(200);
      expect(
        ListarPatrimoniosResponseSchema.safeParse(response.body).success,
      ).toBe(true);
    }
  });

  it("aplica paginação, busca normalizada, filtros e seleção mínima", async () => {
    const response = await getAutenticado(
      tokenDiretor,
      `/api/patrimonios?pagina=2&limite=10&busca=c%C3%A2mera&status=ATIVO&setorId=${SETOR_ID}&especieId=${ESPECIE_ID}&naturezaId=f39c12aa-8823-41ed-889b-0a81d2e7ca13&tipoNumeroPatrimonial=OFICIAL`,
    );

    expect(response.status).toBe(200);
    expect(response.body.meta).toEqual({
      total: 1,
      pagina: 2,
      ultimaPagina: 1,
      limite: 10,
    });
    expect(response.body.dados[0]).not.toHaveProperty("createdAt");
    expect(database.patrimonio.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        skip: 10,
        take: 10,
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        where: {
          textoBusca: { contains: "CAMERA" },
          status: "ATIVO",
          setorAtualId: SETOR_ID,
          especieId: ESPECIE_ID,
          especie: {
            naturezaId: "f39c12aa-8823-41ed-889b-0a81d2e7ca13",
          },
          tipoNumeroPatrimonial: "OFICIAL",
        },
      }),
    );
  });

  it("rejeita filtros inválidos no boundary", async () => {
    const response = await getAutenticado(
      tokenAdministrador,
      "/api/patrimonios?limite=51&status=DESCONHECIDO",
    );

    expect(response.status).toBe(400);
    expect(RespostaErroSchema.safeParse(response.body).success).toBe(true);
    expect(database.patrimonio.findMany).not.toHaveBeenCalled();
  });

  it("retorna lista vazia com metadados coerentes", async () => {
    database.patrimonio.findMany.mockResolvedValueOnce([]);
    database.patrimonio.count.mockResolvedValueOnce(0);

    const response = await getAutenticado(tokenAdministrador);

    expect(response.status).toBe(200);
    expect(response.body.dados).toEqual([]);
    expect(response.body.meta).toEqual({
      total: 0,
      pagina: 1,
      ultimaPagina: 1,
      limite: 20,
    });
  });

  it("consulta detalhes e traduz ausência para erro público", async () => {
    const encontrado = await getAutenticado(
      tokenAdministrador,
      `/api/patrimonios/${PATRIMONIO_ID}`,
    );
    expect(encontrado.status).toBe(200);
    expect(
      ConsultarPatrimonioResponseSchema.safeParse(encontrado.body).success,
    ).toBe(true);

    database.patrimonio.findUnique.mockResolvedValueOnce(null);
    const ausente = await getAutenticado(
      tokenDiretor,
      "/api/patrimonios/11111111-1111-4111-8111-111111111111",
    );
    expect(ausente.status).toBe(404);
    expect(ausente.body.codigo).toBe("PATRIMONIO_NAO_ENCONTRADO");
  });

  it("aplica autenticação, perfil e CSRF reais", async () => {
    const anonimo = await request(app.getHttpServer())
      .post("/api/patrimonios")
      .set("Origin", ORIGEM)
      .set(CABECALHO_CSRF, "1")
      .send(body());
    expect(anonimo.status).toBe(401);
    expect(RespostaErroSchema.safeParse(anonimo.body).success).toBe(true);

    const administrador =
      await postAutenticado(tokenAdministrador).send(body());
    expect(administrador.status).toBe(403);

    const semCsrf = await request(app.getHttpServer())
      .post("/api/patrimonios")
      .set("Cookie", `sipat_session=${tokenDiretor}`)
      .set("Origin", ORIGEM)
      .send(body());
    expect(semCsrf.status).toBe(403);
  });

  it("permite ao diretor criar com normalização, auditoria e allowlist", async () => {
    const response = await postAutenticado(tokenDiretor).send(body());

    expect(response.status).toBe(201);
    expect(CriarPatrimonioResponseSchema.safeParse(response.body).success).toBe(
      true,
    );
    expect(response.body.dados).toEqual(
      expect.objectContaining({
        numeroPatrimonio: "1",
        tipoNumeroPatrimonial: "OFICIAL",
        descricao: "CAMERA FOTOGRAFICA",
        marca: "SAO JOSE",
        modelo: "OPTICO",
        numeroSerie: "SERIE-1",
        status: "ATIVO",
      }),
    );
    expect(database.patrimonio.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          createdBy: { connect: { id: DIRETOR_ID } },
          textoBusca: "CAMERA FOTOGRAFICA SAO JOSE OPTICO SERIE-1",
        }),
      }),
    );
  });

  it("usa sequences independentes para os dois tipos", async () => {
    const oficial = await postAutenticado(tokenDiretor).send(body());
    const semNumero = await postAutenticado(tokenDiretor).send(body(true));

    expect(oficial.body.dados.numeroPatrimonio).toBe("1");
    expect(semNumero.body.dados.numeroPatrimonio).toBe("SP-1");
    const consultas = database.$queryRaw.mock.calls.map(
      ([strings]: [TemplateStringsArray]) => strings.join(""),
    );
    expect(
      consultas.filter((sql) => sql.includes("patrimonios_numero_oficial_seq")),
    ).toHaveLength(1);
    expect(
      consultas.filter((sql) =>
        sql.includes("patrimonios_sem_numero_oficial_seq"),
      ),
    ).toHaveLength(1);
  });

  it("rejeita propriedades extras e campos controlados pelo servidor", async () => {
    const response = await postAutenticado(tokenDiretor).send({
      ...body(),
      numeroPatrimonio: "999",
      status: "BAIXADO",
      createdById: ADMIN_ID,
    });

    expect(response.status).toBe(400);
    expect(RespostaErroSchema.safeParse(response.body).success).toBe(true);
    expect(database.patrimonio.create).not.toHaveBeenCalled();
  });

  it("protege a substituição com autenticação, perfil e CSRF reais", async () => {
    const anonimo = await request(app.getHttpServer())
      .post(`/api/patrimonios/${PATRIMONIO_ID}/substituicoes-numero`)
      .set("Origin", ORIGEM)
      .set(CABECALHO_CSRF, "1")
      .send({ numeroPatrimonioAtual: "1" });
    expect(anonimo.status).toBe(401);

    const administrador = await postSubstituicao(tokenAdministrador).send({
      numeroPatrimonioAtual: "1",
    });
    expect(administrador.status).toBe(403);

    const semCsrf = await request(app.getHttpServer())
      .post(`/api/patrimonios/${PATRIMONIO_ID}/substituicoes-numero`)
      .set("Cookie", `sipat_session=${tokenDiretor}`)
      .set("Origin", ORIGEM)
      .send({ numeroPatrimonioAtual: "1" });
    expect(semCsrf.status).toBe(403);
  });

  it("substitui pelo número gerado, preserva a allowlist e registra a auditoria", async () => {
    proximoOficial = 2n;

    const response = await postSubstituicao(tokenDiretor, "?numeroNovo=999")
      .set("X-Numero-Novo", "999")
      .send({ numeroPatrimonioAtual: "1" });

    expect(response.status).toBe(200);
    expect(
      SubstituirNumeroPatrimonialResponseSchema.safeParse(response.body)
        .success,
    ).toBe(true);
    expect(response.body.dados.numeroPatrimonio).toBe("2");
    expect(response.body.dados.id).toBe(PATRIMONIO_ID);
    expect(database.patrimonio.updateMany).toHaveBeenCalledWith({
      where: {
        id: PATRIMONIO_ID,
        numeroPatrimonio: "1",
        tipoNumeroPatrimonial: "OFICIAL",
      },
      data: { numeroPatrimonio: "2" },
    });
    expect(historicosSubstituicao).toEqual([
      {
        numeroAnterior: "1",
        numeroNovo: "2",
        createdById: DIRETOR_ID,
      },
    ]);
  });

  it("rejeita patrimônio ausente, tipo inelegível e número divergente", async () => {
    database.patrimonio.findUnique.mockResolvedValueOnce(null);
    const ausente = await postSubstituicao(tokenDiretor).send({
      numeroPatrimonioAtual: "1",
    });
    expect(ausente.status).toBe(404);
    expect(ausente.body.codigo).toBe("PATRIMONIO_NAO_ENCONTRADO");

    numeroAtual = "SP-1";
    const semNumero = await postSubstituicao(tokenDiretor).send({
      numeroPatrimonioAtual: "1",
    });
    expect(semNumero.status).toBe(409);
    expect(semNumero.body.codigo).toBe("TIPO_NUMERO_PATRIMONIAL_NAO_ELEGIVEL");

    numeroAtual = "2";
    const divergente = await postSubstituicao(tokenDiretor).send({
      numeroPatrimonioAtual: "1",
    });
    expect(divergente.status).toBe(409);
    expect(divergente.body.codigo).toBe("NUMERO_PATRIMONIAL_ATUAL_DIVERGENTE");

    expect(database.$queryRaw).not.toHaveBeenCalled();
    expect(database.patrimonio.updateMany).not.toHaveBeenCalled();
    expect(historicosSubstituicao).toEqual([]);
  });

  it("rejeita número novo e propriedades extras no body", async () => {
    const response = await postSubstituicao(tokenDiretor).send({
      numeroPatrimonioAtual: "1",
      numeroNovo: "999",
    });

    expect(response.status).toBe(400);
    expect(RespostaErroSchema.safeParse(response.body).success).toBe(true);
    expect(database.$queryRaw).not.toHaveBeenCalled();
    expect(database.patrimonio.updateMany).not.toHaveBeenCalled();
  });
});
