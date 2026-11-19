import { DashboardOperacionalResponseSchema } from "@repo/contracts";
import { createDatabaseClient, type DatabaseClient } from "@repo/database";
import { DashboardRepository } from "../src/modules/dashboard/dashboard.repository";

const databaseUrl = process.env.DASHBOARD_INTEGRATION_DATABASE_URL;
const describeComPostgres = databaseUrl ? describe : describe.skip;

describeComPostgres("dashboard operacional no PostgreSQL", () => {
  let database: DatabaseClient;
  let repository: DashboardRepository;

  jest.setTimeout(60_000);

  beforeAll(async () => {
    const destino = new URL(databaseUrl!);
    if (
      destino.hostname !== "127.0.0.1" ||
      destino.pathname !== "/sipat_dashboard002_test"
    ) {
      throw new Error(
        "Use somente o banco descartável sipat_dashboard002_test em 127.0.0.1.",
      );
    }
    database = createDatabaseClient(databaseUrl!);
    await database.$connect();
    repository = new DashboardRepository(database);
  });

  afterAll(async () => database?.$disconnect());

  beforeEach(async () => {
    await database.$executeRawUnsafe('TRUNCATE TABLE "usuarios" CASCADE');
  });

  it("limita, ordena, exclui baixados dos setores e filtra atividades por autor", async () => {
    const [usuario, outroUsuario] = await Promise.all([
      database.usuario.create({
        data: {
          nome: "Diretor atual",
          email: "diretor-dashboard@example.com",
          senha: "hash-de-teste",
          perfil: "DIRETOR_PATRIMONIO",
        },
      }),
      database.usuario.create({
        data: {
          nome: "Outro diretor",
          email: "outro-dashboard@example.com",
          senha: "hash-de-teste",
          perfil: "DIRETOR_PATRIMONIO",
        },
      }),
    ]);
    const responsavel = await database.responsavel.create({
      data: {
        nome: "Responsável",
        matricula: "DASH-002",
        createdById: usuario.id,
      },
    });
    const natureza = await database.natureza.create({
      data: {
        nome: "Equipamentos de dashboard",
        nomeNormalizado: "equipamentos de dashboard",
        createdById: usuario.id,
      },
    });
    const especie = await database.especie.create({
      data: {
        nome: "Notebook dashboard",
        nomeNormalizado: "notebook dashboard",
        naturezaId: natureza.id,
        createdById: usuario.id,
      },
    });
    const setores = await Promise.all(
      Array.from({ length: 6 }, (_, indice) =>
        database.setor.create({
          data: {
            nome: `Setor ${String(indice + 1).padStart(2, "0")}`,
            responsavelId: responsavel.id,
            createdById: usuario.id,
          },
        }),
      ),
    );
    const criarPatrimonio = (dados: {
      numero: string;
      setorId: string;
      autorId: string;
      criadoEm: Date;
      status?: "ATIVO" | "BAIXADO";
    }) =>
      database.patrimonio.create({
        data: {
          numeroPatrimonio: dados.numero,
          tipoNumeroPatrimonial: "OFICIAL",
          descricao: `PATRIMONIO ${dados.numero}`,
          dataTombamento: new Date("2026-01-01T00:00:00.000Z"),
          valorIncorporacao: "1000",
          status: dados.status ?? "ATIVO",
          depreciavel: false,
          especieId: especie.id,
          setorAtualId: dados.setorId,
          createdById: dados.autorId,
          createdAt: dados.criadoEm,
          situacaoContabil: {
            create: {
              valorBrutoAtual: "1000",
              depreciacaoAcumuladaAtual: "0",
            },
          },
        },
      });

    for (let indice = 0; indice < setores.length; indice += 1) {
      for (let quantidade = 0; quantidade <= indice; quantidade += 1) {
        await criarPatrimonio({
          numero: `${indice + 1}${quantidade}`,
          setorId: setores[indice]!.id,
          autorId: outroUsuario.id,
          criadoEm: new Date(
            `2026-10-${String(indice + 1).padStart(2, "0")}T12:00:00.000Z`,
          ),
        });
      }
    }
    await criarPatrimonio({
      numero: "999",
      setorId: setores[0]!.id,
      autorId: usuario.id,
      criadoEm: new Date("2026-11-10T12:00:00.000Z"),
    });
    await criarPatrimonio({
      numero: "1000",
      setorId: setores[5]!.id,
      autorId: outroUsuario.id,
      criadoEm: new Date("2026-11-11T12:00:00.000Z"),
      status: "BAIXADO",
    });

    const dados = await repository.consultar(usuario.id, "2026-11-03");
    const validada = DashboardOperacionalResponseSchema.parse({
      status: 200,
      sucesso: true,
      mensagem: "Dashboard operacional consultado.",
      dados,
    }).dados;

    expect(validada.setores).toHaveLength(5);
    expect(validada.setores.map((setor) => setor.nome)).toEqual([
      "Setor 06",
      "Setor 05",
      "Setor 04",
      "Setor 03",
      "Setor 01",
    ]);
    expect(validada.setores[0]?.total).toBe(6);
    expect(validada.atividades).toHaveLength(1);
    expect(validada.atividades[0]).toMatchObject({
      numeroPatrimonio: "999",
      tipo: "CADASTRO",
    });
    expect(validada.totais.total).toBe(23);
  });
});
