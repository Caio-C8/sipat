import type { IdentidadeAutenticada } from "@repo/contracts";
import { createDatabaseClient, type DatabaseClient } from "@repo/database";
import { ResponsaveisRepository } from "../src/modules/responsaveis/responsaveis.repository";
import { ResponsaveisService } from "../src/modules/responsaveis/responsaveis.service";

const databaseUrl = process.env.RESPONSAVEIS_INTEGRATION_DATABASE_URL;
const describeComPostgres = databaseUrl ? describe : describe.skip;

describeComPostgres("responsáveis no PostgreSQL", () => {
  let database: DatabaseClient;
  let service: ResponsaveisService;
  let identidade: IdentidadeAutenticada;

  jest.setTimeout(60_000);

  beforeAll(async () => {
    if (!databaseUrl?.includes("/sipat_responsaveis001_test")) {
      throw new Error(
        "RESPONSAVEIS_INTEGRATION_DATABASE_URL deve apontar para sipat_responsaveis001_test.",
      );
    }

    database = createDatabaseClient(databaseUrl);
    await database.$connect();
    service = new ResponsaveisService(new ResponsaveisRepository(database));
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

  it("permite somente uma matrícula sob criações concorrentes", async () => {
    const resultados = await Promise.allSettled([
      service.criar(
        { nome: "Responsável Um", matricula: "MAT-CONCORRENTE" },
        identidade,
      ),
      service.criar(
        { nome: "Responsável Dois", matricula: "MAT-CONCORRENTE" },
        identidade,
      ),
    ]);

    expect(
      resultados.filter(({ status }) => status === "fulfilled"),
    ).toHaveLength(1);
    expect(
      resultados.filter(
        (resultado): resultado is PromiseRejectedResult =>
          resultado.status === "rejected" &&
          (resultado.reason as { response?: { codigo?: string } }).response
            ?.codigo === "MATRICULA_RESPONSAVEL_JA_EXISTENTE",
      ),
    ).toHaveLength(1);
    expect(await database.responsavel.count()).toBe(1);
  });

  it("inativa sem excluir nem romper vínculo existente", async () => {
    const responsavel = await service.criar(
      { nome: "Responsável", matricula: "MAT-HISTORICO" },
      identidade,
    );
    const setor = await database.setor.create({
      data: {
        nome: "Almoxarifado",
        responsavelId: responsavel.id,
        createdById: identidade.id,
      },
    });

    await service.alterarSituacao(responsavel.id, { ativo: false });

    await expect(service.consultar(responsavel.id)).resolves.toMatchObject({
      id: responsavel.id,
      ativo: false,
    });
    await expect(
      database.setor.findUniqueOrThrow({ where: { id: setor.id } }),
    ).resolves.toMatchObject({ responsavelId: responsavel.id });
    expect(await database.responsavel.count()).toBe(1);
  });
});
