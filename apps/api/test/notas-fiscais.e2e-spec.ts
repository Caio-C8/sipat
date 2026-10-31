import type { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import {
  AlterarNotaFiscalResponseSchema,
  CABECALHO_CSRF,
  ConsultarNotaFiscalResponseSchema,
  CriarNotaFiscalResponseSchema,
  ListarNotasFiscaisResponseSchema,
  RespostaErroSchema,
} from "@repo/contracts";
import cookieParser from "cookie-parser";
import { Readable } from "node:stream";
import request from "supertest";
import { AppModule } from "../src/app.module";
import { DATABASE_CLIENT } from "../src/common/database/database.constants";
import {
  ARMAZENAMENTO_DOCUMENTOS,
  type ArmazenamentoDocumentosPorta,
} from "../src/common/storage/armazenamento-documentos.port";
import { ErroArmazenamentoDocumentos } from "../src/common/storage/erro-armazenamento-documentos";
import { configurarCors } from "../src/configurar-cors";
import { calcularHashTokenSessao } from "../src/modules/auth/token-sessao";

const ADMIN_ID = "28df5e9c-3e60-4a8e-a4d4-8ca70221f4f0";
const DIRETOR_ID = "c5c3cc23-a215-4bba-9ae0-671596433a36";
const FORNECEDOR_ID = "6c167f7a-0e4b-46bb-8c78-bc33585c91fa";
const PROCESSO_ID = "1d71109f-c8e1-4200-bde7-38ed95a4d083";
const NOTA_ID = "8c719276-86c2-427a-8255-d8ad6dff2fd1";
const CHAVE_ANTIGA = "uploads/notas-fiscais/antiga.pdf";
const ORIGEM = "http://localhost:3000";

type NotaPersistida = ReturnType<typeof criarNotaPersistida>;

function criarNotaPersistida(
  caminhoAnexoNotaFiscal: string | null = CHAVE_ANTIGA,
): {
  id: string;
  numeroNotaFiscal: string;
  anoNotaFiscal: number;
  dataEmissao: Date;
  caminhoAnexoNotaFiscal: string | null;
  fornecedor: { id: string; razaoSocial: string };
  processoCompra: {
    id: string;
    numeroProcesso: string | null;
    anoProcesso: number | null;
  };
  createdAt: Date;
  updatedAt: Date | null;
} {
  return {
    id: NOTA_ID,
    numeroNotaFiscal: "NF-1",
    anoNotaFiscal: 2026,
    dataEmissao: new Date("2026-10-19T00:00:00.000Z"),
    caminhoAnexoNotaFiscal,
    fornecedor: { id: FORNECEDOR_ID, razaoSocial: "Fornecedor" },
    processoCompra: {
      id: PROCESSO_ID,
      numeroProcesso: "123/2026",
      anoProcesso: 2026,
    },
    createdAt: new Date("2026-10-19T12:00:00.000Z"),
    updatedAt: null,
  };
}

async function consumir(stream: Readable): Promise<Buffer> {
  const partes: Buffer[] = [];
  for await (const parte of stream) partes.push(Buffer.from(parte));
  return Buffer.concat(partes);
}

describe("notas fiscais", () => {
  let app: INestApplication;
  let nota: NotaPersistida;
  const arquivos = new Map<string, Buffer>();
  const tokenAdministrador = "A".repeat(43);
  const tokenDiretor = "B".repeat(43);

  const armazenamento: jest.Mocked<ArmazenamentoDocumentosPorta> = {
    gravar: jest.fn(async (chave, conteudo) => {
      if (!/^uploads\/notas-fiscais\/[^/]+\.pdf$/.test(chave)) {
        throw new ErroArmazenamentoDocumentos("Chave lógica inválida.");
      }
      arquivos.set(chave, await consumir(conteudo));
    }),
    abrir: jest.fn(async (chave) => {
      if (!/^uploads\/notas-fiscais\/[^/]+\.pdf$/.test(chave)) {
        throw new ErroArmazenamentoDocumentos("Chave lógica inválida.");
      }
      const conteudo = arquivos.get(chave);
      if (!conteudo) {
        throw new ErroArmazenamentoDocumentos("Documento não encontrado.");
      }
      return { conteudo: Readable.from(conteudo), tamanho: conteudo.length };
    }),
    substituir: jest.fn(),
    remover: jest.fn(async (chave) => {
      arquivos.delete(chave);
    }),
    reconciliar: jest.fn().mockResolvedValue({
      temporariosRemovidos: 0,
      orfaosRemovidos: 0,
    }),
  };

  const database = {
    $connect: jest.fn(),
    $disconnect: jest.fn(),
    $transaction: jest.fn(),
    $queryRaw: jest.fn(),
    sessaoUsuario: { findUnique: jest.fn(), updateMany: jest.fn() },
    fornecedor: { findUnique: jest.fn() },
    processoCompra: { findUnique: jest.fn() },
    notaFiscal: {
      create: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
    },
  };

  beforeAll(async () => {
    database.$transaction.mockImplementation(
      async (operacao: (cliente: typeof database) => Promise<unknown>) =>
        operacao(database),
    );
    database.$queryRaw.mockImplementation((strings: TemplateStringsArray) =>
      strings.join("").includes("pg_try_advisory_xact_lock")
        ? [{ obtido: true }]
        : [{ id: FORNECEDOR_ID, ativo: true }],
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
    database.processoCompra.findUnique.mockResolvedValue({ id: PROCESSO_ID });
    database.notaFiscal.create.mockImplementation(
      ({ data }: { data: Record<string, unknown> }) => {
        nota = {
          ...criarNotaPersistida(
            (data.caminhoAnexoNotaFiscal as string | undefined) ?? null,
          ),
          numeroNotaFiscal: data.numeroNotaFiscal as string,
          anoNotaFiscal: data.anoNotaFiscal as number,
          dataEmissao: data.dataEmissao as Date,
        };
        return nota;
      },
    );
    database.notaFiscal.findMany.mockImplementation(
      ({ select }: { select?: { caminhoAnexoNotaFiscal?: boolean } }) =>
        select?.caminhoAnexoNotaFiscal && Object.keys(select).length === 1
          ? [{ caminhoAnexoNotaFiscal: nota?.caminhoAnexoNotaFiscal ?? null }]
          : [nota],
    );
    database.notaFiscal.count.mockResolvedValue(1);
    database.notaFiscal.findUnique.mockImplementation(
      ({ where }: { where: Record<string, unknown> } = { where: {} }) =>
        where.createdById_chaveCriacao ? null : (nota ?? null),
    );
    database.notaFiscal.update.mockImplementation(
      ({ data }: { data: Record<string, unknown> }) => {
        const fornecedor = data.fornecedor as
          { connect: { id: string } } | undefined;
        nota = {
          ...nota,
          ...(data.numeroNotaFiscal === undefined
            ? {}
            : { numeroNotaFiscal: data.numeroNotaFiscal as string }),
          ...(data.anoNotaFiscal === undefined
            ? {}
            : { anoNotaFiscal: data.anoNotaFiscal as number }),
          ...(data.dataEmissao === undefined
            ? {}
            : { dataEmissao: data.dataEmissao as Date }),
          ...(fornecedor === undefined
            ? {}
            : {
                fornecedor: {
                  id: fornecedor.connect.id,
                  razaoSocial: "Fornecedor",
                },
              }),
          updatedAt: data.updatedAt as Date,
        };
        return nota;
      },
    );
    database.notaFiscal.updateMany.mockImplementation(
      ({
        where,
        data,
      }: {
        where: Record<string, unknown>;
        data: Record<string, unknown>;
      }) => {
        if (
          nota.id !== where.id ||
          nota.caminhoAnexoNotaFiscal !== where.caminhoAnexoNotaFiscal
        ) {
          return { count: 0 };
        }
        nota = {
          ...nota,
          caminhoAnexoNotaFiscal: data.caminhoAnexoNotaFiscal as string | null,
          updatedAt: data.updatedAt as Date,
        };
        return { count: 1 };
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
    nota = criarNotaPersistida();
    arquivos.clear();
    arquivos.set(CHAVE_ANTIGA, Buffer.from("%PDF-1.7\noriginal"));
    jest.clearAllMocks();
  });

  function autenticar(
    requisicao: request.Test,
    token = tokenAdministrador,
    mutacao = false,
  ): request.Test {
    requisicao.set("Cookie", `sipat_session=${token}`);
    if (mutacao) {
      requisicao.set("Origin", ORIGEM).set(CABECALHO_CSRF, "1");
    }
    return requisicao;
  }

  function dadosCriacao(): string {
    return JSON.stringify({
      chaveIdempotencia: randomUUID(),
      processoCompraId: PROCESSO_ID,
      numeroNotaFiscal: "NF-2",
      anoNotaFiscal: 2026,
      dataEmissao: "2026-10-20",
      fornecedorId: FORNECEDOR_ID,
    });
  }

  it("exige sessão em todas as rotas", async () => {
    const respostas = await Promise.all([
      request(app.getHttpServer()).get("/api/notas-fiscais"),
      request(app.getHttpServer()).get(`/api/notas-fiscais/${NOTA_ID}`),
      request(app.getHttpServer()).post("/api/notas-fiscais"),
      request(app.getHttpServer()).patch(`/api/notas-fiscais/${NOTA_ID}`),
      request(app.getHttpServer()).put(`/api/notas-fiscais/${NOTA_ID}/anexo`),
      request(app.getHttpServer()).delete(
        `/api/notas-fiscais/${NOTA_ID}/anexo`,
      ),
      request(app.getHttpServer()).get(`/api/notas-fiscais/${NOTA_ID}/anexo`),
    ]);

    expect(respostas.map((resposta) => resposta.status)).toEqual(
      Array(7).fill(401),
    );
  });

  it.each([tokenAdministrador, tokenDiretor])(
    "permite aos dois perfis listar notas",
    async (token) => {
      const response = await autenticar(
        request(app.getHttpServer()).get(
          `/api/notas-fiscais?processoCompraId=${PROCESSO_ID}`,
        ),
        token,
      );

      expect(response.status).toBe(200);
      expect(
        ListarNotasFiscaisResponseSchema.safeParse(response.body).success,
      ).toBe(true);
      expect(JSON.stringify(response.body)).not.toContain("uploads/");
    },
  );

  it("consulta o detalhe e altera somente metadados permitidos", async () => {
    const consultar = await autenticar(
      request(app.getHttpServer()).get(`/api/notas-fiscais/${NOTA_ID}`),
      tokenDiretor,
    );
    expect(consultar.status).toBe(200);
    expect(
      ConsultarNotaFiscalResponseSchema.safeParse(consultar.body).success,
    ).toBe(true);

    const alterar = await autenticar(
      request(app.getHttpServer()).patch(`/api/notas-fiscais/${NOTA_ID}`),
      tokenAdministrador,
      true,
    ).send({ numeroNotaFiscal: "NF-1A", dataEmissao: "2026-10-20" });
    expect(alterar.status).toBe(200);
    expect(
      AlterarNotaFiscalResponseSchema.safeParse(alterar.body).success,
    ).toBe(true);
    expect(alterar.body.dados).toMatchObject({
      numeroNotaFiscal: "NF-1A",
      dataEmissao: "2026-10-20",
    });

    const proibido = await autenticar(
      request(app.getHttpServer()).patch(`/api/notas-fiscais/${NOTA_ID}`),
      tokenAdministrador,
      true,
    ).send({ caminhoAnexoNotaFiscal: "uploads/notas-fiscais/injetado.pdf" });
    expect(proibido.status).toBe(400);
  });

  it("cria nota multipart e aplica CSRF nas mutações", async () => {
    const semCsrf = await request(app.getHttpServer())
      .post("/api/notas-fiscais")
      .set("Cookie", `sipat_session=${tokenAdministrador}`)
      .field("dados", dadosCriacao());
    expect(semCsrf.status).toBe(403);

    const response = await autenticar(
      request(app.getHttpServer()).post("/api/notas-fiscais"),
      tokenDiretor,
      true,
    )
      .field("dados", dadosCriacao())
      .attach("anexo", Buffer.from("%PDF-1.7\nnovo"), {
        filename: "nota.pdf",
        contentType: "application/pdf",
      });

    expect(response.status).toBe(201);
    expect(CriarNotaFiscalResponseSchema.safeParse(response.body).success).toBe(
      true,
    );
    expect(response.body.dados.anexoUrl).toBe(
      `/api/notas-fiscais/${NOTA_ID}/anexo`,
    );
  });

  it("rejeita conteúdo inválido e PDF maior que 10 MiB durante a recepção", async () => {
    const invalido = await autenticar(
      request(app.getHttpServer()).put(`/api/notas-fiscais/${NOTA_ID}/anexo`),
      tokenAdministrador,
      true,
    ).attach("anexo", Buffer.from("não é PDF"), {
      filename: "nota.pdf",
      contentType: "application/pdf",
    });
    expect(invalido.status).toBe(400);
    expect(RespostaErroSchema.safeParse(invalido.body).success).toBe(true);

    const grande = await autenticar(
      request(app.getHttpServer()).put(`/api/notas-fiscais/${NOTA_ID}/anexo`),
      tokenAdministrador,
      true,
    ).attach("anexo", Buffer.alloc(10 * 1024 * 1024 + 1, 1), {
      filename: "nota.pdf",
      contentType: "application/pdf",
    });
    expect(grande.status).toBe(413);
  });

  it("substitui, transmite com headers privados e remove o PDF sem apagar a nota", async () => {
    const substituir = await autenticar(
      request(app.getHttpServer()).put(`/api/notas-fiscais/${NOTA_ID}/anexo`),
      tokenAdministrador,
      true,
    ).attach("anexo", Buffer.from("%PDF-1.7\nsubstituido"), {
      filename: "nota.pdf",
      contentType: "application/pdf",
    });
    expect(substituir.status).toBe(200);
    expect(arquivos.has(CHAVE_ANTIGA)).toBe(false);

    const download = await autenticar(
      request(app.getHttpServer()).get(`/api/notas-fiscais/${NOTA_ID}/anexo`),
      tokenDiretor,
    );
    expect(download.status).toBe(200);
    expect(download.headers["content-type"]).toContain("application/pdf");
    expect(download.headers["content-disposition"]).toBe(
      `attachment; filename="nota-fiscal-${NOTA_ID}.pdf"`,
    );
    expect(download.headers["content-length"]).toBe(
      String(Buffer.byteLength("%PDF-1.7\nsubstituido")),
    );
    expect(download.headers["cache-control"]).toBe("private, no-store");

    const remover = () =>
      autenticar(
        request(app.getHttpServer()).delete(
          `/api/notas-fiscais/${NOTA_ID}/anexo`,
        ),
        tokenAdministrador,
        true,
      );
    expect((await remover()).status).toBe(200);
    expect((await remover()).status).toBe(200);
    expect(nota.caminhoAnexoNotaFiscal).toBeNull();
    expect(database.notaFiscal.findUnique()).toBe(nota);
  });

  it("não serve chave malformada, traversal nem arquivo sem referência", async () => {
    nota.caminhoAnexoNotaFiscal = "uploads/notas-fiscais/../segredo.pdf";
    const traversal = await autenticar(
      request(app.getHttpServer()).get(`/api/notas-fiscais/${NOTA_ID}/anexo`),
    );
    expect(traversal.status).toBe(404);

    nota.caminhoAnexoNotaFiscal = null;
    const semReferencia = await autenticar(
      request(app.getHttpServer()).get(`/api/notas-fiscais/${NOTA_ID}/anexo`),
    );
    expect(semReferencia.status).toBe(404);
  });
});
import { randomUUID } from "node:crypto";
