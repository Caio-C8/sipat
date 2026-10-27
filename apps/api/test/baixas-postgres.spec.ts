import type { IdentidadeAutenticada } from "@repo/contracts";
import { createDatabaseClient, type DatabaseClient } from "@repo/database";
import type { ArmazenamentoDocumentosPorta } from "../src/common/storage/armazenamento-documentos.port";
import type { CoordenadorDocumentosService } from "../src/common/storage/coordenador-documentos.service";
import { BaixasRepository } from "../src/modules/baixas/baixas.repository";
import { BaixasService } from "../src/modules/baixas/baixas.service";
import { ComissoesRepository } from "../src/modules/comissoes/comissoes.repository";
import { ComissoesService } from "../src/modules/comissoes/comissoes.service";
import { InventariosPolicyService } from "../src/modules/inventarios/inventarios-policy.service";
import { InventariosRepository } from "../src/modules/inventarios/inventarios.repository";

const databaseUrl = process.env.BAIXAS_INTEGRATION_DATABASE_URL;
const describeComPostgres = databaseUrl ? describe : describe.skip;

describeComPostgres("baixas patrimoniais no PostgreSQL", () => {
  let database: DatabaseClient;
  let service: BaixasService;
  let identidade: IdentidadeAutenticada;
  let patrimonioId: string;
  let comissaoId: string;
  let setorId: string;

  jest.setTimeout(60_000);

  beforeAll(async () => {
    if (!databaseUrl?.includes("/sipat_baixas001_test")) {
      throw new Error(
        "BAIXAS_INTEGRATION_DATABASE_URL deve apontar para sipat_baixas001_test.",
      );
    }
    database = createDatabaseClient(databaseUrl);
    await database.$connect();
    service = new BaixasService(
      new BaixasRepository(database),
      new ComissoesService(new ComissoesRepository(database)),
      new InventariosPolicyService(new InventariosRepository(database)),
      {} as CoordenadorDocumentosService,
      {} as ArmazenamentoDocumentosPorta,
    );
  });

  afterAll(async () => database?.$disconnect());

  beforeEach(async () => {
    await database.$executeRawUnsafe('TRUNCATE TABLE "usuarios" CASCADE');
    const usuario = await database.usuario.create({
      data: {
        nome: "Diretor de patrimônio",
        email: "diretor-baixas@example.com",
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
        matricula: "BAIXAS-001",
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
    const comissao = await database.comissao.create({
      data: {
        nome: "Comissão de baixa",
        dataVigenciaInicio: new Date("2026-01-01T00:00:00.000Z"),
        dataVigenciaFim: new Date("2026-12-31T00:00:00.000Z"),
        createdById: usuario.id,
      },
    });
    comissaoId = comissao.id;
    const patrimonio = await database.patrimonio.create({
      data: {
        numeroPatrimonio: "BAIXA-001",
        tipoNumeroPatrimonial: "OFICIAL",
        descricao: "Notebook ativo",
        dataTombamento: new Date("2026-01-01T00:00:00.000Z"),
        valorIncorporacao: 1000,
        status: "ATIVO",
        especieId: especie.id,
        setorAtualId: setor.id,
        createdById: usuario.id,
      },
    });
    patrimonioId = patrimonio.id;
  });

  const body = () => ({
    dados: JSON.stringify({
      dataBaixa: "2026-10-27",
      tipo: "ALIENACAO",
      motivo: "Alienado por processo administrativo",
      comissaoId,
    }),
  });

  it("serializa duas baixas concorrentes e mantém um único estado final", async () => {
    const resultados = await Promise.allSettled([
      service.criar(patrimonioId, body(), undefined, identidade),
      service.criar(patrimonioId, body(), undefined, identidade),
    ]);

    expect(
      resultados.filter(({ status }) => status === "fulfilled"),
    ).toHaveLength(1);
    const rejeitada = resultados.find(({ status }) => status === "rejected");
    expect(rejeitada).toMatchObject({
      status: "rejected",
      reason: { response: { codigo: "BAIXA_JA_EXISTENTE" } },
    });
    await expect(
      database.baixaPatrimonio.count({ where: { patrimonioId } }),
    ).resolves.toBe(1);
    await expect(
      database.patrimonio.findUniqueOrThrow({
        where: { id: patrimonioId },
        select: { status: true },
      }),
    ).resolves.toEqual({ status: "BAIXADO" });
  });

  it("bloqueia inventário aberto na policy e no trigger PostgreSQL", async () => {
    const inventario = await database.inventario.create({
      data: {
        nome: "Inventário aberto",
        status: "PENDENTE",
        comissaoId,
        createdById: identidade.id,
      },
    });
    const setorInventario = await database.setorInventario.create({
      data: { inventarioId: inventario.id, setorId },
    });
    await database.itemInventario.create({
      data: {
        inventarioId: inventario.id,
        setorInventarioId: setorInventario.id,
        setorEsperadoId: setorId,
        patrimonioId,
      },
    });

    await expect(
      service.criar(patrimonioId, body(), undefined, identidade),
    ).rejects.toMatchObject({
      response: { codigo: "PATRIMONIO_EM_INVENTARIO_ABERTO" },
    });
    await expect(
      database.baixaPatrimonio.create({
        data: {
          patrimonioId,
          comissaoId,
          createdById: identidade.id,
          dataBaixa: new Date("2026-10-27T00:00:00.000Z"),
          tipo: "ALIENACAO",
          motivo: "Tentativa direta",
        },
      }),
    ).rejects.toThrow();
    await expect(
      database.patrimonio.findUniqueOrThrow({
        where: { id: patrimonioId },
        select: { status: true },
      }),
    ).resolves.toEqual({ status: "ATIVO" });
  });

  it("mantém o trigger como defesa quando o inventário nasce após a policy", async () => {
    let liberarInventario!: () => void;
    let confirmarLock!: () => void;
    const lockAdquirido = new Promise<void>((resolve) => {
      confirmarLock = resolve;
    });
    const inventarioComLock = database.$transaction(async (transaction) => {
      await transaction.$queryRaw`
        SELECT "id" FROM "patrimonios"
        WHERE "id" = ${patrimonioId}::uuid
        FOR SHARE
      `;
      const inventario = await transaction.inventario.create({
        data: {
          nome: "Inventário concorrente",
          status: "PENDENTE",
          comissaoId,
          createdById: identidade.id,
        },
      });
      const setorInventario = await transaction.setorInventario.create({
        data: { inventarioId: inventario.id, setorId },
      });
      await transaction.itemInventario.create({
        data: {
          inventarioId: inventario.id,
          setorInventarioId: setorInventario.id,
          setorEsperadoId: setorId,
          patrimonioId,
        },
      });
      confirmarLock();
      await new Promise<void>((resolve) => {
        liberarInventario = resolve;
      });
    });
    await lockAdquirido;

    const baixaConcorrente = service.criar(
      patrimonioId,
      body(),
      undefined,
      identidade,
    );
    await new Promise((resolve) => setTimeout(resolve, 50));
    liberarInventario();
    await inventarioComLock;

    await expect(baixaConcorrente).rejects.toMatchObject({
      response: { codigo: "PATRIMONIO_EM_INVENTARIO_ABERTO" },
    });
    await expect(
      database.baixaPatrimonio.count({ where: { patrimonioId } }),
    ).resolves.toBe(0);
    await expect(
      database.patrimonio.findUniqueOrThrow({
        where: { id: patrimonioId },
        select: { status: true },
      }),
    ).resolves.toEqual({ status: "ATIVO" });
  });
});
