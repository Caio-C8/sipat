import { randomUUID } from "node:crypto";
import {
  createDatabaseClient,
  Prisma,
  type DatabaseClient,
} from "@repo/database";
import { construirNamespaceLockIdempotencia } from "../src/common/utils/idempotencia";
import { InventariosPolicyService } from "../src/modules/inventarios/inventarios-policy.service";
import { InventariosRepository } from "../src/modules/inventarios/inventarios.repository";
import { ResponsaveisRepository } from "../src/modules/responsaveis/responsaveis.repository";
import { ResponsaveisService } from "../src/modules/responsaveis/responsaveis.service";
import { SetoresRepository } from "../src/modules/setores/setores.repository";
import { SetoresService } from "../src/modules/setores/setores.service";

const databaseUrl = process.env.IDEMPOTENCIA_INTEGRATION_DATABASE_URL;
const describeComPostgres = databaseUrl ? describe : describe.skip;

describeComPostgres("IDEMPOTENCIA-001 no PostgreSQL", () => {
  let db: DatabaseClient;

  jest.setTimeout(60_000);

  beforeAll(async () => {
    if (!databaseUrl?.includes("/sipat_idempotencia001")) {
      throw new Error(
        "IDEMPOTENCIA_INTEGRATION_DATABASE_URL deve apontar para sipat_idempotencia001.",
      );
    }
    db = createDatabaseClient(databaseUrl);
    await db.$connect();
  });

  afterAll(async () => db?.$disconnect());

  beforeEach(async () => {
    await db.$executeRawUnsafe('TRUNCATE TABLE "usuarios" CASCADE');
  });

  it("remove snapshots JSON e mantém apenas os campos técnicos mínimos", async () => {
    const tabelas = [
      "idempotencias_movimentacao",
      "idempotencias_manutencao",
      "idempotencias_reavaliacao",
      "idempotencias_emprestimo",
    ];
    const colunas = await db.$queryRaw<
      { table_name: string; column_name: string }[]
    >`
      SELECT table_name, column_name
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = ANY(${tabelas}::text[])
        AND column_name IN ('resultado', 'body', 'erro')
    `;
    expect(colunas).toEqual([]);
  });

  it("impõe unicidade por usuário e chave nas sete raízes", async () => {
    const base = await criarBase();
    const chave = randomUUID();
    const criacoes: Array<() => Promise<unknown>> = [
      () =>
        db.setor.create({
          data: {
            nome: randomUUID(),
            responsavelId: base.responsavelId,
            createdById: base.usuarioId,
            chaveCriacao: chave,
            hashCriacao: "a".repeat(64),
          },
        }),
      () =>
        db.fornecedor.create({
          data: {
            razaoSocial: randomUUID(),
            createdById: base.usuarioId,
            chaveCriacao: chave,
            hashCriacao: "a".repeat(64),
          },
        }),
      () =>
        db.comissao.create({
          data: {
            nome: randomUUID(),
            dataVigenciaInicio: new Date("2026-01-01T00:00:00Z"),
            dataVigenciaFim: new Date("2026-12-31T00:00:00Z"),
            createdById: base.usuarioId,
            chaveCriacao: chave,
            hashCriacao: "a".repeat(64),
          },
        }),
      () =>
        db.processoCompra.create({
          data: {
            observacao: randomUUID(),
            createdById: base.usuarioId,
            chaveCriacao: chave,
            hashCriacao: "a".repeat(64),
          },
        }),
      () =>
        db.notaFiscal.create({
          data: {
            numeroNotaFiscal: randomUUID(),
            anoNotaFiscal: 2026,
            dataEmissao: new Date("2026-10-31T00:00:00Z"),
            processoCompraId: base.processoId,
            fornecedorId: base.fornecedorId,
            createdById: base.usuarioId,
            chaveCriacao: chave,
            hashCriacao: "a".repeat(64),
          },
        }),
      () =>
        db.patrimonio.create({
          data: {
            numeroPatrimonio: randomUUID(),
            tipoNumeroPatrimonial: "OFICIAL",
            descricao: "Bem de teste",
            dataTombamento: new Date("2026-10-31T00:00:00Z"),
            valorIncorporacao: new Prisma.Decimal(1),
            especieId: base.especieId,
            setorAtualId: base.setorId,
            createdById: base.usuarioId,
            chaveCriacao: chave,
            hashCriacao: "a".repeat(64),
          },
        }),
      () =>
        db.inventario.create({
          data: {
            nome: randomUUID(),
            comissaoId: base.comissaoId,
            createdById: base.usuarioId,
            chaveCriacao: chave,
            hashCriacao: "a".repeat(64),
          },
        }),
    ];

    for (const criar of criacoes) {
      await criar();
      await expect(criar()).rejects.toMatchObject({ code: "P2002" });
    }
  });

  it("rollback remove recurso e chave e lock concorrente não espera", async () => {
    const base = await criarBase();
    const chave = randomUUID();
    await expect(
      db.$transaction(async (tx) => {
        await tx.setor.create({
          data: {
            nome: "Setor revertido",
            responsavelId: base.responsavelId,
            createdById: base.usuarioId,
            chaveCriacao: chave,
            hashCriacao: "b".repeat(64),
          },
        });
        throw new Error("falha sintética");
      }),
    ).rejects.toThrow("falha sintética");
    expect(
      await db.setor.count({
        where: { createdById: base.usuarioId, chaveCriacao: chave },
      }),
    ).toBe(0);

    let liberar!: () => void;
    let bloqueado!: () => void;
    const pronto = new Promise<void>((resolve) => (bloqueado = resolve));
    const fim = new Promise<void>((resolve) => (liberar = resolve));
    const namespace = construirNamespaceLockIdempotencia(
      "setor",
      base.usuarioId,
      chave,
    );
    const primeira = db.$transaction(async (tx) => {
      const [linha] = await tx.$queryRaw<{ obtido: boolean }[]>`
        SELECT pg_try_advisory_xact_lock(hashtextextended(${namespace}, 0)) AS obtido
      `;
      expect(linha?.obtido).toBe(true);
      bloqueado();
      await fim;
    });
    await pronto;
    const segunda = await db.$transaction(async (tx) => {
      const [linha] = await tx.$queryRaw<{ obtido: boolean }[]>`
        SELECT pg_try_advisory_xact_lock(hashtextextended(${namespace}, 0)) AS obtido
      `;
      return linha?.obtido;
    });
    expect(segunda).toBe(false);
    liberar();
    await primeira;
  });

  it("isola locks de domínios diferentes sem perder a exclusão no mesmo domínio", async () => {
    const base = await criarBase();
    const chave = randomUUID();
    const movimentacao = construirNamespaceLockIdempotencia(
      "movimentacao",
      base.usuarioId,
      chave,
    );
    const manutencao = construirNamespaceLockIdempotencia(
      "manutencao",
      base.usuarioId,
      chave,
    );
    const reavaliacao = construirNamespaceLockIdempotencia(
      "reavaliacao",
      base.usuarioId,
      chave,
    );
    let liberar!: () => void;
    let bloqueado!: () => void;
    const pronto = new Promise<void>((resolve) => (bloqueado = resolve));
    const fim = new Promise<void>((resolve) => (liberar = resolve));
    const titular = db.$transaction(async (tx) => {
      const [linha] = await tx.$queryRaw<{ obtido: boolean }[]>`
        SELECT pg_try_advisory_xact_lock(hashtextextended(${movimentacao}, 0)) AS obtido
      `;
      expect(linha?.obtido).toBe(true);
      bloqueado();
      await fim;
    });
    await pronto;

    const resultado = await db.$transaction(async (tx) => {
      const [mesmoDominio] = await tx.$queryRaw<{ obtido: boolean }[]>`
        SELECT pg_try_advisory_xact_lock(hashtextextended(${movimentacao}, 0)) AS obtido
      `;
      const [outroDominio] = await tx.$queryRaw<{ obtido: boolean }[]>`
        SELECT pg_try_advisory_xact_lock(hashtextextended(${manutencao}, 0)) AS obtido
      `;
      const [terceiroDominio] = await tx.$queryRaw<{ obtido: boolean }[]>`
        SELECT pg_try_advisory_xact_lock(hashtextextended(${reavaliacao}, 0)) AS obtido
      `;
      return {
        mesmoDominio: mesmoDominio?.obtido,
        outroDominio: outroDominio?.obtido,
        terceiroDominio: terceiroDominio?.obtido,
      };
    });

    expect(resultado).toEqual({
      mesmoDominio: false,
      outroDominio: true,
      terceiroDominio: true,
    });
    liberar();
    await titular;
  });

  it("protege documento de manutenção por FK, CHECK e unicidade", async () => {
    const base = await criarBase();
    const manutencao = await db.manutencao.create({
      data: {
        dataEnvio: new Date("2026-11-01T00:00:00Z"),
        comissaoId: base.comissaoId,
        createdById: base.usuarioId,
      },
    });
    const documento = await db.documentoManutencao.create({
      data: {
        manutencaoId: manutencao.id,
        fase: "PEDIDO",
        chave: `testes/${randomUUID()}.pdf`,
        nome: "Documento.pdf",
        createdById: base.usuarioId,
      },
    });
    const chave = randomUUID();
    const dados = {
      usuarioId: base.usuarioId,
      chave,
      tipo: "DOCUMENTO",
      hashPayload: "c".repeat(64),
      manutencaoId: manutencao.id,
      documentoId: documento.id,
    };

    await db.idempotenciaManutencao.create({ data: dados });
    await expect(
      db.idempotenciaManutencao.create({ data: dados }),
    ).rejects.toMatchObject({ code: "P2002" });
    await expect(
      db.idempotenciaManutencao.create({
        data: {
          ...dados,
          chave: randomUUID(),
          documentoId: randomUUID(),
        },
      }),
    ).rejects.toMatchObject({ code: "P2003" });
    await expect(
      db.idempotenciaManutencao.create({
        data: { ...dados, chave: randomUUID(), documentoId: null },
      }),
    ).rejects.toMatchObject({ code: "P2039" });
    await expect(
      db.idempotenciaManutencao.create({
        data: { ...dados, chave: randomUUID(), tipo: "CRIACAO" },
      }),
    ).rejects.toMatchObject({ code: "P2039" });
  });

  it("a API distingue repetição confirmada, chave reutilizada e operação concorrente", async () => {
    const base = await criarBase();
    const service = new SetoresService(
      new SetoresRepository(db),
      new ResponsaveisService(new ResponsaveisRepository(db)),
      new InventariosPolicyService(new InventariosRepository(db)),
    );
    const identidade = {
      id: base.usuarioId,
      nome: "Diretor",
      email: "diretor@example.test",
      perfil: "DIRETOR_PATRIMONIO" as const,
      trocaSenhaObrigatoria: false,
    };
    const chave = randomUUID();
    const dados = {
      chaveIdempotencia: chave,
      nome: "Setor protegido",
      responsavelId: base.responsavelId,
    };
    await service.criar(dados, identidade);
    await expect(service.criar(dados, identidade)).rejects.toMatchObject({
      response: { codigo: "OPERACAO_JA_PROCESSADA" },
    });
    await expect(
      service.criar({ ...dados, nome: "Outro setor" }, identidade),
    ).rejects.toMatchObject({
      response: { codigo: "CHAVE_IDEMPOTENCIA_REUTILIZADA" },
    });
    expect(
      await db.setor.count({
        where: { createdById: base.usuarioId, chaveCriacao: chave },
      }),
    ).toBe(1);

    const chaveConcorrente = randomUUID();
    let liberar!: () => void;
    let bloqueado!: () => void;
    const pronto = new Promise<void>((resolve) => (bloqueado = resolve));
    const fim = new Promise<void>((resolve) => (liberar = resolve));
    const namespace = construirNamespaceLockIdempotencia(
      "setor",
      base.usuarioId,
      chaveConcorrente,
    );
    const titular = db.$transaction(async (tx) => {
      await tx.$queryRaw`
        SELECT pg_advisory_xact_lock(hashtextextended(${namespace}, 0)) IS NULL AS obtido
      `;
      bloqueado();
      await fim;
    });
    await pronto;
    await expect(
      service.criar(
        { ...dados, chaveIdempotencia: chaveConcorrente },
        identidade,
      ),
    ).rejects.toMatchObject({
      response: { codigo: "OPERACAO_EM_PROCESSAMENTO" },
    });
    liberar();
    await titular;
  });

  it("usa os índices compostos nas consultas por chave", async () => {
    const base = await criarBase();
    const chave = randomUUID();
    const plano = await db.$transaction(async (tx) => {
      await tx.$executeRaw`SET LOCAL enable_seqscan = off`;
      return tx.$queryRawUnsafe<{ "QUERY PLAN": string }[]>(
        `EXPLAIN (COSTS OFF) SELECT id FROM setores WHERE created_by_id = $1::uuid AND chave_criacao = $2::uuid`,
        base.usuarioId,
        chave,
      );
    });
    expect(plano.map((linha) => linha["QUERY PLAN"]).join(" ")).toContain(
      "setores_created_by_chave_criacao_key",
    );
  });

  async function criarBase() {
    const usuario = await db.usuario.create({
      data: {
        nome: "Diretor",
        email: `${randomUUID()}@example.test`,
        senha: "hash",
        perfil: "DIRETOR_PATRIMONIO",
      },
    });
    const responsavel = await db.responsavel.create({
      data: {
        nome: "Responsável",
        matricula: randomUUID().slice(0, 12),
        createdById: usuario.id,
      },
    });
    const setor = await db.setor.create({
      data: {
        nome: "Setor base",
        responsavelId: responsavel.id,
        createdById: usuario.id,
      },
    });
    const fornecedor = await db.fornecedor.create({
      data: { razaoSocial: "Fornecedor base", createdById: usuario.id },
    });
    const comissao = await db.comissao.create({
      data: {
        nome: "Comissão base",
        dataVigenciaInicio: new Date("2026-01-01T00:00:00Z"),
        dataVigenciaFim: new Date("2026-12-31T00:00:00Z"),
        createdById: usuario.id,
      },
    });
    const processo = await db.processoCompra.create({
      data: { createdById: usuario.id },
    });
    const natureza = await db.natureza.create({
      data: {
        nome: "Natureza base",
        nomeNormalizado: randomUUID(),
        createdById: usuario.id,
      },
    });
    const especie = await db.especie.create({
      data: {
        nome: "Espécie base",
        nomeNormalizado: randomUUID(),
        naturezaId: natureza.id,
        createdById: usuario.id,
      },
    });
    return {
      usuarioId: usuario.id,
      responsavelId: responsavel.id,
      setorId: setor.id,
      fornecedorId: fornecedor.id,
      comissaoId: comissao.id,
      processoId: processo.id,
      especieId: especie.id,
    };
  }
});
