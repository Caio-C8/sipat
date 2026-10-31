import type { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import {
  AlterarProcessoCompraResponseSchema,
  CABECALHO_CSRF,
  CriarProcessoCompraResponseSchema,
  ListarProcessosCompraResponseSchema,
  RespostaErroSchema,
} from "@repo/contracts";
import { Prisma } from "@repo/database";
import cookieParser from "cookie-parser";
import { Readable } from "node:stream";
import request from "supertest";
import { AppModule } from "../src/app.module";
import { DATABASE_CLIENT } from "../src/common/database/database.constants";
import {
  ARMAZENAMENTO_DOCUMENTOS,
  type ArmazenamentoDocumentosPorta,
} from "../src/common/storage/armazenamento-documentos.port";
import { configurarCors } from "../src/configurar-cors";
import { calcularHashTokenSessao } from "../src/modules/auth/token-sessao";

const ADMIN_ID = "28df5e9c-3e60-4a8e-a4d4-8ca70221f4f0";
const DIRETOR_ID = "c5c3cc23-a215-4bba-9ae0-671596433a36";
const FORNECEDOR_ID = "6c167f7a-0e4b-46bb-8c78-bc33585c91fa";
const PROCESSO_ID = "1d71109f-c8e1-4200-bde7-38ed95a4d083";
const NOTA_ID = "8c719276-86c2-427a-8255-d8ad6dff2fd1";
const ORIGEM = "http://localhost:3000";

describe("processos de compra", () => {
  let app: INestApplication;
  const tokenAdministrador = "A".repeat(43);
  const tokenDiretor = "B".repeat(43);
  let processo: ReturnType<typeof processoPersistido>;

  const armazenamento: jest.Mocked<ArmazenamentoDocumentosPorta> = {
    gravar: jest.fn().mockResolvedValue(undefined),
    abrir: jest.fn().mockResolvedValue({
      conteudo: Readable.from("%PDF-1.7"),
      tamanho: 8,
    }),
    substituir: jest.fn().mockResolvedValue(undefined),
    remover: jest.fn().mockResolvedValue(undefined),
    reconciliar: jest.fn(),
  };

  const database = {
    $connect: jest.fn(),
    $disconnect: jest.fn(),
    $transaction: jest.fn(),
    $queryRaw: jest.fn(),
    notaFiscal: { findMany: jest.fn().mockResolvedValue([]) },
    sessaoUsuario: { findUnique: jest.fn(), updateMany: jest.fn() },
    fornecedor: { findUnique: jest.fn() },
    processoCompra: {
      create: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  };

  function processoPersistido(anexo = true) {
    return {
      id: PROCESSO_ID,
      numeroProcesso: "123/2026",
      anoProcesso: 2026,
      numeroEmpenho: "456",
      anoEmpenho: 2026,
      valorTotal: new Prisma.Decimal("100.5"),
      observacao: "Compra anual" as string | null,
      createdAt: new Date("2026-10-19T12:00:00.000Z"),
      updatedAt: null as Date | null,
      notasFiscais: [
        {
          id: NOTA_ID,
          numeroNotaFiscal: "NF-1",
          anoNotaFiscal: 2026,
          dataEmissao: new Date("2026-10-19T00:00:00.000Z"),
          caminhoAnexoNotaFiscal: anexo
            ? "uploads/notas-fiscais/interno.pdf"
            : null,
          fornecedor: { id: FORNECEDOR_ID, razaoSocial: "Fornecedor" },
        },
      ],
      _count: { notasFiscais: 1 },
    };
  }

  beforeAll(async () => {
    database.$transaction.mockImplementation(
      async (operacao: (cliente: typeof database) => Promise<unknown>) =>
        operacao(database),
    );
    database.$queryRaw.mockResolvedValue([{ id: FORNECEDOR_ID, ativo: true }]);
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
            email: `${perfil.toLowerCase()}@example.com`,
            perfil,
            ativo: true,
            trocaSenhaObrigatoria: false,
          },
        };
      },
    );
    database.fornecedor.findUnique.mockResolvedValue({
      id: FORNECEDOR_ID,
      razaoSocial: "Fornecedor",
      nomeFantasia: null,
      nomeRepresentante: null,
      cnpj: null,
      email: null,
      telefone: null,
      endereco: null,
      ativo: true,
      createdAt: new Date(),
      updatedAt: null,
    });
    database.processoCompra.create.mockImplementation(() => processo);
    database.processoCompra.findMany.mockImplementation(() => [processo]);
    database.processoCompra.count.mockResolvedValue(1);
    database.processoCompra.findUnique.mockImplementation(() => processo);
    database.processoCompra.update.mockImplementation(
      ({ data }: { data: { observacao?: string | null; updatedAt: Date } }) => {
        processo = { ...processo, ...data };
        return processo;
      },
    );

    const module = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(DATABASE_CLIENT)
      .useValue(database)
      .overrideProvider(ARMAZENAMENTO_DOCUMENTOS)
      .useValue(armazenamento)
      .compile();

    app = module.createNestApplication();
    app.use(cookieParser());
    app.setGlobalPrefix("api");
    configurarCors(app, `${ORIGEM},http://localhost:8081`);
    await app.init();
  });

  afterAll(async () => app.close());

  beforeEach(() => {
    processo = processoPersistido();
    armazenamento.gravar.mockClear();
    armazenamento.remover.mockClear();
  });

  function dados(anexoIndice: number | null = 0) {
    return JSON.stringify({
      chaveIdempotencia: randomUUID(),
      numeroProcesso: "123/2026",
      anoProcesso: 2026,
      numeroEmpenho: "456",
      anoEmpenho: 2026,
      valorTotal: "100.5",
      observacao: "Compra anual",
      notas: [
        {
          numeroNotaFiscal: "NF-1",
          anoNotaFiscal: 2026,
          dataEmissao: "2026-10-19",
          fornecedorId: FORNECEDOR_ID,
          ...(anexoIndice === null ? {} : { anexoIndice }),
        },
      ],
    });
  }

  function postAutenticado(token = tokenAdministrador) {
    return request(app.getHttpServer())
      .post("/api/processos-compra")
      .set("Cookie", `sipat_session=${token}`)
      .set("Origin", ORIGEM)
      .set(CABECALHO_CSRF, "1");
  }

  it.each([tokenAdministrador, tokenDiretor])(
    "permite aos dois perfis criar multipart com PDF válido",
    async (token) => {
      const response = await postAutenticado(token)
        .field("dados", dados())
        .attach("anexos", Buffer.from("%PDF-1.7\nconteudo"), {
          filename: "nota.pdf",
          contentType: "application/pdf",
        });

      expect(response.status).toBe(201);
      expect(
        CriarProcessoCompraResponseSchema.safeParse(response.body).success,
      ).toBe(true);
      expect(response.body.dados.notas[0].anexoUrl).toBe(
        `/api/notas-fiscais/${NOTA_ID}/anexo`,
      );
      expect(JSON.stringify(response.body)).not.toContain("uploads/");
      expect(armazenamento.gravar).toHaveBeenCalledTimes(1);
    },
  );

  it("aplica autenticação, CSRF e validação real do PDF", async () => {
    const anonimo = await request(app.getHttpServer())
      .post("/api/processos-compra")
      .field("dados", dados());
    expect(anonimo.status).toBe(401);

    const semCsrf = await request(app.getHttpServer())
      .post("/api/processos-compra")
      .set("Cookie", `sipat_session=${tokenAdministrador}`)
      .set("Origin", ORIGEM)
      .field("dados", dados());
    expect(semCsrf.status).toBe(403);

    const invalido = await postAutenticado()
      .field("dados", dados())
      .attach("anexos", Buffer.from("nao-e-pdf"), {
        filename: "nota.pdf",
        contentType: "application/pdf",
      });
    expect(invalido.status).toBe(400);
    expect(RespostaErroSchema.safeParse(invalido.body).success).toBe(true);
    expect(invalido.body.codigo).toBe("CONTEUDO_PDF_INVALIDO");
  });

  it("rejeita arquivo sem nota consumidora", async () => {
    const response = await postAutenticado()
      .field("dados", dados(null))
      .attach("anexos", Buffer.from("%PDF-1.7"), {
        filename: "nota.pdf",
        contentType: "application/pdf",
      });

    expect(response.status).toBe(400);
    expect(response.body.codigo).toBe("VALIDACAO_ENTRADA_INVALIDA");
    expect(armazenamento.gravar).not.toHaveBeenCalled();
  });

  it("lista com paginação e altera somente os campos do contrato", async () => {
    const listar = await request(app.getHttpServer())
      .get("/api/processos-compra?pagina=1&limite=20&anoProcesso=2026")
      .set("Cookie", `sipat_session=${tokenDiretor}`);
    expect(listar.status).toBe(200);
    expect(
      ListarProcessosCompraResponseSchema.safeParse(listar.body).success,
    ).toBe(true);

    const alterar = await request(app.getHttpServer())
      .patch(`/api/processos-compra/${PROCESSO_ID}`)
      .set("Cookie", `sipat_session=${tokenDiretor}`)
      .set("Origin", ORIGEM)
      .set(CABECALHO_CSRF, "1")
      .send({ observacao: null });
    expect(alterar.status).toBe(200);
    expect(
      AlterarProcessoCompraResponseSchema.safeParse(alterar.body).success,
    ).toBe(true);
    expect(alterar.body.dados.observacao).toBeNull();
  });
});
import { randomUUID } from "node:crypto";
