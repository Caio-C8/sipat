import { randomUUID } from "node:crypto";
import type { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import { createDatabaseClient, type DatabaseClient } from "@repo/database";
import {
  CABECALHO_CSRF,
  CriarMovimentacaoResponseSchema,
  ListarMovimentacoesResponseSchema,
  ConsultarMovimentacaoResponseSchema,
  RespostaErroSchema,
} from "@repo/contracts";
import cookieParser from "cookie-parser";
import request from "supertest";
import { AppModule } from "../src/app.module";
import { DATABASE_CLIENT } from "../src/common/database/database.constants";
import { InventariosService } from "../src/modules/inventarios/inventarios.service";
import { MovimentacoesService } from "../src/modules/movimentacoes/movimentacoes.service";
import { MovimentacaoResponseMapper } from "../src/modules/movimentacoes/mappers/movimentacao-response.mapper";
import { diaSaoPaulo } from "../src/modules/movimentacoes/datas-movimentacao";
import {
  exigirBancoMovimentacoes,
  prepararMovimentacoes,
  type FixtureMovimentacoes,
} from "./support/movimentacoes-fixture";
const url = process.env.MOVIMENTACOES_INTEGRATION_DATABASE_URL;
const suite = url ? describe : describe.skip;
suite("movimentações HTTP + PostgreSQL real", () => {
  jest.setTimeout(60_000);
  let app: INestApplication,
    db: DatabaseClient,
    f: FixtureMovimentacoes,
    inventarios: InventariosService,
    service: MovimentacoesService;
  beforeAll(async () => {
    exigirBancoMovimentacoes(url);
    db = createDatabaseClient(url);
    const module = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(DATABASE_CLIENT)
      .useValue(db)
      .compile();
    app = module.createNestApplication();
    app.use(cookieParser());
    app.setGlobalPrefix("api");
    await app.init();
    inventarios = app.get(InventariosService);
    service = app.get(MovimentacoesService);
  });
  afterAll(async () => {
    await app?.close();
  });
  beforeEach(async () => {
    f = await prepararMovimentacoes(db);
  });
  const body = (n = 1) => ({
    chaveIdempotencia: randomUUID(),
    comissaoId: f.comissao.id,
    observacao: "Mudança de sala",
    itens: f.bens.slice(0, n).map((bem) => ({
      patrimonioId: bem.id,
      setorOrigemEsperadoId: f.setores[0]!.id,
      setorDestinoId: f.setores[1]!.id,
    })),
  });
  const post = (dados: object, cookie?: string) =>
    request(app.getHttpServer())
      .post("/api/movimentacoes")
      .set("Cookie", cookie ?? f.cookieDiretor)
      .set("Origin", "http://localhost:3000")
      .set(CABECALHO_CSRF, "1")
      .send(dados);
  const get = (path: string, cookie?: string) =>
    request(app.getHttpServer())
      .get(`/api/movimentacoes${path}`)
      .set("Cookie", cookie ?? f.cookieDiretor);
  async function criarInventario() {
    return inventarios.criar(
      {
        chaveIdempotencia: randomUUID(),
        nome: "Inventário de teste",
        comissaoId: f.comissao.id,
      },
      f.identidade,
    );
  }
  async function concluirTudo(id: string) {
    const setores = await db.setorInventario.findMany({
      where: { inventarioId: id },
      orderBy: { id: "asc" },
    });
    for (const setor of setores) {
      await inventarios.iniciarSetor(id, setor.id, f.identidade);
      await inventarios.concluirSetor(id, setor.id, f.identidade);
    }
  }
  it("aplica sessão, perfil e CSRF reais e mantém CRUD administrativo fechado", async () => {
    await request(app.getHttpServer()).get("/api/movimentacoes").expect(401);
    await post(body(), f.cookieAdmin).expect(403);
    await request(app.getHttpServer())
      .post("/api/movimentacoes")
      .set("Cookie", f.cookieDiretor)
      .set("Origin", "http://localhost:3000")
      .send(body())
      .expect(403);
    await get("", f.cookieAdmin).expect(200);
    await get("/opcoes/setores?contexto=FILTRO", f.cookieAdmin).expect(200);
    await get("/opcoes/setores?contexto=REGISTRO", f.cookieAdmin).expect(403);
    await get("/opcoes/comissoes?contexto=REGISTRO", f.cookieAdmin).expect(403);
    await request(app.getHttpServer())
      .get("/api/comissoes")
      .set("Cookie", f.cookieDiretor)
      .expect(403);
    expect(await db.transferenciaPatrimonio.count()).toBe(0);
  });
  it.each([1, 10])(
    "confirma %s bens, consulta e conserva instante comum",
    async (n) => {
      const response = await post(body(n)).expect(201);
      const parsed = CriarMovimentacaoResponseSchema.parse(response.body);
      expect(parsed.dados).toHaveLength(n);
      expect(new Set(parsed.dados.map((x) => x.id)).size).toBe(n);
      expect(new Set(parsed.dados.map((x) => x.dataTransferencia)).size).toBe(
        1,
      );
      expect(
        await db.patrimonio.count({
          where: { setorAtualId: f.setores[1]!.id },
        }),
      ).toBe(n);
      expect(
        ListarMovimentacoesResponseSchema.parse(
          (await get("", f.cookieAdmin)).body,
        ).meta.total,
      ).toBe(n);
      expect(
        ConsultarMovimentacaoResponseSchema.parse(
          (await get(`/${parsed.dados[0]!.id}`, f.cookieAdmin)).body,
        ).dados.observacao,
      ).toBe("Mudança de sala");
    },
  );
  it("rejeita 11, repetidos e campos do servidor sem gravação", async () => {
    for (const dados of [
      body(11),
      { ...body(), itens: [body().itens[0], body().itens[0]] },
      { ...body(), dataTransferencia: "2026-10-28" },
    ])
      await post(dados).expect(400);
    expect(await db.transferenciaPatrimonio.count()).toBe(0);
    expect(
      await db.patrimonio.count({ where: { setorAtualId: f.setores[0]!.id } }),
    ).toBe(12);
  });
  it.each(["BAIXADO", "EMPRESTADO", "EM_MANUTENCAO"] as const)(
    "%s em um item impede todos e retorna índice original",
    async (status) => {
      await db.patrimonio.update({
        where: { id: f.bens[1]!.id },
        data: { status },
      });
      const response = await post(body(2)).expect(409);
      RespostaErroSchema.parse(response.body);
      expect(response.body.erros).toContainEqual(
        expect.objectContaining({
          campo: "itens.1.patrimonioId",
          codigo: "PATRIMONIO_NAO_ATIVO",
        }),
      );
      expect(await db.transferenciaPatrimonio.count()).toBe(0);
      expect(await db.idempotenciaMovimentacao.count()).toBe(0);
      expect(
        await db.patrimonio.count({
          where: { setorAtualId: f.setores[0]!.id },
        }),
      ).toBe(12);
    },
  );
  it("recusa destino inativo/igual/inexistente, bem ausente e comissão ausente/vencida", async () => {
    await db.setor.update({
      where: { id: f.setores[1]!.id },
      data: { ativo: false },
    });
    const invalidos = [
      body(),
      { ...body(), comissaoId: randomUUID() },
      {
        ...body(),
        itens: [{ ...body().itens[0], patrimonioId: randomUUID() }],
      },
      {
        ...body(),
        itens: [{ ...body().itens[0], setorDestinoId: randomUUID() }],
      },
    ];
    for (const dados of invalidos) await post(dados).expect(409);
    await post({
      ...body(),
      itens: [{ ...body().itens[0], setorDestinoId: f.setores[0]!.id }],
    }).expect(400);
    await db.comissao.update({
      where: { id: f.comissao.id },
      data: { dataVigenciaFim: new Date("2001-01-01") },
    });
    expect((await post(body()).expect(409)).body.erros).toContainEqual(
      expect.objectContaining({
        campo: "comissaoId",
        codigo: "COMISSAO_FORA_DA_VIGENCIA",
      }),
    );
    expect(await db.transferenciaPatrimonio.count()).toBe(0);
  });
  it("aceita origem inativa e comissão sem integrantes nos dois extremos da vigência", async () => {
    await db.setor.update({
      where: { id: f.setores[0]!.id },
      data: { ativo: false },
    });
    const hoje = new Date(`${diaSaoPaulo(new Date())}T00:00:00Z`);
    await db.comissao.update({
      where: { id: f.comissao.id },
      data: { dataVigenciaInicio: hoje, dataVigenciaFim: hoje },
    });
    await post(body()).expect(201);
  });
  it("recupera reenvio, inclusive por nova instância, e rejeita chave com outro conteúdo", async () => {
    const dados = body(2);
    const primeira = (await post(dados).expect(201)).body;
    expect((await post(dados).expect(201)).body).toEqual(primeira);
    const outroModulo = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(DATABASE_CLIENT)
      .useValue(db)
      .compile();
    const novaInstancia = outroModulo.get(MovimentacoesService);
    expect(
      (await novaInstancia.criar(dados, f.identidade)).map((x) =>
        MovimentacaoResponseMapper.paraDetalhe(x),
      ),
    ).toEqual(primeira.dados);
    await outroModulo.close();
    expect(
      (await post({ ...dados, observacao: "Outro motivo" }).expect(409)).body
        .codigo,
    ).toBe("CHAVE_IDEMPOTENCIA_REUTILIZADA");
    expect(await db.transferenciaPatrimonio.count()).toBe(2);
  });
  it("duas requisições simultâneas com mesma chave geram um único conjunto", async () => {
    const dados = body(10);
    const respostas = await Promise.all([post(dados), post(dados)]);
    expect(respostas.some((x) => x.status === 201)).toBe(true);
    for (const r of respostas) expect([201, 409]).toContain(r.status);
    const replay = await post(dados).expect(201);
    expect(await db.transferenciaPatrimonio.count()).toBe(10);
    expect(await db.idempotenciaMovimentacao.count()).toBe(1);
    expect(replay.body.dados).toEqual(
      respostas.find((x) => x.status === 201)!.body.dados,
    );
  });
  it("duas confirmações distintas com a mesma origem obsoleta não sobrescrevem localização", async () => {
    const a = body(),
      b = body();
    b.itens[0]!.setorDestinoId = f.setores[2]!.id;
    const respostas = await Promise.all([post(a), post(b)]);
    expect(respostas.map((x) => x.status).sort()).toEqual([201, 409]);
    expect(respostas.find((x) => x.status === 409)!.body.erros).toContainEqual(
      expect.objectContaining({ codigo: "ORIGEM_ALTERADA" }),
    );
    expect(await db.transferenciaPatrimonio.count()).toBe(1);
  });
  it("bloqueia origem e destino PENDENTE/EM_ANDAMENTO em qualquer inventário", async () => {
    const antigo = await criarInventario();
    await concluirTudo(antigo.id);
    const aberto = await criarInventario();
    let response = await post(body()).expect(409);
    expect(response.body.erros).toContainEqual(
      expect.objectContaining({
        campo: "itens.0.setorOrigemEsperadoId",
        codigo: "SETOR_EM_INVENTARIO_PENDENTE",
      }),
    );
    const setor = await db.setorInventario.findFirstOrThrow({
      where: { inventarioId: aberto.id, setorId: f.setores[1]!.id },
    });
    await inventarios.iniciarSetor(aberto.id, setor.id, f.identidade);
    response = await post(body()).expect(409);
    expect(response.body.erros).toContainEqual(
      expect.objectContaining({
        campo: "itens.0.setorDestinoId",
        codigo: "SETOR_EM_INVENTARIO_EM_ANDAMENTO",
      }),
    );
    expect(await db.transferenciaPatrimonio.count()).toBe(0);
  });
  it("CONCLUIDO permite transferência entre população sem alterar snapshots; FINALIZADO libera", async () => {
    const inventario = await criarInventario();
    await concluirTudo(inventario.id);
    const antes = await db.itemInventario.findMany({
      where: { inventarioId: inventario.id },
      orderBy: { id: "asc" },
    });
    await post(body()).expect(201);
    expect(
      await db.itemInventario.findMany({
        where: { inventarioId: inventario.id },
        orderBy: { id: "asc" },
      }),
    ).toEqual(antes);
    await inventarios.finalizar(
      inventario.id,
      { confirmarCorrecoesPendentes: false },
      f.identidade,
    );
    const dados = body();
    dados.itens[0]!.setorOrigemEsperadoId = f.setores[1]!.id;
    dados.itens[0]!.setorDestinoId = f.setores[2]!.id;
    await post(dados).expect(201);
  });
  it("restringe saída da população somente ao bem incluído", async () => {
    const inventario = await criarInventario();
    await concluirTudo(inventario.id);
    const externo = await db.setor.create({
      data: {
        nome: "Setor posterior",
        responsavelId: f.setores[0]!.responsavelId,
        createdById: f.diretor.id,
      },
    });
    const dados = body();
    dados.itens[0]!.setorDestinoId = externo.id;
    expect((await post(dados).expect(409)).body.erros).toContainEqual(
      expect.objectContaining({ codigo: "DESTINO_FORA_INVENTARIO_ABERTO" }),
    );
    const posterior = await db.patrimonio.create({
      data: {
        numeroPatrimonio: "100",
        tipoNumeroPatrimonial: "OFICIAL",
        descricao: "Bem posterior",
        dataTombamento: new Date(),
        valorIncorporacao: 100,
        especieId: f.bens[0]!.especieId,
        setorAtualId: f.setores[0]!.id,
        createdById: f.diretor.id,
      },
    });
    dados.itens[0]!.patrimonioId = posterior.id;
    await post(dados).expect(201);
  });
  it("correção específica segue vigente sem exigir vigência nova ou motivo e aparece na consulta", async () => {
    const inv = await criarInventario();
    const setor = await db.setorInventario.findFirstOrThrow({
      where: { inventarioId: inv.id, setorId: f.setores[1]!.id },
    });
    await inventarios.iniciarSetor(inv.id, setor.id, f.identidade);
    await inventarios.verificarItem(
      inv.id,
      setor.id,
      { numeroPatrimonial: f.bens[0]!.numeroPatrimonio },
      f.identidade,
    );
    const item = await db.itemInventario.findFirstOrThrow({
      where: { inventarioId: inv.id, patrimonioId: f.bens[0]!.id },
    });
    // A correção usa a comissão do inventário, sem adicionar a política B do fluxo comum.
    await db.comissao.update({
      where: { id: f.comissao.id },
      data: { dataVigenciaFim: new Date("2001-01-01") },
    });
    await inventarios.corrigirItem(
      inv.id,
      item.id,
      { tipoCorrecao: "TRANSFERENCIA_CADASTRAL" },
      f.identidade,
    );
    const resposta = await get("").expect(200);
    expect(resposta.body.dados[0].origemRegistro).toBe("CORRECAO_INVENTARIO");
    const detalhe = await get(`/${resposta.body.dados[0].id}`).expect(200);
    expect(detalhe.body.dados.observacao).toBeNull();
    expect(detalhe.body.dados.correcaoInventario).toEqual({
      inventarioId: inv.id,
      itemInventarioId: item.id,
    });
  });
  it("criação concorrente de inventário mantém localização e snapshot serialmente coerentes", async () => {
    const dados = body();
    const resultados = await Promise.allSettled([
      service.criar(dados, f.identidade),
      criarInventario(),
    ]);
    expect(resultados[1]!.status).toBe("fulfilled");
    const bem = await db.patrimonio.findUniqueOrThrow({
      where: { id: f.bens[0]!.id },
    });
    const item = await db.itemInventario.findFirstOrThrow({
      where: { patrimonioId: bem.id },
    });
    expect(item.setorEsperadoId).toBe(bem.setorAtualId);
    expect(await db.transferenciaPatrimonio.count()).toBe(
      resultados[0]!.status === "fulfilled" ? 1 : 0,
    );
  });
  it("início de conferência concorrente não admite transferência sobre setor pendente", async () => {
    const inv = await criarInventario();
    const setor = await db.setorInventario.findFirstOrThrow({
      where: { inventarioId: inv.id, setorId: f.setores[0]!.id },
    });
    const resultados = await Promise.allSettled([
      service.criar(body(), f.identidade),
      inventarios.iniciarSetor(inv.id, setor.id, f.identidade),
    ]);
    expect(resultados[0]!.status).toBe("rejected");
    expect(resultados[1]!.status).toBe("fulfilled");
    expect(await db.transferenciaPatrimonio.count()).toBe(0);
  });
  it("inativação concorrente e alteração de comissão não resultam em confirmação inválida", async () => {
    const tx = db.$transaction(async (tx) => {
      await tx.setor.update({
        where: { id: f.setores[1]!.id },
        data: { ativo: false },
      });
      await tx.comissao.update({
        where: { id: f.comissao.id },
        data: { dataVigenciaFim: new Date("2001-01-01") },
      });
    });
    await tx;
    const resposta = await post(body()).expect(409);
    expect(
      resposta.body.erros.map((x: { codigo: string }) => x.codigo),
    ).toEqual(
      expect.arrayContaining(["DESTINO_INATIVO", "COMISSAO_FORA_DA_VIGENCIA"]),
    );
    expect(await db.transferenciaPatrimonio.count()).toBe(0);
  });
  it("filtra dias de São Paulo inclusivos, busca/interseção, paginação e auxiliares históricos", async () => {
    const resposta = await post(body(10)).expect(201);
    await db.transferenciaPatrimonio.updateMany({
      data: { dataTransferencia: new Date("2026-10-28T12:00:00.000Z") },
    });
    const ids = resposta.body.dados.map((x: { id: string }) => x.id);
    await db.transferenciaPatrimonio.update({
      where: { id: ids[0] },
      data: { dataTransferencia: new Date("2026-10-28T02:59:59.999Z") },
    });
    await db.transferenciaPatrimonio.update({
      where: { id: ids[1] },
      data: { dataTransferencia: new Date("2026-10-28T03:00:00.000Z") },
    });
    await db.transferenciaPatrimonio.update({
      where: { id: ids[2] },
      data: { dataTransferencia: new Date("2026-10-29T02:59:59.999Z") },
    });
    await db.transferenciaPatrimonio.update({
      where: { id: ids[3] },
      data: { dataTransferencia: new Date("2026-10-29T03:00:00.000Z") },
    });
    const filtro = `/api/movimentacoes?dataInicio=2026-10-28&dataFim=2026-10-28&comissaoId=${f.comissao.id}&setorOrigemId=${f.setores[0]!.id}&setorDestinoId=${f.setores[1]!.id}&busca=Mesa&limite=2`;
    const pagina = (
      await request(app.getHttpServer())
        .get(filtro)
        .set("Cookie", f.cookieAdmin)
        .expect(200)
    ).body;
    expect(pagina.dados).toHaveLength(2);
    expect(pagina.meta.total).toBe(8);
    await get("?dataInicio=2026-02-30").expect(400);
    await get(`/${randomUUID()}`).expect(404);
    await db.setor.update({
      where: { id: f.setores[2]!.id },
      data: { ativo: false },
    });
    await db.comissao.update({
      where: { id: f.comissao.id },
      data: { dataVigenciaFim: new Date("2001-01-01") },
    });
    expect(
      (await get("/opcoes/setores?contexto=FILTRO")).body.dados.some(
        (x: { ativo: boolean }) => !x.ativo,
      ),
    ).toBe(true);
    expect(
      (await get("/opcoes/setores?contexto=REGISTRO")).body.dados.every(
        (x: { ativo: boolean }) => x.ativo,
      ),
    ).toBe(true);
    expect(
      (await get("/opcoes/comissoes?contexto=FILTRO")).body.meta.total,
    ).toBe(1);
    expect(
      (await get("/opcoes/comissoes?contexto=REGISTRO")).body.meta.total,
    ).toBe(0);
  });
  it("rollback após uma escrita efetiva também desfaz localização, histórico e idempotência", async () => {
    const alvo = f.bens[1]!.id;
    await db.$executeRawUnsafe(
      `CREATE FUNCTION falha_movimentacao_teste() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN IF NEW.patrimonio_id = '${alvo}'::uuid THEN RAISE EXCEPTION 'falha controlada de persistencia'; END IF; RETURN NEW; END $$`,
    );
    await db.$executeRawUnsafe(
      "CREATE TRIGGER falha_movimentacao_teste BEFORE INSERT ON transferencias_patrimoniais FOR EACH ROW EXECUTE FUNCTION falha_movimentacao_teste()",
    );
    try {
      await post(body(2)).expect(500);
      expect(await db.transferenciaPatrimonio.count()).toBe(0);
      expect(await db.idempotenciaMovimentacao.count()).toBe(0);
      expect(
        await db.patrimonio.count({
          where: { setorAtualId: f.setores[0]!.id },
        }),
      ).toBe(12);
    } finally {
      await db.$executeRawUnsafe(
        "DROP TRIGGER falha_movimentacao_teste ON transferencias_patrimoniais",
      );
      await db.$executeRawUnsafe("DROP FUNCTION falha_movimentacao_teste()");
    }
  });
  it("aguarda alteração concorrente bloqueada e revalida comissão e destino após commit", async () => {
    let liberar!: () => void, avisar!: () => void;
    const pronto = new Promise<void>((resolve) => {
      avisar = resolve;
    });
    const gate = new Promise<void>((resolve) => {
      liberar = resolve;
    });
    const alteracao = db.$transaction(async (tx) => {
      await tx.comissao.update({
        where: { id: f.comissao.id },
        data: { dataVigenciaFim: new Date("2001-01-01") },
      });
      await tx.setor.update({
        where: { id: f.setores[1]!.id },
        data: { ativo: false },
      });
      avisar();
      await gate;
    });
    await pronto;
    const resultado = service.criar(body(), f.identidade).then(
      () => null,
      (erro: unknown) => erro,
    );
    await new Promise((resolve) => setTimeout(resolve, 50));
    liberar();
    await alteracao;
    expect(await resultado).toMatchObject({
      response: {
        codigo: "MOVIMENTACAO_IMPEDIDA",
        erros: expect.arrayContaining([
          expect.objectContaining({ codigo: "DESTINO_INATIVO" }),
          expect.objectContaining({ codigo: "COMISSAO_FORA_DA_VIGENCIA" }),
        ]),
      },
    });
    expect(await db.transferenciaPatrimonio.count()).toBe(0);
  });
  it("as consultas ordenadas possuem índices utilizáveis no PostgreSQL", async () => {
    const plano = await db.$transaction(async (tx) => {
      await tx.$executeRawUnsafe("SET LOCAL enable_seqscan = off");
      return tx.$queryRawUnsafe<{ "QUERY PLAN": unknown }[]>(
        "EXPLAIN (FORMAT JSON) SELECT id FROM transferencias_patrimoniais ORDER BY data_transferencia DESC, id DESC LIMIT 20",
      );
    });
    expect(JSON.stringify(plano)).toContain("transferencias_data_id_idx");
  });
  it("inventário finalizado com correção pendente não impede transferência comum", async () => {
    const inv = await criarInventario();
    const destino = await db.setorInventario.findFirstOrThrow({
      where: { inventarioId: inv.id, setorId: f.setores[1]!.id },
    });
    await inventarios.iniciarSetor(inv.id, destino.id, f.identidade);
    await inventarios.verificarItem(
      inv.id,
      destino.id,
      { numeroPatrimonial: f.bens[0]!.numeroPatrimonio },
      f.identidade,
    );
    await inventarios.concluirSetor(inv.id, destino.id, f.identidade);
    const pendentes = await db.setorInventario.findMany({
      where: { inventarioId: inv.id, status: "PENDENTE" },
    });
    for (const setor of pendentes) {
      await inventarios.iniciarSetor(inv.id, setor.id, f.identidade);
      await inventarios.concluirSetor(inv.id, setor.id, f.identidade);
    }
    await inventarios.finalizar(
      inv.id,
      { confirmarCorrecoesPendentes: true },
      f.identidade,
    );
    expect(
      await db.itemInventario.count({
        where: { inventarioId: inv.id, statusCorrecao: "PENDENTE" },
      }),
    ).toBe(1);
    await post(body()).expect(201);
    expect(
      await db.itemInventario.count({
        where: { inventarioId: inv.id, statusCorrecao: "PENDENTE" },
      }),
    ).toBe(1);
  });
});
