import type { IdentidadeAutenticada } from "@repo/contracts";
import {
  createDatabaseClient,
  Prisma,
  type DatabaseClient,
} from "@repo/database";
import { ComissoesRepository } from "../src/modules/comissoes/comissoes.repository";
import { ComissoesService } from "../src/modules/comissoes/comissoes.service";
import { DepreciacoesRepository } from "../src/modules/depreciacoes/depreciacoes.repository";
import { DepreciacoesService } from "../src/modules/depreciacoes/depreciacoes.service";

const databaseUrl = process.env.DEPRECIACOES_INTEGRATION_DATABASE_URL;
const describeComPostgres = databaseUrl ? describe : describe.skip;

describeComPostgres("depreciações patrimoniais no PostgreSQL", () => {
  let database: DatabaseClient;
  let service: DepreciacoesService;
  let identidade: IdentidadeAutenticada;
  let comissaoId: string;
  let especieId: string;
  let setorId: string;

  jest.setTimeout(60_000);

  const agora = new Date();
  const competencia = `${agora.getFullYear().toString().padStart(4, "0")}-${(
    agora.getMonth() + 1
  )
    .toString()
    .padStart(2, "0")}`;
  const inicioCompetencia = new Date(
    Date.UTC(agora.getFullYear(), agora.getMonth(), 1),
  );
  const inicioAnterior = new Date(
    Date.UTC(agora.getFullYear(), agora.getMonth() - 1, 1),
  );

  beforeAll(async () => {
    if (!databaseUrl?.includes("/sipat_depreciacoes001_test")) {
      throw new Error(
        "DEPRECIACOES_INTEGRATION_DATABASE_URL deve apontar para sipat_depreciacoes001_test.",
      );
    }
    database = createDatabaseClient(databaseUrl);
    await database.$connect();
    service = new DepreciacoesService(
      new DepreciacoesRepository(database),
      new ComissoesService(new ComissoesRepository(database)),
    );
  });

  afterAll(async () => database?.$disconnect());

  beforeEach(async () => {
    await database.$executeRawUnsafe('TRUNCATE TABLE "usuarios" CASCADE');
    const usuario = await database.usuario.create({
      data: {
        nome: "Diretor de patrimônio",
        email: "diretor-depreciacoes@example.com",
        senha: "hash-de-integracao",
        perfil: "DIRETOR_PATRIMONIO",
      },
    });
    identidade = {
      id: usuario.id,
      nome: usuario.nome,
      email: usuario.email,
      perfil: usuario.perfil,
      trocaSenhaObrigatoria: false,
    };
    const responsavel = await database.responsavel.create({
      data: {
        nome: "Responsável",
        matricula: "DEPRECIACOES-001",
        createdById: usuario.id,
      },
    });
    const setor = await database.setor.create({
      data: {
        nome: "Almoxarifado",
        responsavelId: responsavel.id,
        createdById: usuario.id,
      },
    });
    setorId = setor.id;
    const natureza = await database.natureza.create({
      data: {
        nome: "Equipamentos",
        nomeNormalizado: "equipamentos",
        createdById: usuario.id,
      },
    });
    const especie = await database.especie.create({
      data: {
        nome: "Notebook",
        nomeNormalizado: "notebook",
        naturezaId: natureza.id,
        createdById: usuario.id,
      },
    });
    especieId = especie.id;
    const comissao = await database.comissao.create({
      data: {
        nome: "Comissão de depreciação",
        dataVigenciaInicio: new Date(Date.UTC(agora.getFullYear() - 1, 0, 1)),
        dataVigenciaFim: new Date(Date.UTC(agora.getFullYear() + 1, 11, 31)),
        createdById: usuario.id,
      },
    });
    comissaoId = comissao.id;
  });

  async function criarPatrimonio(
    numero: string,
    opcoes: {
      status?: "ATIVO" | "EMPRESTADO" | "EM_MANUTENCAO" | "BAIXADO";
      bruto?: string;
      acumulada?: string;
      residual?: string;
      vida?: number;
      dataInicio?: Date;
      comParametro?: boolean;
    } = {},
  ) {
    return database.patrimonio.create({
      data: {
        numeroPatrimonio: numero,
        tipoNumeroPatrimonial: "OFICIAL",
        descricao: `Bem ${numero}`,
        dataTombamento: inicioAnterior,
        valorIncorporacao: opcoes.bruto ?? "1000",
        status: opcoes.status ?? "ATIVO",
        especieId,
        setorAtualId: setorId,
        createdById: identidade.id,
        situacaoContabil: {
          create: {
            valorBrutoAtual: opcoes.bruto ?? "1000",
            depreciacaoAcumuladaAtual: opcoes.acumulada ?? "0",
          },
        },
        parametrosDepreciacao:
          opcoes.comParametro === false
            ? undefined
            : {
                create: {
                  metodo: "LINEAR",
                  vidaUtilInicialMeses: opcoes.vida ?? 10,
                  valorResidual: opcoes.residual ?? "100",
                  valorBaseInicial: opcoes.bruto ?? "1000",
                  dataInicio: opcoes.dataInicio ?? inicioAnterior,
                },
              },
      },
      include: { situacaoContabil: true, parametrosDepreciacao: true },
    });
  }

  const body = (confirmarIgnorarValorResidual = true) => ({
    competencia,
    comissaoId,
    confirmarIgnorarValorResidual,
  });

  it("atualiza situação e cria histórico atomicamente sem atravessar o residual", async () => {
    const patrimonio = await criarPatrimonio("1", {
      bruto: "1",
      acumulada: "0.6666666",
      residual: "0",
      vida: 1,
    });

    const resultado = await service.executarIndividual(
      patrimonio.id,
      body(),
      identidade,
    );

    expect(resultado).toMatchObject({
      resultado: "DEPRECIADO",
      valorDepreciado: "0.3333334",
      valorContabilNovo: "0",
    });
    await expect(
      database.situacaoContabilPatrimonio.findUniqueOrThrow({
        where: { patrimonioId: patrimonio.id },
        select: { depreciacaoAcumuladaAtual: true },
      }),
    ).resolves.toMatchObject({ depreciacaoAcumuladaAtual: expect.anything() });
    const situacao =
      await database.situacaoContabilPatrimonio.findUniqueOrThrow({
        where: { patrimonioId: patrimonio.id },
      });
    expect(situacao.depreciacaoAcumuladaAtual.toString()).toBe("1");
    await expect(
      database.depreciacaoPatrimonio.count({
        where: { patrimonioId: patrimonio.id },
      }),
    ).resolves.toBe(1);
  });

  it("serializa execução individual concorrente sem duplicar competência", async () => {
    const patrimonio = await criarPatrimonio("2");
    const resultados = await Promise.allSettled([
      service.executarIndividual(patrimonio.id, body(), identidade),
      service.executarIndividual(patrimonio.id, body(), identidade),
    ]);

    const depreciados = resultados.filter(
      (item) =>
        item.status === "fulfilled" && item.value.resultado === "DEPRECIADO",
    );
    expect(depreciados).toHaveLength(1);
    await expect(
      database.depreciacaoPatrimonio.count({
        where: {
          patrimonioId: patrimonio.id,
          dataCompetencia: inicioCompetencia,
        },
      }),
    ).resolves.toBe(1);
  });

  it("serializa execução individual contra execução em massa", async () => {
    const patrimonio = await criarPatrimonio("20");
    const resultados = await Promise.allSettled([
      service.executarIndividual(patrimonio.id, body(), identidade),
      service.executarEmMassa(body(), identidade),
    ]);

    expect(resultados.some((item) => item.status === "fulfilled")).toBe(true);
    await expect(
      database.depreciacaoPatrimonio.count({
        where: {
          patrimonioId: patrimonio.id,
          dataCompetencia: inicioCompetencia,
        },
      }),
    ).resolves.toBe(1);
  });

  it("a migration impede dois parâmetros vigentes para o mesmo patrimônio", async () => {
    const patrimonio = await criarPatrimonio("3");

    await expect(
      database.parametroDepreciacao.create({
        data: {
          metodo: "LINEAR",
          vidaUtilInicialMeses: 20,
          valorResidual: "50",
          valorBaseInicial: "1000",
          dataInicio: inicioAnterior,
          patrimonioId: patrimonio.id,
        },
      }),
    ).rejects.toThrow();
  });

  it("faz rollback das situações e históricos quando uma inserção do lote falha", async () => {
    const primeiro = await criarPatrimonio("4");
    await criarPatrimonio("5");
    await database.$executeRawUnsafe(`
      CREATE OR REPLACE FUNCTION depreciacoes001_falha_teste() RETURNS trigger AS $$
      BEGIN
        IF NEW.valor_contabil_anterior = 1000 THEN
          RAISE EXCEPTION 'falha induzida';
        END IF;
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
      CREATE TRIGGER depreciacoes001_falha_teste
      BEFORE INSERT ON depreciacoes_patrimoniais
      FOR EACH ROW EXECUTE FUNCTION depreciacoes001_falha_teste();
    `);
    try {
      await expect(service.executarEmMassa(body(), identidade)).rejects.toThrow(
        "falha induzida",
      );
      await expect(database.depreciacaoPatrimonio.count()).resolves.toBe(0);
      const situacao =
        await database.situacaoContabilPatrimonio.findUniqueOrThrow({
          where: { patrimonioId: primeiro.id },
        });
      expect(situacao.depreciacaoAcumuladaAtual.toString()).toBe("0");
    } finally {
      await database.$executeRawUnsafe(`
        DROP TRIGGER IF EXISTS depreciacoes001_falha_teste ON depreciacoes_patrimoniais;
        DROP FUNCTION IF EXISTS depreciacoes001_falha_teste();
      `);
    }
  });

  it("lista em lote os três status depreciáveis e exclui início no mês corrente", async () => {
    await criarPatrimonio("10", { status: "ATIVO" });
    await criarPatrimonio("11", { status: "EMPRESTADO" });
    await criarPatrimonio("12", { status: "EM_MANUTENCAO" });
    await criarPatrimonio("13", { status: "BAIXADO" });
    await criarPatrimonio("14", { dataInicio: inicioCompetencia });

    const resultado = await service.listarPendentes({
      competencia,
      pagina: 1,
      limite: 20,
    });

    expect(resultado.total).toBe(3);
    expect(resultado.items.map((item) => item.linha.status).sort()).toEqual([
      "ATIVO",
      "EMPRESTADO",
      "EM_MANUTENCAO",
    ]);
  });

  it("pagina e inspeciona o plano da consulta com volume representativo", async () => {
    const quantidade = 300;
    await database.$executeRaw`
      INSERT INTO "patrimonios" (
        "id", "numero_patrimonio", "tipo_numero_patrimonial", "descricao",
        "data_tombamento", "valor_incorporacao", "status", "especie_id",
        "setor_atual_id", "created_by_id"
      )
      SELECT gen_random_uuid(), (10000 + g)::text, 'OFICIAL'::"TipoNumeroPatrimonial",
             'Carga depreciação ' || g, ${inicioAnterior}::date, 1000,
             'ATIVO'::"StatusPatrimonio", ${especieId}::uuid, ${setorId}::uuid,
             ${identidade.id}::uuid
      FROM generate_series(1, ${quantidade}) g
    `;
    await database.$executeRaw`
      INSERT INTO "situacoes_contabeis_patrimoniais" (
        "id", "valor_bruto_atual", "depreciacao_acumulada_atual", "patrimonio_id"
      )
      SELECT gen_random_uuid(), 1000, 0, p."id" FROM "patrimonios" p
      WHERE p."descricao" LIKE 'Carga depreciação %'
    `;
    await database.$executeRaw`
      INSERT INTO "parametros_depreciacao" (
        "id", "metodo", "vida_util_inicial_meses", "valor_residual",
        "valor_base_inicial", "data_inicio", "patrimonio_id"
      )
      SELECT gen_random_uuid(), 'LINEAR'::"MetodoDepreciacao", 120, 100, 1000,
             ${inicioAnterior}::date, p."id" FROM "patrimonios" p
      WHERE p."descricao" LIKE 'Carga depreciação %'
    `;

    const pagina = await service.listarPendentes({
      competencia,
      pagina: 2,
      limite: 50,
    });
    const plano = await database.$queryRaw<{ "QUERY PLAN": unknown }[]>(
      Prisma.sql`
        EXPLAIN (ANALYZE, FORMAT JSON)
        SELECT p."id"
        FROM "patrimonios" p
        JOIN "situacoes_contabeis_patrimoniais" sc ON sc."patrimonio_id" = p."id"
        JOIN "parametros_depreciacao" pd
          ON pd."patrimonio_id" = p."id" AND pd."data_fim" IS NULL
        WHERE p."status" IN ('ATIVO', 'EMPRESTADO', 'EM_MANUTENCAO')
          AND pd."data_inicio" < ${inicioCompetencia}::date
          AND sc."valor_bruto_atual" - sc."depreciacao_acumulada_atual" > pd."valor_residual"
          AND NOT EXISTS (
            SELECT 1 FROM "depreciacoes_patrimoniais" d
            WHERE d."patrimonio_id" = p."id"
              AND d."parametro_depreciacao_id" = pd."id"
              AND d."data_competencia" = ${inicioCompetencia}::date
          )
        ORDER BY p."numero_patrimonio", p."id"
        LIMIT 50 OFFSET 50
      `,
    );

    expect(pagina.total).toBe(quantidade);
    expect(pagina.items).toHaveLength(50);
    expect(plano[0]?.["QUERY PLAN"]).toBeDefined();
  });
});
