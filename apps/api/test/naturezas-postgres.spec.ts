import type { IdentidadeAutenticada } from "@repo/contracts";
import { createDatabaseClient, type DatabaseClient } from "@repo/database";
import { NaturezasRepository } from "../src/modules/naturezas/naturezas.repository";
import { NaturezasService } from "../src/modules/naturezas/naturezas.service";

const databaseUrl = process.env.NATUREZAS_INTEGRATION_DATABASE_URL;
const describeComPostgres = databaseUrl ? describe : describe.skip;

describeComPostgres("naturezas no PostgreSQL", () => {
  let database: DatabaseClient;
  let service: NaturezasService;
  let identidade: IdentidadeAutenticada;

  jest.setTimeout(60_000);

  beforeAll(async () => {
    if (!databaseUrl?.includes("/sipat_naturezas001_test")) {
      throw new Error(
        "NATUREZAS_INTEGRATION_DATABASE_URL deve apontar para sipat_naturezas001_test.",
      );
    }

    database = createDatabaseClient(databaseUrl);
    await database.$connect();
    service = new NaturezasService(new NaturezasRepository(database));
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
    };
  });

  it("permite somente um nome normalizado sob criações concorrentes", async () => {
    const resultados = await Promise.allSettled([
      service.criar({ nome: "Máquinas" }, identidade),
      service.criar({ nome: "maquinas" }, identidade),
    ]);

    expect(
      resultados.filter(({ status }) => status === "fulfilled"),
    ).toHaveLength(1);
    expect(
      resultados.filter(
        (resultado): resultado is PromiseRejectedResult =>
          resultado.status === "rejected" &&
          (resultado.reason as { response?: { codigo?: string } }).response
            ?.codigo === "NOME_NATUREZA_JA_EXISTENTE",
      ),
    ).toHaveLength(1);
    expect(await database.natureza.count()).toBe(1);
  });

  it("altera sem excluir nem romper vínculo existente", async () => {
    const natureza = await service.criar({ nome: "Máquinas" }, identidade);
    const especie = await database.especie.create({
      data: {
        nome: "Torno mecânico",
        nomeNormalizado: "TORNO MECANICO",
        naturezaId: natureza.id,
        createdById: identidade.id,
      },
    });

    await service.alterar(natureza.id, { nome: "Máquinas industriais" });

    await expect(service.consultar(natureza.id)).resolves.toMatchObject({
      id: natureza.id,
      nome: "Máquinas industriais",
      nomeNormalizado: "MAQUINAS INDUSTRIAIS",
    });
    await expect(
      database.especie.findUniqueOrThrow({ where: { id: especie.id } }),
    ).resolves.toMatchObject({ naturezaId: natureza.id });
    expect(await database.natureza.count()).toBe(1);
  });
});
