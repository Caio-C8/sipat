import type { IdentidadeAutenticada } from "@repo/contracts";
import { createDatabaseClient, type DatabaseClient } from "@repo/database";
import { EspeciesRepository } from "../src/modules/especies/especies.repository";
import { EspeciesService } from "../src/modules/especies/especies.service";
import { NaturezasRepository } from "../src/modules/naturezas/naturezas.repository";
import { NaturezasService } from "../src/modules/naturezas/naturezas.service";

const databaseUrl = process.env.ESPECIES_INTEGRATION_DATABASE_URL;
const describeComPostgres = databaseUrl ? describe : describe.skip;

describeComPostgres("espécies no PostgreSQL", () => {
  let database: DatabaseClient;
  let service: EspeciesService;
  let naturezaId: string;
  let outraNaturezaId: string;
  let identidade: IdentidadeAutenticada;

  jest.setTimeout(60_000);

  beforeAll(async () => {
    if (!databaseUrl?.includes("/sipat_especies001_test")) {
      throw new Error(
        "ESPECIES_INTEGRATION_DATABASE_URL deve apontar para sipat_especies001_test.",
      );
    }

    database = createDatabaseClient(databaseUrl);
    await database.$connect();
    service = new EspeciesService(
      new EspeciesRepository(database),
      new NaturezasService(new NaturezasRepository(database)),
    );
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
    const [natureza, outraNatureza] = await Promise.all([
      database.natureza.create({
        data: {
          nome: "Equipamentos",
          nomeNormalizado: "EQUIPAMENTOS",
          createdById: administrador.id,
        },
      }),
      database.natureza.create({
        data: {
          nome: "Mobiliário",
          nomeNormalizado: "MOBILIARIO",
          createdById: administrador.id,
        },
      }),
    ]);
    naturezaId = natureza.id;
    outraNaturezaId = outraNatureza.id;
  });

  it("permite somente um nome normalizado sob criações concorrentes", async () => {
    const resultados = await Promise.allSettled([
      service.criar({ nome: "Notebóok", naturezaId }, identidade),
      service.criar({ nome: "notebook", naturezaId }, identidade),
    ]);

    expect(
      resultados.filter(({ status }) => status === "fulfilled"),
    ).toHaveLength(1);
    expect(
      resultados.filter(
        (resultado): resultado is PromiseRejectedResult =>
          resultado.status === "rejected" &&
          (resultado.reason as { response?: { codigo?: string } }).response
            ?.codigo === "NOME_ESPECIE_JA_EXISTENTE",
      ),
    ).toHaveLength(1);
    expect(await database.especie.count()).toBe(1);
  });

  it("muda a natureza sem romper o patrimônio vinculado", async () => {
    const especie = await service.criar(
      { nome: "Notebook", naturezaId },
      identidade,
    );
    const responsavel = await database.responsavel.create({
      data: {
        nome: "Responsável",
        matricula: "123",
        createdById: identidade.id,
      },
    });
    const setor = await database.setor.create({
      data: {
        nome: "Patrimônio",
        responsavelId: responsavel.id,
        createdById: identidade.id,
      },
    });
    const patrimonio = await database.patrimonio.create({
      data: {
        numeroPatrimonio: "000001",
        tipoNumeroPatrimonial: "OFICIAL",
        descricao: "Notebook de teste",
        valorIncorporacao: "1000.00",
        dataTombamento: new Date("2026-10-19T00:00:00.000Z"),
        especieId: especie.id,
        setorAtualId: setor.id,
        createdById: identidade.id,
      },
    });

    await service.alterar(especie.id, { naturezaId: outraNaturezaId });

    await expect(service.consultar(especie.id)).resolves.toMatchObject({
      id: especie.id,
      natureza: { id: outraNaturezaId },
    });
    await expect(
      database.patrimonio.findUniqueOrThrow({ where: { id: patrimonio.id } }),
    ).resolves.toMatchObject({ especieId: especie.id });
    expect(await database.especie.count()).toBe(1);
  });
});
