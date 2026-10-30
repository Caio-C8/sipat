import type {
  CriarPatrimonioBodyData,
  IdentidadeAutenticada,
} from "@repo/contracts";
import { createDatabaseClient, type DatabaseClient } from "@repo/database";
import { PatrimoniosRepository } from "../src/modules/patrimonios/patrimonios.repository";
import { PatrimoniosService } from "../src/modules/patrimonios/patrimonios.service";

const databaseUrl = process.env.PATRIMONIOS_INTEGRATION_DATABASE_URL;
const describeComPostgres = databaseUrl ? describe : describe.skip;

describeComPostgres("patrimônios no PostgreSQL", () => {
  let database: DatabaseClient;
  let service: PatrimoniosService;
  let identidade: IdentidadeAutenticada;
  let setorId: string;
  let especieId: string;
  let naturezaId: string;

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
      trocaSenhaObrigatoria: false,
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
    naturezaId = natureza.id;
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

  it("substitui o número preservando o patrimônio e registra a auditoria", async () => {
    const criado = await service.criar(dados(1), identidade);
    const antes = await database.patrimonio.findUniqueOrThrow({
      where: { id: criado.id },
      include: {
        situacaoContabil: true,
        parametrosDepreciacao: true,
      },
    });

    const substituido = await service.substituirNumero(
      criado.id,
      { numeroPatrimonioAtual: criado.numeroPatrimonio },
      identidade,
    );
    const depois = await database.patrimonio.findUniqueOrThrow({
      where: { id: criado.id },
      include: {
        situacaoContabil: true,
        parametrosDepreciacao: true,
      },
    });
    const historicos = await database.substituicaoNumeroPatrimonial.findMany({
      where: { patrimonioId: criado.id },
    });

    expect(substituido.numeroPatrimonio).toBe("2");
    expect(depois).toEqual({ ...antes, numeroPatrimonio: "2" });
    expect(historicos).toHaveLength(1);
    expect(historicos[0]).toMatchObject({
      patrimonioId: criado.id,
      numeroAnterior: "1",
      numeroNovo: "2",
      createdById: identidade.id,
    });
    expect(historicos[0]?.createdAt).toBeInstanceOf(Date);
  });

  it("rejeita SP sem consumir a sequence oficial", async () => {
    const semNumero = await service.criar(dados(1, true), identidade);

    await expect(
      service.substituirNumero(
        semNumero.id,
        { numeroPatrimonioAtual: "1" },
        identidade,
      ),
    ).rejects.toMatchObject({
      response: expect.objectContaining({
        codigo: "TIPO_NUMERO_PATRIMONIAL_NAO_ELEGIVEL",
      }),
    });

    const oficial = await service.criar(dados(2), identidade);
    expect(oficial.numeroPatrimonio).toBe("1");
    expect(await database.substituicaoNumeroPatrimonial.count()).toBe(0);
  });

  it("permite exatamente uma substituição sob concorrência", async () => {
    const criado = await service.criar(dados(1), identidade);

    const resultados = await Promise.allSettled([
      service.substituirNumero(
        criado.id,
        { numeroPatrimonioAtual: "1" },
        identidade,
      ),
      service.substituirNumero(
        criado.id,
        { numeroPatrimonioAtual: "1" },
        identidade,
      ),
    ]);

    expect(
      resultados.filter(({ status }) => status === "fulfilled"),
    ).toHaveLength(1);
    const rejeitado = resultados.find(({ status }) => status === "rejected");
    expect(rejeitado).toMatchObject({
      status: "rejected",
      reason: {
        response: expect.objectContaining({
          codigo: "NUMERO_PATRIMONIAL_ATUAL_DIVERGENTE",
        }),
      },
    });
    expect(
      await database.substituicaoNumeroPatrimonial.count({
        where: { patrimonioId: criado.id },
      }),
    ).toBe(1);
  });

  it("reverte a troca quando o histórico falha e mantém a lacuna da sequence", async () => {
    const criado = await service.criar(dados(1), identidade);

    await expect(
      service.substituirNumero(
        criado.id,
        { numeroPatrimonioAtual: "1" },
        { ...identidade, id: "11111111-1111-4111-8111-111111111111" },
      ),
    ).rejects.toBeDefined();

    const preservado = await database.patrimonio.findUniqueOrThrow({
      where: { id: criado.id },
      select: { numeroPatrimonio: true },
    });
    expect(preservado.numeroPatrimonio).toBe("1");
    expect(await database.substituicaoNumeroPatrimonial.count()).toBe(0);

    const seguinte = await service.criar(dados(2), identidade);
    expect(seguinte.numeroPatrimonio).toBe("3");
  });

  it("lista volume representativo com filtros combinados e paginação estável", async () => {
    const totalPatrimonios = 240;
    const createdAt = new Date("2026-10-18T12:00:00.000Z");
    await database.patrimonio.createMany({
      data: Array.from({ length: totalPatrimonios }, (_, indice) => ({
        numeroPatrimonio:
          indice % 2 === 0 ? String(indice + 1_000) : `SP-${indice + 1_000}`,
        tipoNumeroPatrimonial:
          indice % 2 === 0 ? "OFICIAL" : "SEM_NUMERO_OFICIAL",
        descricao: `CAMERA LOTE ${indice}`,
        marca: "MARCA",
        modelo: `MODELO ${indice % 3}`,
        numeroSerie: `SERIE-VOLUME-${indice}`,
        textoBusca: `CAMERA LOTE ${indice} MARCA MODELO ${indice % 3} SERIE-VOLUME-${indice}`,
        tipoIncorporacao: "AQUISICAO",
        dataTombamento: new Date("2026-10-18T00:00:00.000Z"),
        valorIncorporacao: "1000",
        status: indice % 4 === 0 ? "ATIVO" : "EM_MANUTENCAO",
        especieId,
        setorAtualId: setorId,
        createdById: identidade.id,
        createdAt,
      })),
    });

    const primeiraPagina = await service.listar({
      pagina: 1,
      limite: 20,
      status: "ATIVO",
      setorId,
      especieId,
      naturezaId,
      tipoNumeroPatrimonial: "OFICIAL",
    });
    const segundaPagina = await service.listar({
      pagina: 2,
      limite: 20,
      status: "ATIVO",
      setorId,
      especieId,
      naturezaId,
      tipoNumeroPatrimonial: "OFICIAL",
    });

    expect(primeiraPagina.total).toBe(60);
    expect(primeiraPagina.ultimaPagina).toBe(3);
    expect(primeiraPagina.items).toHaveLength(20);
    expect(segundaPagina.items).toHaveLength(20);
    expect(
      new Set(
        [...primeiraPagina.items, ...segundaPagina.items].map(({ id }) => id),
      ).size,
    ).toBe(40);
    expect(primeiraPagina.items.map(({ id }) => id)).toEqual(
      [...primeiraPagina.items.map(({ id }) => id)].sort((primeiro, segundo) =>
        segundo.localeCompare(primeiro),
      ),
    );

    const busca = await service.listar({
      pagina: 1,
      limite: 20,
      busca: "câmera lote 12 marca",
    });
    expect(busca.total).toBe(1);
    expect(busca.items[0]?.descricao).toBe("CAMERA LOTE 12");

    const buscaNumero = await service.listar({
      pagina: 1,
      limite: 20,
      busca: "001012",
    });
    expect(
      buscaNumero.items.some(
        ({ numeroPatrimonio }) => numeroPatrimonio === "1012",
      ),
    ).toBe(true);
  });

  it("executa e observa o plano da query crítica sobre a massa representativa", async () => {
    await database.patrimonio.createMany({
      data: Array.from({ length: 240 }, (_, indice) => ({
        numeroPatrimonio: String(indice + 2_000),
        tipoNumeroPatrimonial: "OFICIAL",
        descricao: `ITEM DE PLANO ${indice}`,
        textoBusca: `ITEM DE PLANO ${indice}`,
        tipoIncorporacao: "AQUISICAO",
        dataTombamento: new Date("2026-10-18T00:00:00.000Z"),
        valorIncorporacao: "1000",
        status: indice % 2 === 0 ? "ATIVO" : "EM_MANUTENCAO",
        especieId,
        setorAtualId: setorId,
        createdById: identidade.id,
      })),
    });
    await database.$executeRawUnsafe('ANALYZE "patrimonios"');

    const plano = await database.$queryRaw<readonly unknown[]>`
      EXPLAIN (ANALYZE, FORMAT JSON)
      SELECT "id"
      FROM "patrimonios"
      WHERE "status" = 'ATIVO'::"StatusPatrimonio"
        AND "setor_atual_id" = ${setorId}::uuid
        AND "tipo_numero_patrimonial" = 'OFICIAL'::"TipoNumeroPatrimonial"
      ORDER BY "created_at" DESC, "id" DESC
      LIMIT 20
    `;

    expect(plano).toHaveLength(1);
    expect(plano[0]).toBeDefined();
  });
});
