import {
  ProgressoInventarioSchema,
  type IdentidadeAutenticada,
} from "@repo/contracts";
import { createDatabaseClient, type DatabaseClient } from "@repo/database";
import { ComissoesRepository } from "../src/modules/comissoes/comissoes.repository";
import { ComissoesService } from "../src/modules/comissoes/comissoes.service";
import { InventariosRepository } from "../src/modules/inventarios/inventarios.repository";
import { InventariosService } from "../src/modules/inventarios/inventarios.service";
import { InventariosPolicyService } from "../src/modules/inventarios/inventarios-policy.service";
import { ResponsaveisRepository } from "../src/modules/responsaveis/responsaveis.repository";
import { ResponsaveisService } from "../src/modules/responsaveis/responsaveis.service";
import { SetoresRepository } from "../src/modules/setores/setores.repository";
import { SetoresService } from "../src/modules/setores/setores.service";

const databaseUrl = process.env.INVENTARIOS_INTEGRATION_DATABASE_URL;
const describeComPostgres = databaseUrl ? describe : describe.skip;

describeComPostgres("inventários no PostgreSQL", () => {
  let database: DatabaseClient;
  let service: InventariosService;
  let setoresService: SetoresService;
  let identidade: IdentidadeAutenticada;
  let comissaoId: string;
  let setorAtivoId: string;
  let setorInativoId: string;

  const dadosInventario = (nome: string) => ({
    chaveIdempotencia: randomUUID(),
    nome,
    comissaoId,
  });

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
    setoresService = new SetoresService(
      new SetoresRepository(database),
      new ResponsaveisService(new ResponsaveisRepository(database)),
      new InventariosPolicyService(new InventariosRepository(database)),
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
      trocaSenhaObrigatoria: false,
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
      dadosInventario("Inventário anual"),
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
      service.criar(dadosInventario("Inventário inválido"), identidade),
    ).rejects.toMatchObject({
      response: { codigo: "PATRIMONIO_ATIVO_EM_SETOR_INATIVO" },
    });
    expect(await database.inventario.count()).toBe(0);
    expect(await database.setorInventario.count()).toBe(0);
    expect(await database.itemInventario.count()).toBe(0);
  });

  it("mantém cada snapshot íntegro sob criações concorrentes", async () => {
    const resultados = await Promise.all([
      service.criar(dadosInventario("Inventário A"), identidade),
      service.criar(dadosInventario("Inventário B"), identidade),
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

  it("executa conferência idempotente, conclusão e finalização", async () => {
    const inventario = await service.criar(
      dadosInventario("Inventário operacional"),
      identidade,
    );
    const setores = await database.setorInventario.findMany({
      where: { inventarioId: inventario.id },
      orderBy: { setorId: "asc" },
    });
    const setorEsperado = setores.find(
      ({ setorId }) => setorId === setorAtivoId,
    )!;
    const outroSetor = setores.find(({ setorId }) => setorId !== setorAtivoId)!;

    await service.iniciarSetor(inventario.id, setorEsperado.id, identidade);
    const primeira = await service.verificarItem(
      inventario.id,
      setorEsperado.id,
      { numeroPatrimonial: "1001" },
      identidade,
    );
    const repetida = await service.verificarItem(
      inventario.id,
      setorEsperado.id,
      { numeroPatrimonial: "1001" },
      identidade,
    );
    await service.concluirSetor(inventario.id, setorEsperado.id, identidade);
    await service.iniciarSetor(inventario.id, outroSetor.id, identidade);
    await service.concluirSetor(inventario.id, outroSetor.id, identidade);
    const finalizado = await service.finalizar(
      inventario.id,
      { confirmarCorrecoesPendentes: false },
      identidade,
    );

    expect(primeira).toMatchObject({
      tipo: "CONFERENCIA_REGISTRADA",
      item: { situacao: "CORRETO", statusVerificacao: "VERIFICADO" },
    });
    expect(repetida).toMatchObject({ tipo: "LEITURA_IDEMPOTENTE" });
    expect(repetida.item.dataVerificacao).toEqual(
      primeira.item.dataVerificacao,
    );
    expect(finalizado.status).toBe("FINALIZADO");
    await expect(
      service.verificarItem(
        inventario.id,
        outroSetor.id,
        { numeroPatrimonial: "1001" },
        identidade,
      ),
    ).rejects.toMatchObject({ response: { codigo: "INVENTARIO_FINALIZADO" } });
  });

  it("corrige divergência com transferência atômica", async () => {
    const inventario = await service.criar(
      dadosInventario("Inventário com divergência"),
      identidade,
    );
    const setores = await database.setorInventario.findMany({
      where: { inventarioId: inventario.id },
    });
    const setorEsperado = setores.find(
      ({ setorId }) => setorId === setorAtivoId,
    )!;
    const setorEncontrado = setores.find(
      ({ setorId }) => setorId !== setorAtivoId,
    )!;

    await service.iniciarSetor(inventario.id, setorEncontrado.id, identidade);
    const verificado = await service.verificarItem(
      inventario.id,
      setorEncontrado.id,
      { numeroPatrimonial: "1001" },
      identidade,
    );
    const encontradoAntesDaCorrecao = await service.listarItens(inventario.id, {
      pagina: 1,
      limite: 10,
      setorInventarioId: setorEncontrado.id,
      contextoSetor: "ENCONTRADO_NO_SETOR",
      statusVerificacao: "VERIFICADO",
    });
    const corrigido = await service.corrigirItem(
      inventario.id,
      verificado.item.id,
      { tipoCorrecao: "TRANSFERENCIA_CADASTRAL" },
      identidade,
    );

    expect(corrigido).toMatchObject({
      situacao: "DIVERGENCIA",
      statusCorrecao: "CORRIGIDO",
      tipoCorrecao: "TRANSFERENCIA_CADASTRAL",
    });
    expect(corrigido.transferenciaCorrecaoId).not.toBeNull();
    expect(encontradoAntesDaCorrecao).toMatchObject({
      total: 1,
      items: [{ id: verificado.item.id, situacao: "DIVERGENCIA" }],
    });
    await expect(
      service.listarItens(inventario.id, {
        pagina: 1,
        limite: 10,
        setorInventarioId: setorEsperado.id,
        contextoSetor: "PREVISTO",
        statusVerificacao: "VERIFICADO",
      }),
    ).resolves.toMatchObject({
      total: 1,
      items: [{ id: verificado.item.id, situacao: "DIVERGENCIA" }],
    });
    await expect(
      service.listarItens(inventario.id, {
        pagina: 1,
        limite: 10,
        setorInventarioId: setorEncontrado.id,
        contextoSetor: "ENCONTRADO_NO_SETOR",
        statusVerificacao: "VERIFICADO",
      }),
    ).resolves.toMatchObject({
      total: 1,
      items: [
        {
          id: verificado.item.id,
          situacao: "DIVERGENCIA",
          statusCorrecao: "CORRIGIDO",
        },
      ],
    });
    await expect(
      database.patrimonio.findUniqueOrThrow({
        where: { numeroPatrimonio: "1001" },
        select: { setorAtualId: true },
      }),
    ).resolves.toEqual({ setorAtualId: setorEncontrado.setorId });
    expect(
      await database.transferenciaPatrimonio.count({
        where: { patrimonioId: verificado.item.patrimonio.id },
      }),
    ).toBe(1);

    await service.concluirSetor(inventario.id, setorEncontrado.id, identidade);
    await service.iniciarSetor(inventario.id, setorEsperado.id, identidade);
    await service.concluirSetor(inventario.id, setorEsperado.id, identidade);
    await expect(
      service.finalizar(
        inventario.id,
        { confirmarCorrecoesPendentes: false },
        identidade,
      ),
    ).resolves.toMatchObject({ status: "FINALIZADO" });
  });

  it("registra e corrige localização posterior sem duplicar o item", async () => {
    const inventario = await service.criar(
      dadosInventario("Inventário com localização posterior"),
      identidade,
    );
    const setores = await database.setorInventario.findMany({
      where: { inventarioId: inventario.id },
    });
    const setorEsperado = setores.find(
      ({ setorId }) => setorId === setorAtivoId,
    )!;
    const setorEncontrado = setores.find(
      ({ setorId }) => setorId !== setorAtivoId,
    )!;

    await service.iniciarSetor(inventario.id, setorEsperado.id, identidade);
    await service.concluirSetor(inventario.id, setorEsperado.id, identidade);
    await service.iniciarSetor(inventario.id, setorEncontrado.id, identidade);

    const resultados = await Promise.all([
      service.verificarItem(
        inventario.id,
        setorEncontrado.id,
        { numeroPatrimonial: "1001" },
        identidade,
      ),
      service.verificarItem(
        inventario.id,
        setorEncontrado.id,
        { numeroPatrimonial: "1001" },
        identidade,
      ),
    ]);
    const localizado = resultados.find(
      ({ tipo }) => tipo === "LOCALIZACAO_POSTERIOR_REGISTRADA",
    )!;
    const repetido = resultados.find(
      ({ tipo }) => tipo === "LOCALIZACAO_POSTERIOR_IDEMPOTENTE",
    )!;

    expect(localizado).toMatchObject({
      tipo: "LOCALIZACAO_POSTERIOR_REGISTRADA",
      item: {
        situacao: "NAO_LOCALIZADO",
        localizacoesPosteriores: [
          {
            statusCorrecao: "PENDENTE",
            setorInventarioEncontrado: {
              setor: { id: setorEncontrado.setorId },
            },
          },
        ],
      },
    });
    expect(repetido.tipo).toBe("LOCALIZACAO_POSTERIOR_IDEMPOTENTE");
    expect(
      await database.itemInventario.count({
        where: { inventarioId: inventario.id },
      }),
    ).toBe(1);
    expect(
      await database.localizacaoPosteriorInventario.count({
        where: { inventarioId: inventario.id },
      }),
    ).toBe(1);
    const progressoAposLocalizacao = (await service.consultar(inventario.id))
      .progresso;
    expect(progressoAposLocalizacao).toMatchObject({
      itensVerificados: 1,
      divergencias: 0,
      naoLocalizados: 1,
      correcoesPendentes: 0,
      correcoesCorrigidas: 0,
    });
    expect(() =>
      ProgressoInventarioSchema.parse(progressoAposLocalizacao),
    ).not.toThrow();

    const corrigido = await service.corrigirItem(
      inventario.id,
      localizado.item.id,
      { tipoCorrecao: "TRANSFERENCIA_CADASTRAL" },
      identidade,
    );
    expect(corrigido).toMatchObject({
      situacao: "NAO_LOCALIZADO",
      localizacoesPosteriores: [
        {
          statusCorrecao: "CORRIGIDO",
          tipoCorrecao: "TRANSFERENCIA_CADASTRAL",
        },
      ],
    });
    await expect(
      database.patrimonio.findUniqueOrThrow({
        where: { numeroPatrimonio: "1001" },
        select: { setorAtualId: true },
      }),
    ).resolves.toEqual({ setorAtualId: setorEncontrado.setorId });
  });

  it("preserva empréstimo vigente ao encerrar item não localizado", async () => {
    const inventario = await service.criar(
      dadosInventario("Inventário com empréstimo"),
      identidade,
    );
    const setor = await database.setorInventario.findFirstOrThrow({
      where: { inventarioId: inventario.id, setorId: setorAtivoId },
    });
    const patrimonio = await database.patrimonio.findUniqueOrThrow({
      where: { numeroPatrimonio: "1001" },
    });
    const emprestimo = await database.emprestimoPatrimonio.create({
      data: {
        dataEmprestimo: new Date(),
        grupoEmprestimoId: "00000000-0000-4000-8000-000000000098",
        comissaoId,
        patrimonioId: patrimonio.id,
        createdById: identidade.id,
      },
    });
    await database.patrimonio.update({
      where: { id: patrimonio.id },
      data: { status: "EMPRESTADO" },
    });

    await service.iniciarSetor(inventario.id, setor.id, identidade);
    await service.concluirSetor(inventario.id, setor.id, identidade);
    await expect(
      database.itemInventario.findFirstOrThrow({
        where: { inventarioId: inventario.id, patrimonioId: patrimonio.id },
      }),
    ).resolves.toMatchObject({
      situacao: "NAO_LOCALIZADO",
      statusVerificacao: "VERIFICADO",
      statusPatrimonioNaVerificacao: "EMPRESTADO",
      emprestimoPatrimonioId: emprestimo.id,
    });
  });

  it("preserva manutenção vigente ao encerrar item não localizado", async () => {
    const inventario = await service.criar(
      dadosInventario("Inventário com manutenção"),
      identidade,
    );
    const setor = await database.setorInventario.findFirstOrThrow({
      where: { inventarioId: inventario.id, setorId: setorAtivoId },
    });
    const patrimonio = await database.patrimonio.findUniqueOrThrow({
      where: { numeroPatrimonio: "1001" },
    });
    const manutencao = await database.manutencao.create({
      data: {
        tipo: "CORRETIVA",
        dataEnvio: new Date("2026-10-24T00:00:00.000Z"),
        comissaoId,
        createdById: identidade.id,
        itens: { create: { patrimonioId: patrimonio.id, tipo: "CORRETIVA" } },
      },
      include: { itens: true },
    });
    await database.patrimonio.update({
      where: { id: patrimonio.id },
      data: { status: "EM_MANUTENCAO" },
    });

    await service.iniciarSetor(inventario.id, setor.id, identidade);
    await service.concluirSetor(inventario.id, setor.id, identidade);
    await expect(
      database.itemInventario.findFirstOrThrow({
        where: { inventarioId: inventario.id, patrimonioId: patrimonio.id },
      }),
    ).resolves.toMatchObject({
      situacao: "NAO_LOCALIZADO",
      statusPatrimonioNaVerificacao: "EM_MANUTENCAO",
      itemManutencaoId: manutencao.itens[0]!.id,
    });
  });

  it("bloqueia inativação de setor participante até finalizar o inventário", async () => {
    const inventario = await service.criar(
      dadosInventario("Inventário que bloqueia setor"),
      identidade,
    );

    await expect(
      setoresService.alterarSituacao(setorAtivoId, { ativo: false }),
    ).rejects.toMatchObject({
      response: { codigo: "SETOR_PARTICIPANTE_INVENTARIO_ABERTO" },
    });
    const patrimonio = await database.patrimonio.findUniqueOrThrow({
      where: { numeroPatrimonio: "1001" },
    });
    await expect(
      database.baixaPatrimonio.create({
        data: {
          dataBaixa: new Date(),
          tipo: "INUTILIZACAO",
          motivo: "Teste de bloqueio durante inventário",
          patrimonioId: patrimonio.id,
          comissaoId,
          createdById: identidade.id,
        },
      }),
    ).rejects.toThrow();

    const setores = await database.setorInventario.findMany({
      where: { inventarioId: inventario.id },
    });
    for (const setor of setores) {
      await service.iniciarSetor(inventario.id, setor.id, identidade);
      await service.concluirSetor(inventario.id, setor.id, identidade);
    }
    await service.finalizar(
      inventario.id,
      { confirmarCorrecoesPendentes: false },
      identidade,
    );
    await expect(
      setoresService.alterarSituacao(setorAtivoId, { ativo: false }),
    ).resolves.toMatchObject({ ativo: false });
    await expect(
      database.baixaPatrimonio.create({
        data: {
          dataBaixa: new Date(),
          tipo: "INUTILIZACAO",
          motivo: "Teste permitido após finalização",
          patrimonioId: patrimonio.id,
          comissaoId,
          createdById: identidade.id,
        },
      }),
    ).resolves.toMatchObject({ patrimonioId: patrimonio.id });
  });

  it("consolida somente uma escrita em leituras concorrentes", async () => {
    const inventario = await service.criar(
      dadosInventario("Inventário concorrente"),
      identidade,
    );
    const setor = await database.setorInventario.findFirstOrThrow({
      where: { inventarioId: inventario.id, setorId: setorAtivoId },
    });
    await service.iniciarSetor(inventario.id, setor.id, identidade);

    const resultados = await Promise.all([
      service.verificarItem(
        inventario.id,
        setor.id,
        { numeroPatrimonial: "1001" },
        identidade,
      ),
      service.verificarItem(
        inventario.id,
        setor.id,
        { numeroPatrimonial: "1001" },
        identidade,
      ),
    ]);

    expect(resultados.map(({ tipo }) => tipo).sort()).toEqual([
      "CONFERENCIA_REGISTRADA",
      "LEITURA_IDEMPOTENTE",
    ]);
    expect(
      await database.itemInventario.count({
        where: { inventarioId: inventario.id },
      }),
    ).toBe(1);
    expect(
      await database.itemInventario.count({
        where: { inventarioId: inventario.id, statusVerificacao: "VERIFICADO" },
      }),
    ).toBe(1);
  });

  it("mantém somente um setor em andamento sob inícios concorrentes", async () => {
    const inventario = await service.criar(
      dadosInventario("Inventário com início concorrente"),
      identidade,
    );
    const setores = await database.setorInventario.findMany({
      where: { inventarioId: inventario.id },
    });

    const resultados = await Promise.allSettled(
      setores.map((setor) =>
        service.iniciarSetor(inventario.id, setor.id, identidade),
      ),
    );

    expect(
      resultados.filter(({ status }) => status === "fulfilled"),
    ).toHaveLength(1);
    expect(
      resultados.filter(({ status }) => status === "rejected"),
    ).toHaveLength(1);
    expect(
      await database.setorInventario.count({
        where: { inventarioId: inventario.id, status: "EM_ANDAMENTO" },
      }),
    ).toBe(1);
  });

  it("não perde leitura confirmada nem aceita escrita após conclusão concorrente", async () => {
    const inventario = await service.criar(
      dadosInventario("Inventário conclusão versus leitura"),
      identidade,
    );
    const setor = await database.setorInventario.findFirstOrThrow({
      where: { inventarioId: inventario.id, setorId: setorAtivoId },
    });
    await service.iniciarSetor(inventario.id, setor.id, identidade);

    const resultados = await Promise.allSettled([
      service.concluirSetor(inventario.id, setor.id, identidade),
      service.verificarItem(
        inventario.id,
        setor.id,
        { numeroPatrimonial: "1001" },
        identidade,
      ),
    ]);
    const estado = await database.itemInventario.findFirstOrThrow({
      where: { inventarioId: inventario.id },
    });

    expect(resultados[0]?.status).toBe("fulfilled");
    expect(estado).toMatchObject({
      statusVerificacao: "VERIFICADO",
      verificadoPorId: identidade.id,
    });
    expect(
      await database.setorInventario.findUniqueOrThrow({
        where: { id: setor.id },
        select: { status: true },
      }),
    ).toEqual({ status: "CONCLUIDO" });
    await expect(
      service.verificarItem(
        inventario.id,
        setor.id,
        { numeroPatrimonial: "1001" },
        identidade,
      ),
    ).rejects.toMatchObject({
      response: { codigo: "SETOR_INVENTARIO_FORA_DE_ANDAMENTO" },
    });
  });

  it("não aceita correção depois da finalização concorrente", async () => {
    const inventario = await service.criar(
      dadosInventario("Inventário finalização versus correção"),
      identidade,
    );
    const setores = await database.setorInventario.findMany({
      where: { inventarioId: inventario.id },
    });
    const setorEsperado = setores.find(
      ({ setorId }) => setorId === setorAtivoId,
    )!;
    const setorEncontrado = setores.find(
      ({ setorId }) => setorId !== setorAtivoId,
    )!;
    await service.iniciarSetor(inventario.id, setorEncontrado.id, identidade);
    const verificacao = await service.verificarItem(
      inventario.id,
      setorEncontrado.id,
      { numeroPatrimonial: "1001" },
      identidade,
    );
    await service.concluirSetor(inventario.id, setorEncontrado.id, identidade);
    await service.iniciarSetor(inventario.id, setorEsperado.id, identidade);
    await service.concluirSetor(inventario.id, setorEsperado.id, identidade);

    const resultados = await Promise.allSettled([
      service.finalizar(
        inventario.id,
        { confirmarCorrecoesPendentes: true },
        identidade,
      ),
      service.corrigirItem(
        inventario.id,
        verificacao.item.id,
        { tipoCorrecao: "RETORNO_AO_SETOR_CADASTRADO" },
        identidade,
      ),
    ]);

    expect(resultados[0]?.status).toBe("fulfilled");
    expect(
      await database.inventario.findUniqueOrThrow({
        where: { id: inventario.id },
        select: { status: true },
      }),
    ).toEqual({ status: "FINALIZADO" });
    await expect(
      service.corrigirItem(
        inventario.id,
        verificacao.item.id,
        { tipoCorrecao: "RETORNO_AO_SETOR_CADASTRADO" },
        identidade,
      ),
    ).rejects.toMatchObject({ response: { codigo: "INVENTARIO_FINALIZADO" } });
  });

  it("impede dois setores em andamento no inventário e o mesmo setor físico em inventários distintos", async () => {
    const [inventarioA, inventarioB] = await Promise.all([
      service.criar(dadosInventario("Inventário A"), identidade),
      service.criar(dadosInventario("Inventário B"), identidade),
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
      dadosInventario("Inventário com ausência"),
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
import { randomUUID } from "node:crypto";
