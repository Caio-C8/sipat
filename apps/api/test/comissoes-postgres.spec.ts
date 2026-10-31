import type { IdentidadeAutenticada } from "@repo/contracts";
import { createDatabaseClient, type DatabaseClient } from "@repo/database";
import { ComissoesRepository } from "../src/modules/comissoes/comissoes.repository";
import { ComissoesService } from "../src/modules/comissoes/comissoes.service";

const databaseUrl = process.env.COMISSOES_INTEGRATION_DATABASE_URL;
const describeComPostgres = databaseUrl ? describe : describe.skip;

describeComPostgres("comissões no PostgreSQL", () => {
  let database: DatabaseClient;
  let service: ComissoesService;
  let identidade: IdentidadeAutenticada;
  let responsavelUmId: string;
  let responsavelDoisId: string;
  let responsavelInativoId: string;

  jest.setTimeout(60_000);

  beforeAll(async () => {
    if (!databaseUrl?.includes("/sipat_comissoes001_test")) {
      throw new Error(
        "COMISSOES_INTEGRATION_DATABASE_URL deve apontar para sipat_comissoes001_test.",
      );
    }

    database = createDatabaseClient(databaseUrl);
    await database.$connect();
    service = new ComissoesService(new ComissoesRepository(database));
  });

  afterAll(async () => database?.$disconnect());

  beforeEach(async () => {
    await database.$executeRawUnsafe('TRUNCATE TABLE "usuarios" CASCADE');
    const usuario = await database.usuario.create({
      data: {
        nome: "Administrador",
        email: "admin-comissoes@example.com",
        senha: "hash-de-integracao",
        perfil: "ADMINISTRADOR",
      },
    });
    identidade = {
      id: usuario.id,
      nome: usuario.nome,
      email: usuario.email,
      perfil: usuario.perfil,
      trocaSenhaObrigatoria: false,
    };
    const responsaveis = await Promise.all([
      database.responsavel.create({
        data: {
          nome: "Responsável Um",
          matricula: "COM-001",
          createdById: usuario.id,
        },
      }),
      database.responsavel.create({
        data: {
          nome: "Responsável Dois",
          matricula: "COM-002",
          createdById: usuario.id,
        },
      }),
      database.responsavel.create({
        data: {
          nome: "Responsável Inativo",
          matricula: "COM-003",
          ativo: false,
          createdById: usuario.id,
        },
      }),
    ]);
    responsavelUmId = responsaveis[0].id;
    responsavelDoisId = responsaveis[1].id;
    responsavelInativoId = responsaveis[2].id;
  });

  function dadosCriacao() {
    return {
      chaveIdempotencia: randomUUID(),
      nome: "Comissão de inventário",
      numeroAto: "Portaria 10/2026",
      dataVigenciaInicio: "2026-01-01",
      dataVigenciaFim: "2026-12-31",
      membros: [] as Array<{
        responsavelId: string;
        papel: "PRESIDENTE" | "MEMBRO";
      }>,
    };
  }

  it("mantém a criação atômica quando um integrante não está ativo", async () => {
    const dados = dadosCriacao();
    dados.membros = [
      { responsavelId: responsavelUmId, papel: "MEMBRO" },
      { responsavelId: responsavelInativoId, papel: "MEMBRO" },
    ];

    await expect(service.criar(dados, identidade)).rejects.toMatchObject({
      response: { codigo: "RESPONSAVEL_INATIVO" },
    });
    expect(await database.comissao.count()).toBe(0);
    expect(await database.membroComissao.count()).toBe(0);
  });

  it("persiste no máximo um presidente sob requisições concorrentes", async () => {
    const comissao = await service.criar(dadosCriacao(), identidade);

    const resultados = await Promise.allSettled([
      service.adicionarMembro(comissao.id, {
        responsavelId: responsavelUmId,
        papel: "PRESIDENTE",
      }),
      service.adicionarMembro(comissao.id, {
        responsavelId: responsavelDoisId,
        papel: "PRESIDENTE",
      }),
    ]);

    expect(
      resultados.filter(({ status }) => status === "fulfilled"),
    ).toHaveLength(1);
    expect(
      resultados.filter(
        (resultado): resultado is PromiseRejectedResult =>
          resultado.status === "rejected" &&
          (resultado.reason as { response?: { codigo?: string } }).response
            ?.codigo === "PRESIDENTE_COMISSAO_JA_EXISTENTE",
      ),
    ).toHaveLength(1);
    expect(
      await database.membroComissao.count({
        where: { comissaoId: comissao.id, tipoMembroComissao: "PRESIDENTE" },
      }),
    ).toBe(1);
  });

  it("congela ato, vigência e composição após qualquer uso patrimonial", async () => {
    const dados = dadosCriacao();
    dados.membros = [{ responsavelId: responsavelUmId, papel: "MEMBRO" }];
    const comissao = await service.criar(dados, identidade);
    await database.manutencao.create({
      data: {
        tipo: "PREVENTIVA",
        dataEnvio: new Date("2026-06-01T00:00:00.000Z"),
        comissaoId: comissao.id,
        createdById: identidade.id,
      },
    });

    await expect(
      service.alterar(comissao.id, { numeroAto: "Portaria 11/2026" }),
    ).rejects.toMatchObject({ response: { codigo: "COMISSAO_JA_UTILIZADA" } });
    await expect(
      service.removerMembro(comissao.id, comissao.membros[0]!.id),
    ).rejects.toMatchObject({ response: { codigo: "COMISSAO_JA_UTILIZADA" } });
    await expect(
      service.alterar(comissao.id, { nome: "Nome ainda editável" }),
    ).resolves.toMatchObject({ nome: "Nome ainda editável" });
  });

  it("mantém vigência inclusiva nos dois limites", async () => {
    const comissao = await service.criar(dadosCriacao(), identidade);

    await expect(
      service.consultarVigente(comissao.id, "2026-01-01"),
    ).resolves.toMatchObject({ id: comissao.id });
    await expect(
      service.consultarVigente(comissao.id, "2026-12-31"),
    ).resolves.toMatchObject({ id: comissao.id });
    await expect(
      service.consultarVigente(comissao.id, "2027-01-01"),
    ).rejects.toMatchObject({
      response: { codigo: "COMISSAO_FORA_DA_VIGENCIA" },
    });
  });
});
import { randomUUID } from "node:crypto";
