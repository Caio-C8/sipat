import type {
  CriarPatrimonioBodyData,
  IdentidadeAutenticada,
} from "@repo/contracts";
import { createDatabaseClient, type DatabaseClient } from "@repo/database";
import { PatrimoniosRepository } from "../src/modules/patrimonios/patrimonios.repository";
import { PatrimoniosService } from "../src/modules/patrimonios/patrimonios.service";

const databaseUrl = process.env.PATRIMONIOS_INTEGRATION_DATABASE_URL;
const describeComPostgres = databaseUrl ? describe : describe.skip;

describeComPostgres("cadastro de patrimônios no PostgreSQL", () => {
  let database: DatabaseClient;
  let service: PatrimoniosService;
  let identidade: IdentidadeAutenticada;
  let setorId: string;
  let especieId: string;

  jest.setTimeout(60_000);

  beforeAll(async () => {
    if (!databaseUrl?.includes("/sipat_patrimonios001_test")) {
      throw new Error(
        "PATRIMONIOS_INTEGRATION_DATABASE_URL deve apontar para sipat_patrimonios001_test.",
      );
    }

    database = createDatabaseClient(databaseUrl);
    await database.$connect();
    service = new PatrimoniosService(new PatrimoniosRepository(database));
  });

  afterAll(async () => database?.$disconnect());

  beforeEach(async () => {
    await database.$executeRawUnsafe('TRUNCATE TABLE "usuarios" CASCADE');
    await database.$executeRawUnsafe(
      'ALTER SEQUENCE "patrimonios_numero_oficial_seq" RESTART WITH 1',
    );
    await database.$executeRawUnsafe(
      'ALTER SEQUENCE "patrimonios_sem_numero_oficial_seq" RESTART WITH 1',
    );

    const diretor = await database.usuario.create({
      data: {
        nome: "Diretor",
        email: "diretor@example.com",
        senha: "hash-de-integracao",
        perfil: "DIRETOR_PATRIMONIO",
        ativo: true,
      },
    });
    identidade = {
      id: diretor.id,
      nome: diretor.nome,
      email: diretor.email,
      perfil: diretor.perfil,
    };
    const responsavel = await database.responsavel.create({
      data: {
        nome: "Responsável",
        matricula: "123",
        createdById: diretor.id,
      },
    });
    const setor = await database.setor.create({
      data: {
        nome: "Almoxarifado",
        responsavelId: responsavel.id,
        createdById: diretor.id,
      },
    });
    setorId = setor.id;
    const natureza = await database.natureza.create({
      data: {
        nome: "Equipamentos",
        nomeNormalizado: "EQUIPAMENTOS",
        createdById: diretor.id,
      },
    });
    const especie = await database.especie.create({
      data: {
        nome: "Câmera",
        nomeNormalizado: "CAMERA",
        naturezaId: natureza.id,
        createdById: diretor.id,
      },
    });
    especieId = especie.id;
  });

  function dados(
    indice: number,
    semNumeroOficial = false,
  ): CriarPatrimonioBodyData {
    return {
      semNumeroOficial,
      dataTombamento: "2026-10-18",
      tipoIncorporacao: "AQUISICAO",
      descricao: `Câmera ${indice}`,
      numeroSerie: `série-${indice}`,
      valorIncorporacao: "1000",
      especieId,
      setorAtualId: setorId,
      parametrosDepreciacao: {
        metodo: "LINEAR",
        vidaUtilInicialMeses: 60,
        percentualResidual: "10",
        valorResidual: "100",
        valorBaseInicial: "1000",
        dataInicio: "2026-10-18",
      },
    };
  }

  it("gera identificadores exclusivos e independentes sob concorrência", async () => {
    const criados = await Promise.all([
      ...Array.from({ length: 8 }, (_, indice) =>
        service.criar(dados(indice), identidade),
      ),
      ...Array.from({ length: 8 }, (_, indice) =>
        service.criar(dados(indice + 100, true), identidade),
      ),
    ]);

    const oficiais = criados
      .filter(
        ({ tipoNumeroPatrimonial }) => tipoNumeroPatrimonial === "OFICIAL",
      )
      .map(({ numeroPatrimonio }) => numeroPatrimonio);
    const semNumero = criados
      .filter(
        ({ tipoNumeroPatrimonial }) =>
          tipoNumeroPatrimonial === "SEM_NUMERO_OFICIAL",
      )
      .map(({ numeroPatrimonio }) => numeroPatrimonio);

    expect(new Set(oficiais).size).toBe(8);
    expect(new Set(semNumero).size).toBe(8);
    expect(oficiais.every((numero) => /^[1-9]\d*$/.test(numero))).toBe(true);
    expect(semNumero.every((numero) => /^SP-[1-9]\d*$/.test(numero))).toBe(
      true,
    );
    expect(await database.situacaoContabilPatrimonio.count()).toBe(16);
    expect(await database.parametroDepreciacao.count()).toBe(16);
  });

  it("não deixa registros iniciais parciais quando a série conflita", async () => {
    await service.criar(dados(1), identidade);

    await expect(
      service.criar(dados(1, true), identidade),
    ).rejects.toMatchObject({
      response: expect.objectContaining({
        codigo: "NUMERO_SERIE_JA_EXISTENTE",
      }),
    });

    expect(await database.patrimonio.count()).toBe(1);
    expect(await database.situacaoContabilPatrimonio.count()).toBe(1);
    expect(await database.parametroDepreciacao.count()).toBe(1);
  });
});
