import { randomUUID } from "node:crypto";
import type { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import cookieParser from "cookie-parser";
import request from "supertest";
import {
  CABECALHO_CSRF,
  ConsultarEmprestimoResponseSchema,
  CriarEmprestimoResponseSchema,
  RegistrarDevolucaoEmprestimoResponseSchema,
} from "@repo/contracts";
import type { IdentidadeAutenticada } from "@repo/contracts";
import { createDatabaseClient, type DatabaseClient } from "@repo/database";
import {
  diaSaoPaulo,
  proximoDiaCivil,
} from "../src/common/utils/datas-institucionais";
import { ComissoesRepository } from "../src/modules/comissoes/comissoes.repository";
import { ComissoesService } from "../src/modules/comissoes/comissoes.service";
import { EmprestimosRepository } from "../src/modules/emprestimos/emprestimos.repository";
import { EmprestimosService } from "../src/modules/emprestimos/emprestimos.service";
import { InventariosPolicyService } from "../src/modules/inventarios/inventarios-policy.service";
import { InventariosRepository } from "../src/modules/inventarios/inventarios.repository";
import { PatrimoniosRepository } from "../src/modules/patrimonios/patrimonios.repository";
import { PatrimoniosService } from "../src/modules/patrimonios/patrimonios.service";
import { DATABASE_CLIENT } from "../src/common/database/database.constants";
import { configurarCors } from "../src/configurar-cors";
import { calcularHashTokenSessao } from "../src/modules/auth/token-sessao";

const url = process.env.EMPRESTIMOS_INTEGRATION_DATABASE_URL;
const comBanco = url ? describe : describe.skip;

comBanco("empréstimos RF16 no PostgreSQL isolado", () => {
  let db: DatabaseClient;
  let app: INestApplication;
  let diretorCookie: string;
  let adminCookie: string;
  let service: EmprestimosService;
  let diretor: IdentidadeAutenticada;
  let administrador: IdentidadeAutenticada;
  let setorId: string;
  let especieId: string;
  let comissaoId: string;
  const hoje = diaSaoPaulo(new Date());
  const ontem = new Date(`${hoje}T12:00:00.000Z`);
  ontem.setUTCDate(ontem.getUTCDate() - 1);
  const diaAnterior = ontem.toISOString().slice(0, 10);
  const previsao = proximoDiaCivil(hoje);

  jest.setTimeout(60_000);
  beforeAll(async () => {
    if (
      !url ||
      !/^postgresql:\/\/[^/]+@127\.0\.0\.1:55416\/sipat_rf16\?/.test(url)
    )
      throw new Error(
        "Teste restrito ao PostgreSQL descartável RF16 na porta 55416.",
      );
    db = createDatabaseClient(url);
    await db.$connect();
    service = new EmprestimosService(
      new EmprestimosRepository(db),
      new PatrimoniosService(new PatrimoniosRepository(db)),
      new ComissoesService(new ComissoesRepository(db)),
      new InventariosPolicyService(new InventariosRepository(db)),
    );
    const tag = randomUUID();
    const usuario = await db.usuario.create({
      data: {
        nome: "Diretor RF16",
        email: `${tag}@example.test`,
        senha: "hash-sintetico",
        perfil: "DIRETOR_PATRIMONIO",
        trocaSenhaObrigatoria: false,
      },
    });
    const admin = await db.usuario.create({
      data: {
        nome: "Administrador RF16",
        email: `${randomUUID()}@example.test`,
        senha: "hash-sintetico",
        perfil: "ADMINISTRADOR",
        trocaSenhaObrigatoria: false,
      },
    });
    diretor = {
      id: usuario.id,
      nome: usuario.nome,
      email: usuario.email,
      perfil: usuario.perfil,
      trocaSenhaObrigatoria: false,
    };
    administrador = {
      id: admin.id,
      nome: admin.nome,
      email: admin.email,
      perfil: admin.perfil,
      trocaSenhaObrigatoria: false,
    };
    const responsavel = await db.responsavel.create({
      data: {
        nome: "Responsável RF16",
        matricula: tag.slice(0, 20),
        createdById: usuario.id,
      },
    });
    const setor = await db.setor.create({
      data: {
        nome: "Setor RF16",
        responsavelId: responsavel.id,
        createdById: usuario.id,
      },
    });
    setorId = setor.id;
    const natureza = await db.natureza.create({
      data: {
        nome: `Natureza ${tag}`,
        nomeNormalizado: tag,
        createdById: usuario.id,
      },
    });
    const especie = await db.especie.create({
      data: {
        nome: `Espécie ${tag}`,
        nomeNormalizado: tag,
        naturezaId: natureza.id,
        createdById: usuario.id,
      },
    });
    especieId = especie.id;
    const comissao = await db.comissao.create({
      data: {
        nome: "Comissão RF16",
        dataVigenciaInicio: new Date("2020-01-01T00:00:00.000Z"),
        dataVigenciaFim: new Date("2030-12-31T00:00:00.000Z"),
        createdById: usuario.id,
      },
    });
    comissaoId = comissao.id;
    const { AppModule } =
      jest.requireActual<typeof import("../src/app.module")>(
        "../src/app.module",
      );
    const modulo = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(DATABASE_CLIENT)
      .useValue(db)
      .compile();
    app = modulo.createNestApplication();
    app.use(cookieParser());
    app.setGlobalPrefix("api");
    configurarCors(app, "http://localhost:3000,http://localhost:8081");
    await app.init();
    async function sessao(usuarioId: string) {
      const token = Buffer.from(
        randomUUID().replace(/-/g, "").repeat(2).slice(0, 64),
        "hex",
      ).toString("base64url");
      const tokenHash = calcularHashTokenSessao(token);
      if (!tokenHash) throw new Error("Token sintético inválido.");
      await db.sessaoUsuario.create({
        data: {
          usuarioId,
          tokenHash,
          expiraAt: new Date(Date.now() + 3_600_000),
        },
      });
      return `sipat_session=${token}`;
    }
    diretorCookie = await sessao(diretor.id);
    adminCookie = await sessao(administrador.id);
  });
  afterAll(async () => {
    await app?.close();
    await db?.$disconnect();
  });

  async function bem() {
    const numero =
      String(Date.now()) + String(Math.floor(Math.random() * 100000));
    return db.patrimonio.create({
      data: {
        numeroPatrimonio: numero,
        tipoNumeroPatrimonial: "OFICIAL",
        descricao: `Bem RF16 ${numero}`,
        dataTombamento: new Date("2025-01-01T00:00:00.000Z"),
        valorIncorporacao: "1000",
        especieId,
        setorAtualId: setorId,
        createdById: diretor.id,
      },
    });
  }
  function saida(
    ids: string[],
    modoAgrupamento: "EM_GRUPO" | "SEPARADAMENTE" = "EM_GRUPO",
  ) {
    return {
      chaveIdempotencia: randomUUID(),
      modoAgrupamento,
      patrimonioIds: ids,
      destinatario: "Instituição sintética",
      finalidade: "Teste temporário",
      dataEmprestimo: diaAnterior,
      dataPrevistaDevolucao: previsao,
      comissaoId,
    };
  }

  it("registra grupo, reenvia sem duplicar, devolve parcialmente e conclui", async () => {
    const primeiro = await bem();
    const segundo = await bem();
    const dados = saida([primeiro.id, segundo.id]);
    const resposta = await service.criar(dados, diretor);
    expect(Array.isArray(resposta.dados)).toBe(false);
    if (Array.isArray(resposta.dados)) throw new Error("Grupo esperado.");
    const grupo = resposta.dados;
    expect(grupo.pendentes).toBe(2);
    expect((await service.criar(dados, diretor)).dados).toEqual(grupo);
    expect(
      await db.emprestimoPatrimonio.count({
        where: { grupoEmprestimoId: grupo.id },
      }),
    ).toBe(2);
    expect(
      (await db.patrimonio.findUniqueOrThrow({ where: { id: primeiro.id } }))
        .status,
    ).toBe("EMPRESTADO");
    await expect(
      service.criar({ ...dados, finalidade: "Outra" }, diretor),
    ).rejects.toMatchObject({ status: 409 });
    await expect(
      service.criar(saida([primeiro.id]), diretor),
    ).rejects.toMatchObject({ status: 409 });
    await expect(
      service.criar(saida([await bem().then((p) => p.id)]), administrador),
    ).rejects.toMatchObject({ status: 403 });

    const itemPrimeiro = grupo.itens.find(
      (item) => item.patrimonio.id === primeiro.id,
    )!;
    const itemSegundo = grupo.itens.find(
      (item) => item.patrimonio.id === segundo.id,
    )!;
    expect((await service.consultar(itemPrimeiro.id)).id).toBe(grupo.id);
    const parcial = {
      chaveIdempotencia: randomUUID(),
      emprestimoIds: [itemPrimeiro.id],
      dataDevolucao: hoje,
      comissaoId,
    };
    const devolvido = await service.devolver(grupo.id, parcial, diretor);
    expect(devolvido.dados.emprestimo.pendentes).toBe(1);
    expect((await service.devolver(grupo.id, parcial, diretor)).dados).toEqual(
      devolvido.dados,
    );
    expect(
      (await db.patrimonio.findUniqueOrThrow({ where: { id: primeiro.id } }))
        .status,
    ).toBe("ATIVO");
    expect(
      (await db.patrimonio.findUniqueOrThrow({ where: { id: segundo.id } }))
        .status,
    ).toBe("EMPRESTADO");
    expect(
      (await db.patrimonio.findUniqueOrThrow({ where: { id: primeiro.id } }))
        .setorAtualId,
    ).toBe(setorId);
    expect(
      (
        await db.patrimonio.findUniqueOrThrow({ where: { id: primeiro.id } })
      ).valorIncorporacao.toString(),
    ).toBe("1000");
    await expect(
      service.devolver(
        grupo.id,
        { ...parcial, chaveIdempotencia: randomUUID() },
        diretor,
      ),
    ).rejects.toMatchObject({ status: 409 });
    const final = await service.devolver(
      grupo.id,
      {
        chaveIdempotencia: randomUUID(),
        emprestimoIds: [itemSegundo.id],
        dataDevolucao: hoje,
        comissaoId,
      },
      diretor,
    );
    expect(final.dados.emprestimo.situacao).toBe("CONCLUIDO");
    expect((await service.consultar(grupo.id)).pendentes).toBe(0);
    const lista = await service.listar({
      pagina: 1,
      limite: 20,
      situacao: "CONCLUIDO",
    });
    expect(lista.items.some((item) => item.id === grupo.id)).toBe(true);
  });

  it("cria empréstimos separados e mantém atomicidade diante de bem inelegível", async () => {
    const a = await bem();
    const b = await bem();
    const dados = saida([a.id, b.id], "SEPARADAMENTE");
    const resposta = await service.criar(dados, diretor);
    expect(Array.isArray(resposta.dados)).toBe(true);
    if (!Array.isArray(resposta.dados))
      throw new Error("Empréstimos separados esperados.");
    expect(resposta.dados).toHaveLength(2);
    expect(resposta.dados[0]?.id).not.toBe(resposta.dados[1]?.id);
    const c = await bem();
    await expect(
      service.criar(saida([c.id, a.id]), diretor),
    ).rejects.toMatchObject({ status: 409 });
    expect(
      (await db.patrimonio.findUniqueOrThrow({ where: { id: c.id } })).status,
    ).toBe("ATIVO");
  });

  it("aplica sessão, perfil, CSRF e envelopes nas rotas HTTP reais", async () => {
    const bemHttp = await bem();
    const body = saida([bemHttp.id]);
    await request(app.getHttpServer()).get("/api/emprestimos").expect(401);
    await request(app.getHttpServer())
      .get("/api/emprestimos/opcoes/patrimonios")
      .set("Cookie", adminCookie)
      .expect(403);
    await request(app.getHttpServer())
      .post("/api/emprestimos")
      .set("Cookie", adminCookie)
      .set("Origin", "http://localhost:3000")
      .set(CABECALHO_CSRF, "1")
      .send(body)
      .expect(403);
    await request(app.getHttpServer())
      .post("/api/emprestimos")
      .set("Cookie", diretorCookie)
      .set("Origin", "http://localhost:3000")
      .send(body)
      .expect(403);
    const criado = await request(app.getHttpServer())
      .post("/api/emprestimos")
      .set("Cookie", diretorCookie)
      .set("Origin", "http://localhost:3000")
      .set(CABECALHO_CSRF, "1")
      .send(body)
      .expect(201);
    expect(CriarEmprestimoResponseSchema.safeParse(criado.body).success).toBe(
      true,
    );
    const grupo = criado.body.dados.id as string;
    const itemId = criado.body.dados.itens[0].id as string;
    const detalhe = await request(app.getHttpServer())
      .get(`/api/emprestimos/${grupo}`)
      .set("Cookie", adminCookie)
      .expect(200);
    expect(
      ConsultarEmprestimoResponseSchema.safeParse(detalhe.body).success,
    ).toBe(true);
    const retorno = await request(app.getHttpServer())
      .post(`/api/emprestimos/${grupo}/devolucoes`)
      .set("Cookie", diretorCookie)
      .set("Origin", "http://localhost:3000")
      .set(CABECALHO_CSRF, "1")
      .send({
        chaveIdempotencia: randomUUID(),
        emprestimoIds: [itemId],
        dataDevolucao: hoje,
        comissaoId,
      })
      .expect(201);
    expect(
      RegistrarDevolucaoEmprestimoResponseSchema.safeParse(retorno.body)
        .success,
    ).toBe(true);
    expect(retorno.body.dados.emprestimo.situacao).toBe("CONCLUIDO");
  });

  it("rejeita datas e comissões inválidas sem alterar os bens", async () => {
    const patrimonio = await bem();
    const base = saida([patrimonio.id]);
    const futura = proximoDiaCivil(hoje);
    await expect(
      service.criar({ ...base, dataEmprestimo: futura }, diretor),
    ).rejects.toMatchObject({ status: 400 });
    await expect(
      service.criar({ ...base, dataEmprestimo: "2010-01-01" }, diretor),
    ).rejects.toMatchObject({ status: 409 });
    expect(
      (await db.patrimonio.findUniqueOrThrow({ where: { id: patrimonio.id } }))
        .status,
    ).toBe("ATIVO");
    expect(
      await db.emprestimoPatrimonio.count({
        where: { patrimonioId: patrimonio.id },
      }),
    ).toBe(0);
  });

  it("serializa duas saídas concorrentes para o mesmo bem e calcula atraso/filtros", async () => {
    const patrimonio = await bem();
    const atrasada = {
      ...saida([patrimonio.id]),
      dataPrevistaDevolucao: diaAnterior,
      destinatario: "Pessoa sintética atraso",
    };
    const resultados = await Promise.allSettled([
      service.criar(atrasada, diretor),
      service.criar(saida([patrimonio.id]), diretor),
    ]);
    expect(resultados.filter((r) => r.status === "fulfilled")).toHaveLength(1);
    expect(resultados.filter((r) => r.status === "rejected")).toHaveLength(1);
    expect(
      await db.emprestimoPatrimonio.count({
        where: { patrimonioId: patrimonio.id },
      }),
    ).toBe(1);
    const lista = await service.listar({
      pagina: 1,
      limite: 1,
      situacao: "EM_ANDAMENTO",
    });
    expect(lista.items).toHaveLength(1);
    expect(lista.total).toBeGreaterThan(1);
    const atrasados = await service.listar({
      pagina: 1,
      limite: 20,
      somenteAtrasados: true,
      busca: "Pessoa sintética atraso",
    });
    expect(atrasados.items.every((item) => item.emAtraso)).toBe(true);
  });

  it("permite setor PENDENTE e bloqueia devolução com setor EM_ANDAMENTO", async () => {
    const patrimonio = await bem();
    const inventario = await db.inventario.create({
      data: {
        nome: "Inventário RF16 sintético",
        comissaoId,
        createdById: diretor.id,
      },
    });
    const setorInventario = await db.setorInventario.create({
      data: { inventarioId: inventario.id, setorId },
    });
    const resposta = await service.criar(saida([patrimonio.id]), diretor);
    if (Array.isArray(resposta.dados)) throw new Error("Grupo esperado.");
    const itemId = resposta.dados.itens[0]!.id;
    await db.setorInventario.update({
      where: { id: setorInventario.id },
      data: {
        status: "EM_ANDAMENTO",
        dataInicio: new Date(),
        iniciadoPorId: diretor.id,
      },
    });
    await expect(
      service.devolver(
        resposta.dados.id,
        {
          chaveIdempotencia: randomUUID(),
          emprestimoIds: [itemId],
          dataDevolucao: hoje,
          comissaoId,
        },
        diretor,
      ),
    ).rejects.toMatchObject({
      response: { codigo: "SETOR_EM_INVENTARIO_EM_ANDAMENTO" },
    });
    expect(
      (await db.patrimonio.findUniqueOrThrow({ where: { id: patrimonio.id } }))
        .status,
    ).toBe("EMPRESTADO");
    expect(
      await db.devolucaoPatrimonio.count({ where: { emprestimoId: itemId } }),
    ).toBe(0);
    await db.setorInventario.update({
      where: { id: setorInventario.id },
      data: {
        status: "CONCLUIDO",
        dataFim: new Date(),
        concluidoPorId: diretor.id,
      },
    });
    const devolucao = await service.devolver(
      resposta.dados.id,
      {
        chaveIdempotencia: randomUUID(),
        emprestimoIds: [itemId],
        dataDevolucao: hoje,
        comissaoId,
      },
      diretor,
    );
    expect(devolucao.dados.emprestimo.situacao).toBe("CONCLUIDO");
  });

  it("preserva vínculo histórico do inventário e recusa retorno no dia da conferência", async () => {
    const patrimonio = await bem();
    const resposta = await service.criar(saida([patrimonio.id]), diretor);
    if (Array.isArray(resposta.dados)) throw new Error("Grupo esperado.");
    const itemId = resposta.dados.itens[0]!.id;
    const inventario = await db.inventario.create({
      data: { nome: "Histórico RF16", comissaoId, createdById: diretor.id },
    });
    const setorInventario = await db.setorInventario.create({
      data: { inventarioId: inventario.id, setorId },
    });
    const item = await db.itemInventario.create({
      data: {
        inventarioId: inventario.id,
        setorInventarioId: setorInventario.id,
        setorEsperadoId: setorId,
        patrimonioId: patrimonio.id,
        statusVerificacao: "VERIFICADO",
        situacao: "NAO_LOCALIZADO",
        statusPatrimonioNaVerificacao: "EMPRESTADO",
        emprestimoPatrimonioId: itemId,
        dataVerificacao: new Date(`${hoje}T12:00:00.000Z`),
        verificadoPorId: diretor.id,
      },
    });
    const retorno = {
      chaveIdempotencia: randomUUID(),
      emprestimoIds: [itemId],
      dataDevolucao: hoje,
      comissaoId,
    };
    await expect(
      service.devolver(resposta.dados.id, retorno, diretor),
    ).rejects.toMatchObject({
      response: { codigo: "CRONOLOGIA_PATRIMONIAL_CONFLITANTE" },
    });
    await db.itemInventario.update({
      where: { id: item.id },
      data: { dataVerificacao: new Date(`${diaAnterior}T12:00:00.000Z`) },
    });
    await service.devolver(resposta.dados.id, retorno, diretor);
    const depois = await db.itemInventario.findUniqueOrThrow({
      where: { id: item.id },
    });
    expect(depois.emprestimoPatrimonioId).toBe(itemId);
    expect(depois.statusPatrimonioNaVerificacao).toBe("EMPRESTADO");
  });

  it("lê registros de formato legado com campos e autoria da devolução nulos", async () => {
    const patrimonio = await bem();
    const id = randomUUID();
    await db.emprestimoPatrimonio.create({
      data: {
        id,
        grupoEmprestimoId: id,
        patrimonioId: patrimonio.id,
        comissaoId,
        createdById: diretor.id,
        dataEmprestimo: new Date(`${diaAnterior}T00:00:00.000Z`),
      },
    });
    await db.devolucaoPatrimonio.create({
      data: {
        emprestimoId: id,
        comissaoId,
        dataDevolucao: new Date(`${hoje}T00:00:00.000Z`),
      },
    });
    const detalhe = await service.consultar(id);
    expect(detalhe).toMatchObject({
      modoAgrupamento: null,
      destinatario: null,
      finalidade: null,
      dataPrevistaDevolucao: null,
    });
    expect(detalhe.itens[0]).toMatchObject({
      setorVinculo: null,
      devolucao: { registradoPor: null, aposPrevisao: null },
    });
    expect(
      ConsultarEmprestimoResponseSchema.safeParse({
        status: 200,
        sucesso: true,
        mensagem: "Empréstimo encontrado.",
        dados: detalhe,
      }).success,
    ).toBe(true);
  });
});
