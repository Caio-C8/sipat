import type { IdentidadeAutenticada } from "@repo/contracts";
import { createDatabaseClient, type DatabaseClient } from "@repo/database";
import { FornecedoresRepository } from "../src/modules/fornecedores/fornecedores.repository";
import { FornecedoresService } from "../src/modules/fornecedores/fornecedores.service";

const databaseUrl = process.env.FORNECEDORES_INTEGRATION_DATABASE_URL;
const describeComPostgres = databaseUrl ? describe : describe.skip;
const CNPJ = "11222333000181";

describeComPostgres("fornecedores no PostgreSQL", () => {
  let database: DatabaseClient;
  let service: FornecedoresService;
  let identidade: IdentidadeAutenticada;

  jest.setTimeout(60_000);

  beforeAll(async () => {
    if (!databaseUrl?.includes("/sipat_fornecedores001_test")) {
      throw new Error(
        "FORNECEDORES_INTEGRATION_DATABASE_URL deve apontar para sipat_fornecedores001_test.",
      );
    }

    database = createDatabaseClient(databaseUrl);
    await database.$connect();
    service = new FornecedoresService(new FornecedoresRepository(database));
  });

  afterAll(async () => database?.$disconnect());

  beforeEach(async () => {
    await database.$executeRawUnsafe('TRUNCATE TABLE "usuarios" CASCADE');
    const administrador = await database.usuario.create({
      data: {
        nome: "Administrador",
        email: "admin@example.com",
        senha: "hash-de-integracao",
        perfil: "ADMINISTRADOR",
        ativo: true,
      },
    });
    identidade = {
      id: administrador.id,
      nome: administrador.nome,
      email: administrador.email,
      perfil: administrador.perfil,
      trocaSenhaObrigatoria: false,
    };
  });

  it("permite somente um CNPJ sob criações concorrentes", async () => {
    const resultados = await Promise.allSettled([
      service.criar({ razaoSocial: "Fornecedor Um", cnpj: CNPJ }, identidade),
      service.criar({ razaoSocial: "Fornecedor Dois", cnpj: CNPJ }, identidade),
    ]);

    expect(
      resultados.filter(({ status }) => status === "fulfilled"),
    ).toHaveLength(1);
    expect(
      resultados.filter(
        (resultado): resultado is PromiseRejectedResult =>
          resultado.status === "rejected" &&
          (resultado.reason as { response?: { codigo?: string } }).response
            ?.codigo === "CNPJ_FORNECEDOR_JA_EXISTENTE",
      ),
    ).toHaveLength(1);
    expect(await database.fornecedor.count()).toBe(1);
  });

  it("inativa sem excluir nem romper vínculos históricos", async () => {
    const fornecedor = await service.criar(
      { razaoSocial: "Fornecedor Histórico", cnpj: CNPJ },
      identidade,
    );
    const processo = await database.processoCompra.create({
      data: {
        numeroProcesso: "PROC-FORNECEDOR-001",
        createdById: identidade.id,
      },
    });
    const notaFiscal = await database.notaFiscal.create({
      data: {
        numeroNotaFiscal: "NF-001",
        anoNotaFiscal: 2026,
        dataEmissao: new Date("2026-10-19T00:00:00.000Z"),
        processoCompraId: processo.id,
        fornecedorId: fornecedor.id,
        createdById: identidade.id,
      },
    });

    await service.alterarSituacao(fornecedor.id, { ativo: false });

    await expect(service.consultar(fornecedor.id)).resolves.toMatchObject({
      id: fornecedor.id,
      ativo: false,
    });
    await expect(
      database.notaFiscal.findUniqueOrThrow({ where: { id: notaFiscal.id } }),
    ).resolves.toMatchObject({ fornecedorId: fornecedor.id });
    expect(await database.fornecedor.count()).toBe(1);
  });
});
