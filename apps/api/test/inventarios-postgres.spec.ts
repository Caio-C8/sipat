import type { IdentidadeAutenticada } from "@repo/contracts";
import { createDatabaseClient, type DatabaseClient } from "@repo/database";
import { ComissoesRepository } from "../src/modules/comissoes/comissoes.repository";
import { ComissoesService } from "../src/modules/comissoes/comissoes.service";
import { InventariosRepository } from "../src/modules/inventarios/inventarios.repository";
import { InventariosService } from "../src/modules/inventarios/inventarios.service";

const databaseUrl = process.env.INVENTARIOS_INTEGRATION_DATABASE_URL;
const describeComPostgres = databaseUrl ? describe : describe.skip;

describeComPostgres("inventários no PostgreSQL", () => {
  let database: DatabaseClient;
  let service: InventariosService;
  let identidade: IdentidadeAutenticada;
  let comissaoId: string;
  let setorAtivoId: string;
  let setorInativoId: string;

  jest.setTimeout(60_000);

  beforeAll(async () => {
    if (!databaseUrl?.includes("/sipat_inventarios001_test")) {
      throw new Error(
        "INVENTARIOS_INTEGRATION_DATABASE_URL deve apontar para sipat_inventarios001_test.",
      );
    }
    database = createDatabaseClient(databaseUrl);
    await database.$connect();
    service = new InventariosService(
      new InventariosRepository(database),
      new ComissoesService(new ComissoesRepository(database)),
    );
  });

  afterAll(async () => database?.$disconnect());

  beforeEach(async () => {
    await database.$executeRawUnsafe('TRUNCATE TABLE "usuarios" CASCADE');
    const usuario = await database.usuario.create({
      data: {
        nome: "Diretor de patrimônio",
        email: "diretor-inventarios@example.com",
        senha: "hash-de-integracao",
        perfil: "DIRETOR_PATRIMONIO",
      },
    });
    identidade = {
      id: usuario.id,
      nome: usuario.nome,
      email: usuario.email,
      perfil: usuario.perfil,
    };
    const responsavel = await database.responsavel.create({
      data: {
        nome: "Responsável",
        matricula: "INV-001",
        createdById: usuario.id,
      },
    });
    const setores = await Promise.all([
      database.setor.create({
        data: {
          nome: "Almoxarifado",
          responsavelId: responsavel.id,
          createdById: usuario.id,
        },
      }),
      database.setor.create({
        data: {
          nome: "Setor ativo sem patrimônio",
          responsavelId: responsavel.id,
          createdById: usuario.id,
        },
      }),
      database.setor.create({
        data: {
          nome: "Arquivo inativo",
          ativo: false,
          responsavelId: responsavel.id,
          createdById: usuario.id,
        },
      }),
    ]);
    setorAtivoId = setores[0].id;
    setorInativoId = setores[2].id;
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
    await Promise.all([
      database.patrimonio.create({
        data: {
          numeroPatrimonio: "1001",
          tipoNumeroPatrimonial: "OFICIAL",
          descricao: "Notebook ativo",
          dataTombamento: new Date("2026-01-01T00:00:00.000Z"),
          valorIncorporacao: 1000,
          status: "ATIVO",
          especieId: especie.id,
          setorAtualId: setorAtivoId,
          createdById: usuario.id,
        },
      }),
      database.patrimonio.create({
        data: {
          numeroPatrimonio: "1002",
          tipoNumeroPatrimonial: "OFICIAL",
          descricao: "Notebook baixado",
          dataTombamento: new Date("2026-01-01T00:00:00.000Z"),
          valorIncorporacao: 500,
          status: "BAIXADO",
          especieId: especie.id,
          setorAtualId: setorAtivoId,
          createdById: usuario.id,
        },
      }),
    ]);
    const comissao = await database.comissao.create({
      data: {
        nome: "Comissão vigente",
        dataVigenciaInicio: new Date("2000-01-01T00:00:00.000Z"),
        dataVigenciaFim: new Date("2999-12-31T00:00:00.000Z"),
        createdById: usuario.id,
      },
    });
    comissaoId = comissao.id;
  });

  it("materializa somente setores ativos e patrimônios ATIVO", async () => {
    const inventario = await service.criar(
      { nome: "Inventário anual", comissaoId },
      identidade,
    );
    const setores = await database.setorInventario.findMany({
      where: { inventarioId: inventario.id },
    });
    const itens = await database.itemInventario.findMany({
      where: { inventarioId: inventario.id },
      include: { patrimonio: true },
    });

    expect(setores).toHaveLength(2);
    expect(setores).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          setorId: setorAtivoId,
          status: "PENDENTE",
          dataInicio: null,
          iniciadoPorId: null,
        }),
      ]),
    );
    expect(itens).toHaveLength(1);
    expect(itens[0]).toMatchObject({
      statusVerificacao: "PENDENTE",
      setorEsperadoId: setorAtivoId,
      situacao: null,
      dataVerificacao: null,
      patrimonio: { status: "ATIVO" },
    });
    expect(inventario.progresso).toMatchObject({
      totalSetores: 2,
      totalItens: 1,
      itensPendentes: 1,
    });
    const paginaSetores = await service.listarSetores(inventario.id, {
      pagina: 1,
      limite: 20,
    });
    expect(
      paginaSetores.items.find(
        ({ setor }) => setor.nome === "Setor ativo sem patrimônio",
      )?.progresso,
    ).toMatchObject({ totalItens: 0, itensPendentes: 0 });
  });

  it("desfaz toda a criação quando um patrimônio ativo aponta para setor inativo", async () => {
    await database.patrimonio.update({
      where: { numeroPatrimonio: "1001" },
      data: { setorAtualId: setorInativoId },
    });

    await expect(
      service.criar({ nome: "Inventário inválido", comissaoId }, identidade),
    ).rejects.toMatchObject({
      response: { codigo: "PATRIMONIO_ATIVO_EM_SETOR_INATIVO" },
    });
    expect(await database.inventario.count()).toBe(0);
    expect(await database.setorInventario.count()).toBe(0);
    expect(await database.itemInventario.count()).toBe(0);
  });

  it("mantém cada snapshot íntegro sob criações concorrentes", async () => {
    const resultados = await Promise.all([
      service.criar({ nome: "Inventário A", comissaoId }, identidade),
      service.criar({ nome: "Inventário B", comissaoId }, identidade),
    ]);

    expect(resultados).toHaveLength(2);
    for (const inventario of resultados) {
      expect(
        await database.setorInventario.count({
          where: { inventarioId: inventario.id },
        }),
      ).toBe(2);
      expect(
        await database.itemInventario.count({
          where: { inventarioId: inventario.id },
        }),
      ).toBe(1);
    }
  });

  it("impede dois setores em andamento no inventário e o mesmo setor físico em inventários distintos", async () => {
    const [inventarioA, inventarioB] = await Promise.all([
      service.criar({ nome: "Inventário A", comissaoId }, identidade),
      service.criar({ nome: "Inventário B", comissaoId }, identidade),
    ]);
    const setoresA = await database.setorInventario.findMany({
      where: { inventarioId: inventarioA.id },
      orderBy: { setorId: "asc" },
    });
    const [primeiroSetorA, segundoSetorA] = setoresA;
    if (primeiroSetorA === undefined || segundoSetorA === undefined) {
      throw new Error("O snapshot deveria possuir dois setores ativos.");
    }
    const setorMesmoFisicoB = await database.setorInventario.findFirstOrThrow({
      where: { inventarioId: inventarioB.id, setorId: primeiroSetorA.setorId },
    });
    const iniciar = {
      status: "EM_ANDAMENTO" as const,
      dataInicio: new Date(),
      iniciadoPorId: identidade.id,
    };

    await database.setorInventario.update({
      where: { id: primeiroSetorA.id },
      data: iniciar,
    });
    await expect(
      database.setorInventario.update({
        where: { id: segundoSetorA.id },
        data: iniciar,
      }),
    ).rejects.toMatchObject({ code: "P2002" });
    await expect(
      database.setorInventario.update({
        where: { id: setorMesmoFisicoB.id },
        data: iniciar,
      }),
    ).rejects.toMatchObject({ code: "P2002" });
  });

  it("impede justificar uma ausência com operação de outro patrimônio", async () => {
    const inventario = await service.criar(
      { nome: "Inventário com ausência", comissaoId },
      identidade,
    );
    const item = await database.itemInventario.findFirstOrThrow({
      where: { inventarioId: inventario.id },
    });
    const outroPatrimonio = await database.patrimonio.findUniqueOrThrow({
      where: { numeroPatrimonio: "1002" },
    });
    const emprestimoIncompativel = await database.emprestimoPatrimonio.create({
      data: {
        dataEmprestimo: new Date(),
        grupoEmprestimoId: "00000000-0000-4000-8000-000000000099",
        comissaoId,
        patrimonioId: outroPatrimonio.id,
        createdById: identidade.id,
      },
    });

    await expect(
      database.itemInventario.update({
        where: { id: item.id },
        data: {
          statusVerificacao: "VERIFICADO",
          situacao: "NAO_LOCALIZADO",
          dataVerificacao: new Date(),
          verificadoPorId: identidade.id,
          statusPatrimonioNaVerificacao: "EMPRESTADO",
          emprestimoPatrimonioId: emprestimoIncompativel.id,
        },
      }),
    ).rejects.toMatchObject({ code: "P2003" });
  });
});
