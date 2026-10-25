import { ConfigService } from "@nestjs/config";
import { createDatabaseClient, type DatabaseClient } from "@repo/database";
import { mkdtemp, readdir, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { CoordenadorDocumentosService } from "../src/common/storage/coordenador-documentos.service";
import { SistemaArquivosLocalAdapter } from "../src/common/storage/sistema-arquivos-local.adapter";
import type { EnvironmentVariables } from "../src/environment";
import { FornecedoresRepository } from "../src/modules/fornecedores/fornecedores.repository";
import { FornecedoresService } from "../src/modules/fornecedores/fornecedores.service";
import { ProcessosCompraRepository } from "../src/modules/processos-compra/processos-compra.repository";
import { ProcessosCompraService } from "../src/modules/processos-compra/processos-compra.service";

const databaseUrl = process.env.PROCESSOS_COMPRA_INTEGRATION_DATABASE_URL;
const describeComPostgres = databaseUrl ? describe : describe.skip;

describeComPostgres("processos de compra no PostgreSQL", () => {
  let database: DatabaseClient;
  let service: ProcessosCompraService;
  let uploadsRoot: string;
  let entradaRoot: string;
  let usuarioId: string;
  let fornecedorId: string;

  jest.setTimeout(60_000);

  beforeAll(async () => {
    if (!databaseUrl?.includes("/sipat_compras001_test")) {
      throw new Error(
        "PROCESSOS_COMPRA_INTEGRATION_DATABASE_URL deve apontar para sipat_compras001_test.",
      );
    }

    database = createDatabaseClient(databaseUrl);
    await database.$connect();
    uploadsRoot = await mkdtemp(
      path.join(os.tmpdir(), "sipat-compras-uploads-"),
    );
    entradaRoot = await mkdtemp(
      path.join(os.tmpdir(), "sipat-compras-entrada-"),
    );
    const config = new ConfigService<EnvironmentVariables, true>({
      UPLOADS_ROOT_PATH: uploadsRoot,
    } as EnvironmentVariables);
    const armazenamento = new SistemaArquivosLocalAdapter(config);
    await armazenamento.onModuleInit();

    service = new ProcessosCompraService(
      new ProcessosCompraRepository(database),
      new FornecedoresService(new FornecedoresRepository(database)),
      new CoordenadorDocumentosService(armazenamento),
    );
  });

  afterAll(async () => {
    await database?.$disconnect();
    await rm(uploadsRoot, { recursive: true, force: true });
    await rm(entradaRoot, { recursive: true, force: true });
  });

  beforeEach(async () => {
    await database.$executeRawUnsafe('TRUNCATE TABLE "usuarios" CASCADE');
    const usuario = await database.usuario.create({
      data: {
        nome: "Diretor",
        email: "diretor-compras@example.com",
        senha: "hash-de-integracao",
        perfil: "DIRETOR_PATRIMONIO",
      },
    });
    usuarioId = usuario.id;
    const fornecedor = await database.fornecedor.create({
      data: {
        razaoSocial: "Fornecedor ativo",
        ativo: true,
        createdById: usuario.id,
      },
    });
    fornecedorId = fornecedor.id;

    const finais = path.join(uploadsRoot, "notas-fiscais");
    for (const arquivo of await readdir(finais)) {
      await rm(path.join(finais, arquivo), { force: true });
    }
  });

  function identidade(id = usuarioId) {
    return {
      id,
      nome: "Diretor",
      email: "diretor-compras@example.com",
      perfil: "DIRETOR_PATRIMONIO" as const,
      trocaSenhaObrigatoria: false,
    };
  }

  function dados(indice: number, anexoIndice?: number) {
    return {
      dados: JSON.stringify({
        numeroProcesso: `PROC-${indice}`,
        anoProcesso: 2026,
        notas: [
          {
            numeroNotaFiscal: `NF-${indice}`,
            anoNotaFiscal: 2026,
            dataEmissao: "2026-10-19",
            fornecedorId,
            ...(anexoIndice === undefined ? {} : { anexoIndice }),
          },
        ],
      }),
    };
  }

  it("remove o arquivo e reverte processo e nota quando a transação falha", async () => {
    const caminhoEntrada = path.join(entradaRoot, "falha.pdf");
    await writeFile(caminhoEntrada, "%PDF-1.7\nconteudo");

    await expect(
      service.criar(
        dados(1, 0),
        [
          {
            originalname: "falha.pdf",
            mimetype: "application/pdf",
            path: caminhoEntrada,
            size: 18,
          },
        ],
        identidade("11111111-1111-4111-8111-111111111111"),
      ),
    ).rejects.toBeDefined();

    expect(await database.processoCompra.count()).toBe(0);
    expect(await database.notaFiscal.count()).toBe(0);
    expect(await readdir(path.join(uploadsRoot, "notas-fiscais"))).toEqual([]);
  });

  it("preserva relações e auditoria em criações concorrentes", async () => {
    const criados = await Promise.all(
      Array.from({ length: 8 }, (_, indice) =>
        service.criar(dados(indice), [], identidade()),
      ),
    );

    expect(new Set(criados.map(({ id }) => id)).size).toBe(8);
    expect(await database.processoCompra.count()).toBe(8);
    expect(await database.notaFiscal.count()).toBe(8);
    expect(
      await database.processoCompra.count({
        where: { createdById: usuarioId },
      }),
    ).toBe(8);
    expect(
      await database.notaFiscal.count({
        where: { createdById: usuarioId, fornecedorId },
      }),
    ).toBe(8);
  });
});
