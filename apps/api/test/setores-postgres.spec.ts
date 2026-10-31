import type {
  CriarPatrimonioBodyData,
  IdentidadeAutenticada,
} from "@repo/contracts";
import { createDatabaseClient, type DatabaseClient } from "@repo/database";
import { PatrimoniosRepository } from "../src/modules/patrimonios/patrimonios.repository";
import { PatrimoniosService } from "../src/modules/patrimonios/patrimonios.service";
import { ResponsaveisRepository } from "../src/modules/responsaveis/responsaveis.repository";
import { ResponsaveisService } from "../src/modules/responsaveis/responsaveis.service";
import { SetoresRepository } from "../src/modules/setores/setores.repository";
import { SetoresService } from "../src/modules/setores/setores.service";
import { InventariosPolicyService } from "../src/modules/inventarios/inventarios-policy.service";
import { InventariosRepository } from "../src/modules/inventarios/inventarios.repository";

const databaseUrl = process.env.SETORES_INTEGRATION_DATABASE_URL;
const describeComPostgres = databaseUrl ? describe : describe.skip;

describeComPostgres("setores no PostgreSQL", () => {
  let database: DatabaseClient;
  let setores: SetoresService;
  let patrimonios: PatrimoniosService;
  let identidade: IdentidadeAutenticada;
  let responsavelAtivoId: string;
  let responsavelInativoId: string;
  let especieId: string;

  jest.setTimeout(60_000);

  beforeAll(async () => {
    if (!databaseUrl?.includes("/sipat_setores001_test")) {
      throw new Error(
        "SETORES_INTEGRATION_DATABASE_URL deve apontar para sipat_setores001_test.",
      );
    }

    database = createDatabaseClient(databaseUrl);
    await database.$connect();
    const responsaveis = new ResponsaveisService(
      new ResponsaveisRepository(database),
    );
    setores = new SetoresService(
      new SetoresRepository(database),
      responsaveis,
      new InventariosPolicyService(new InventariosRepository(database)),
    );
    patrimonios = new PatrimoniosService(new PatrimoniosRepository(database));
  });

  afterAll(async () => database?.$disconnect());

  beforeEach(async () => {
    await database.$executeRawUnsafe('TRUNCATE TABLE "usuarios" CASCADE');
    await database.$executeRawUnsafe(
      'ALTER SEQUENCE "patrimonios_numero_oficial_seq" RESTART WITH 1',
    );

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
    const [responsavelAtivo, responsavelInativo] = await Promise.all([
      database.responsavel.create({
        data: {
          nome: "Responsável ativo",
          matricula: "MAT-ATIVO",
          createdById: administrador.id,
        },
      }),
      database.responsavel.create({
        data: {
          nome: "Responsável inativo",
          matricula: "MAT-INATIVO",
          ativo: false,
          createdById: administrador.id,
        },
      }),
    ]);
    responsavelAtivoId = responsavelAtivo.id;
    responsavelInativoId = responsavelInativo.id;

    const natureza = await database.natureza.create({
      data: {
        nome: "Equipamentos",
        nomeNormalizado: "EQUIPAMENTOS",
        createdById: administrador.id,
      },
    });
    const especie = await database.especie.create({
      data: {
        nome: "Câmera",
        nomeNormalizado: "CAMERA",
        naturezaId: natureza.id,
        createdById: administrador.id,
      },
    });
    especieId = especie.id;
  });

  function dadosPatrimonio(setorAtualId: string): CriarPatrimonioBodyData {
    return {
      semNumeroOficial: false,
      dataTombamento: "2026-10-19",
      tipoIncorporacao: "AQUISICAO",
      descricao: "Câmera de integração",
      numeroSerie: "SERIE-SETORES-001",
      valorIncorporacao: "1000",
      especieId,
      setorAtualId,
      parametrosDepreciacao: {
        metodo: "LINEAR",
        vidaUtilInicialMeses: 60,
        percentualResidual: "10",
        valorResidual: "100",
        valorBaseInicial: "1000",
        dataInicio: "2026-10-19",
      },
    };
  }

  it("exige responsável ativo na criação e na troca", async () => {
    await expect(
      setores.criar(
        { nome: "Arquivo", responsavelId: responsavelInativoId },
        identidade,
      ),
    ).rejects.toMatchObject({
      response: { codigo: "RESPONSAVEL_INATIVO" },
    });

    const setor = await setores.criar(
      { nome: "Almoxarifado", responsavelId: responsavelAtivoId },
      identidade,
    );
    await expect(
      setores.alterar(setor.id, { responsavelId: responsavelInativoId }),
    ).rejects.toMatchObject({
      response: { codigo: "RESPONSAVEL_INATIVO" },
    });
    await expect(setores.consultar(setor.id)).resolves.toMatchObject({
      responsavel: { id: responsavelAtivoId },
    });

    await database.responsavel.update({
      where: { id: responsavelInativoId },
      data: { ativo: true },
    });
    await expect(
      setores.alterar(setor.id, { responsavelId: responsavelInativoId }),
    ).resolves.toMatchObject({
      responsavel: { id: responsavelInativoId, ativo: true },
      updatedAt: expect.any(Date),
    });
  });

  it("inativa sem apagar patrimônio e impede novos vínculos", async () => {
    const setor = await setores.criar(
      { nome: "Almoxarifado", responsavelId: responsavelAtivoId },
      identidade,
    );
    const patrimonio = await patrimonios.criar(
      dadosPatrimonio(setor.id),
      identidade,
    );

    await setores.alterarSituacao(setor.id, { ativo: false });

    await expect(
      database.patrimonio.findUniqueOrThrow({ where: { id: patrimonio.id } }),
    ).resolves.toMatchObject({ setorAtualId: setor.id });
    await expect(
      patrimonios.criar(
        { ...dadosPatrimonio(setor.id), numeroSerie: "SERIE-NOVA" },
        identidade,
      ),
    ).rejects.toMatchObject({ response: { codigo: "SETOR_INATIVO" } });
    expect(await database.setor.count()).toBe(1);
  });

  it("serializa criação patrimonial concorrente com a inativação", async () => {
    const setor = await setores.criar(
      { nome: "Almoxarifado", responsavelId: responsavelAtivoId },
      identidade,
    );
    const resultados = await Promise.allSettled([
      patrimonios.criar(dadosPatrimonio(setor.id), identidade),
      setores.alterarSituacao(setor.id, { ativo: false }),
    ]);

    expect(resultados[1]).toMatchObject({ status: "fulfilled" });
    if (resultados[0]?.status === "rejected") {
      expect(
        (resultados[0].reason as { response?: { codigo?: string } }).response
          ?.codigo,
      ).toBe("SETOR_INATIVO");
    }
    await expect(setores.consultar(setor.id)).resolves.toMatchObject({
      ativo: false,
    });
    expect(await database.patrimonio.count()).toBeLessThanOrEqual(1);
  });
});
