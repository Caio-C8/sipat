import { type INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import {
  CABECALHO_CSRF,
  ConsultarInventarioResponseSchema,
  CriarInventarioResponseSchema,
  ListarInventariosResponseSchema,
  ListarItensInventarioResponseSchema,
  ListarSetoresInventarioResponseSchema,
  RespostaErroSchema,
} from "@repo/contracts";
import cookieParser from "cookie-parser";
import request from "supertest";
import { AppModule } from "../src/app.module";
import { DATABASE_CLIENT } from "../src/common/database/database.constants";
import { configurarCors } from "../src/configurar-cors";
import { calcularHashTokenSessao } from "../src/modules/auth/token-sessao";
import { InventariosService } from "../src/modules/inventarios/inventarios.service";

const ADMIN_ID = "00000000-0000-4000-8000-000000000001";
const DIRETOR_ID = "00000000-0000-4000-8000-000000000002";
const INVENTARIO_ID = "00000000-0000-4000-8000-000000000003";
const COMISSAO_ID = "00000000-0000-4000-8000-000000000004";
const SETOR_ID = "00000000-0000-4000-8000-000000000005";
const SETOR_INVENTARIO_ID = "00000000-0000-4000-8000-000000000006";
const ITEM_ID = "00000000-0000-4000-8000-000000000007";
const PATRIMONIO_ID = "00000000-0000-4000-8000-000000000008";
const ORIGEM = "http://localhost:3000";

const progresso = {
  totalSetores: 1,
  setoresPendentes: 1,
  setoresEmAndamento: 0,
  setoresConcluidos: 0,
  totalItens: 1,
  itensPendentes: 1,
  itensVerificados: 0,
  corretos: 0,
  divergencias: 0,
  naoLocalizados: 0,
  correcoesPendentes: 0,
  correcoesCorrigidas: 0,
};

function inventario() {
  return {
    id: INVENTARIO_ID,
    nome: "Inventário anual",
    descricao: null,
    observacao: null,
    status: "PENDENTE" as const,
    dataInicio: null,
    dataFim: null,
    iniciadoPorId: null,
    finalizadoPorId: null,
    comissao: { id: COMISSAO_ID, nome: "Comissão de inventário" },
    createdById: DIRETOR_ID,
    createdAt: new Date("2026-10-24T12:00:00.000Z"),
    updatedAt: null,
    progresso,
  };
}

describe("inventários", () => {
  let app: INestApplication;
  const tokenAdministrador = "A".repeat(43);
  const tokenDiretor = "B".repeat(43);
  const database = {
    $connect: jest.fn(),
    $disconnect: jest.fn(),
    sessaoUsuario: { findUnique: jest.fn(), updateMany: jest.fn() },
  };
  const service = {
    listar: jest.fn(),
    consultar: jest.fn(),
    listarSetores: jest.fn(),
    listarItens: jest.fn(),
    criar: jest.fn(),
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
          },
        };
      },
    );
    const modulo = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(DATABASE_CLIENT)
      .useValue(database)
      .overrideProvider(InventariosService)
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
    service.listar.mockResolvedValue({
      items: [inventario()],
      total: 1,
      pagina: 1,
      ultimaPagina: 1,
      limite: 20,
    });
    service.consultar.mockResolvedValue(inventario());
    service.criar.mockResolvedValue(inventario());
    service.listarSetores.mockResolvedValue({
      items: [
        {
          id: SETOR_INVENTARIO_ID,
          status: "PENDENTE",
          dataInicio: null,
          dataFim: null,
          iniciadoPorId: null,
          concluidoPorId: null,
          setor: { id: SETOR_ID, nome: "Almoxarifado" },
          progresso: {
            totalItens: 1,
            itensPendentes: 1,
            itensVerificados: 0,
            corretos: 0,
            divergencias: 0,
            naoLocalizados: 0,
          },
        },
      ],
      total: 1,
      pagina: 1,
      ultimaPagina: 1,
      limite: 20,
    });
    service.listarItens.mockResolvedValue({
      items: [
        {
          id: ITEM_ID,
          statusVerificacao: "PENDENTE",
          situacao: null,
          observacao: null,
          dataVerificacao: null,
          verificadoPorId: null,
          statusPatrimonioNaVerificacao: null,
          emprestimoPatrimonioId: null,
          itemManutencaoId: null,
          statusCorrecao: null,
          tipoCorrecao: null,
          dataCorrecao: null,
          corrigidoPorId: null,
          transferenciaCorrecaoId: null,
          patrimonio: {
            id: PATRIMONIO_ID,
            numeroPatrimonio: "1001",
            descricao: "Notebook",
          },
          setorEsperado: { id: SETOR_ID, nome: "Almoxarifado" },
          setorEncontrado: null,
        },
      ],
      total: 1,
      pagina: 1,
      ultimaPagina: 1,
      limite: 20,
    });
  });

  afterAll(async () => app.close());

  const cookie = (token: string) => `sipat_session=${token}`;
  const getDiretor = (path: string) =>
    request(app.getHttpServer()).get(path).set("Cookie", cookie(tokenDiretor));
  const postDiretor = (path: string) =>
    request(app.getHttpServer())
      .post(path)
      .set("Cookie", cookie(tokenDiretor))
      .set("Origin", ORIGEM)
      .set(CABECALHO_CSRF, "1");

  it("aplica 401 ao anônimo, 403 ao administrador e permite o diretor", async () => {
    const anonimo = await request(app.getHttpServer()).get("/api/inventarios");
    const administrador = await request(app.getHttpServer())
      .get("/api/inventarios")
      .set("Cookie", cookie(tokenAdministrador));
    const diretor = await getDiretor("/api/inventarios");

    expect(anonimo.status).toBe(401);
    expect(administrador.status).toBe(403);
    expect(diretor.status).toBe(200);
    expect(
      ListarInventariosResponseSchema.safeParse(diretor.body).success,
    ).toBe(true);
    expect(RespostaErroSchema.parse(anonimo.body).codigo).toBe(
      "NAO_AUTENTICADO",
    );
    expect(RespostaErroSchema.parse(administrador.body).codigo).toBe(
      "ACESSO_NEGADO",
    );
  });

  it("protege criação com CSRF, valida o body e deriva a identidade", async () => {
    const semCsrf = await request(app.getHttpServer())
      .post("/api/inventarios")
      .set("Cookie", cookie(tokenDiretor))
      .set("Origin", ORIGEM)
      .send({ nome: "Inventário anual", comissaoId: COMISSAO_ID });
    const invalido = await postDiretor("/api/inventarios").send({
      nome: "Inventário anual",
      comissaoId: COMISSAO_ID,
      status: "FINALIZADO",
    });
    const criado = await postDiretor("/api/inventarios").send({
      nome: "Inventário anual",
      comissaoId: COMISSAO_ID,
    });

    expect(semCsrf.status).toBe(403);
    expect(invalido.status).toBe(400);
    expect(criado.status).toBe(201);
    expect(CriarInventarioResponseSchema.safeParse(criado.body).success).toBe(
      true,
    );
    expect(service.criar).toHaveBeenCalledWith(
      { nome: "Inventário anual", comissaoId: COMISSAO_ID },
      expect.objectContaining({ id: DIRETOR_ID, perfil: "DIRETOR_PATRIMONIO" }),
    );
  });

  it("expõe detalhe, setores e itens paginados conforme os contratos", async () => {
    const [detalhe, setores, itens] = await Promise.all([
      getDiretor(`/api/inventarios/${INVENTARIO_ID}`),
      getDiretor(`/api/inventarios/${INVENTARIO_ID}/setores`),
      getDiretor(`/api/inventarios/${INVENTARIO_ID}/itens`),
    ]);

    expect(
      ConsultarInventarioResponseSchema.safeParse(detalhe.body).success,
    ).toBe(true);
    expect(
      ListarSetoresInventarioResponseSchema.safeParse(setores.body).success,
    ).toBe(true);
    expect(
      ListarItensInventarioResponseSchema.safeParse(itens.body).success,
    ).toBe(true);
  });
});
