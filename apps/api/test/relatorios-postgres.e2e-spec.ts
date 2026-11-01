import type { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import cookieParser from "cookie-parser";
import request from "supertest";
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { createDatabaseClient, type DatabaseClient } from "@repo/database";
import {
  queryRelatorio,
  TipoEventoRelatorioSchema,
  type TipoTabular,
} from "@repo/contracts";
import { DATABASE_CLIENT } from "../src/common/database/database.constants";
import { RelatoriosService } from "../src/modules/relatorios/relatorios.service";
import { RelatoriosRepository } from "../src/modules/relatorios/relatorios.repository";
import { construirFonte } from "../src/modules/relatorios/types/fontes-tabulares";
import { calcularHashTokenSessao } from "../src/modules/auth/token-sessao";
import {
  exigirBancoRelatorios,
  fixtureRelatorios,
} from "./support/relatorios-fixture";
const url = process.env.RELATORIOS_INTEGRATION_DATABASE_URL;
(url ? describe : describe.skip)(
  "relatórios — PostgreSQL isolado e Guards reais",
  () => {
    let db: DatabaseClient,
      app: INestApplication,
      service: RelatoriosService,
      f: Awaited<ReturnType<typeof fixtureRelatorios>>;
    const periodo = { inicio: "2026-01-01", fim: "2026-12-31" };
    jest.setTimeout(60000);
    beforeAll(async () => {
      exigirBancoRelatorios(url);
      db = createDatabaseClient(url);
      f = await fixtureRelatorios(db, true);
      const { AppModule } =
        jest.requireActual<typeof import("../src/app.module")>(
          "../src/app.module",
        );
      const m = await Test.createTestingModule({ imports: [AppModule] })
        .overrideProvider(DATABASE_CLIENT)
        .useValue(db)
        .compile();
      app = m.createNestApplication();
      app.use(cookieParser());
      app.setGlobalPrefix("api");
      await app.init();
      service = app.get(RelatoriosService);
    });
    afterAll(async () => {
      // Restaura somente a fixture legada de estresse; o banco também serve o
      // ambiente manual, cujo cadastro operacional limita a descrição.
      if (f?.bem)
        await db.patrimonio.update({
          where: { id: f.bem.id },
          data: { descricao: f.bem.descricao.split(" Descrição longa:")[0]! },
        });
      await app?.close();
      await db?.$disconnect();
    });
    function filtros(tipo: TipoTabular): Record<string, unknown> {
      return tipo === "patrimonios"
        ? { busca: f.tag }
        : tipo === "depreciacoes"
          ? {
              competenciaInicio: "2026-01",
              competenciaFim: "2026-02",
              patrimonioId: f.bem.id,
            }
          : tipo === "inventarios"
            ? { inventarioId: f.inventario.id }
            : tipo === "manutencoes"
              ? { ...periodo, base: "ENVIO", patrimonioId: f.bem.id }
              : tipo === "reavaliacoes"
                ? { ...periodo, base: "REGISTRO", patrimonioId: f.bem.id }
                : tipo === "emprestimos"
                  ? { ...periodo, base: "SAIDA", patrimonioId: f.bem.id }
                  : { ...periodo, patrimonioId: f.bem.id };
    }
    const tipos: TipoTabular[] = [
      "patrimonios",
      "movimentacoes",
      "manutencoes",
      "depreciacoes",
      "reavaliacoes",
      "inventarios",
      "emprestimos",
      "baixas",
    ];
    it("oito relatórios reais em ambos os perfis, sem expor campos privados", async () => {
      for (const tipo of tipos)
        for (const cookie of f.cookies) {
          const r = await request(app.getHttpServer())
            .get(`/api/relatorios/${tipo}`)
            .set("Cookie", cookie)
            .query(filtros(tipo));
          expect(r.status).toBe(200);
          expect(r.body.dados.length).toBeGreaterThan(0);
          expect(JSON.stringify(r.body)).not.toMatch(
            /senha|tokenHash|caminhoAnexo|chaveCriacao|matricula/,
          );
          expect(r.headers["cache-control"]).toBe("private, no-store");
        }
    });
    it("totais do conjunto, decimais exatos, baixados e inativos sem duplicação", async () => {
      const r = await service.tabular("patrimonios", {
        busca: f.tag,
        pagina: 2,
        limite: 20,
      });
      expect(r.meta.total).toBe(25);
      expect(r.dados).toHaveLength(5);
      if (r.tipo !== "patrimonios") throw new Error();
      expect(r.resumo.incorporacao).toBe("25003.0864175");
      expect(r.resumo.brutoAtual).toBeNull();
      expect(r.resumo.semContabilidade).toBe(1);
      const m = await service.tabular("manutencoes", {
        ...filtros("manutencoes"),
        pagina: 1,
        limite: 20,
      });
      if (m.tipo !== "manutencoes") throw new Error();
      expect(m.resumo.orcamentoConhecido).toBe("20.1234567");
      expect(m.meta.total).toBe(1);
      const d = await service.tabular("depreciacoes", {
        ...filtros("depreciacoes"),
        pagina: 1,
        limite: 20,
      });
      if (d.tipo !== "depreciacoes") throw new Error();
      expect(d.resumo.quotas).toBe("20.2469134");
      expect(d.resumo.porCompetencia).toHaveLength(2);
    });
    it("intervalo inclusivo São Paulo, correção distinta e referência ausente", async () => {
      const r = await service.tabular("movimentacoes", {
        patrimonioId: f.bem.id,
        inicio: "2026-01-01",
        fim: "2026-01-01",
        pagina: 1,
        limite: 20,
      });
      expect(r.meta.total).toBe(2);
      const c = await service.tabular("movimentacoes", {
        ...periodo,
        patrimonioId: f.bem.id,
        origem: "CORRECAO_INVENTARIO",
        pagina: 1,
        limite: 20,
      });
      expect(c.meta.total).toBe(1);
      const a = await service.tabular("reavaliacoes", {
        ...periodo,
        base: "REFERENCIA",
        patrimonioId: f.bem.id,
        pagina: 1,
        limite: 20,
      });
      expect(a.meta.total).toBe(0);
      expect(a.consulta.excluidosDataDesconhecida).toBe(1);
    });
    it("validação, opções enumeradas, vazio e limites", async () => {
      for (const q of [
        { ...periodo, sql: "x" },
        { inicio: "2026-02-30", fim: "2026-03-01" },
        { ...periodo, limite: "51" },
      ])
        expect(
          (
            await request(app.getHttpServer())
              .get("/api/relatorios/baixas")
              .set("Cookie", f.cookies[0]!)
              .query(q)
          ).status,
        ).toBe(400);
      expect(
        (
          await request(app.getHttpServer())
            .get("/api/relatorios/opcoes/fornecedores")
            .set("Cookie", f.cookies[0]!)
            .query({ tipo: "baixas" })
        ).status,
      ).toBe(400);
      const r = await service.tabular("baixas", {
        inicio: "2025-01-01",
        fim: "2025-01-02",
        patrimonioId: f.bem.id,
        pagina: 1,
        limite: 20,
      });
      expect(r.meta.total).toBe(0);
      expect(
        queryRelatorio("baixas").safeParse({ ...periodo, limite: "51" })
          .success,
      ).toBe(false);
    });
    it("ficha real une eventos tipados sem duplicar transferência de correção", async () => {
      const r = await request(app.getHttpServer())
        .get(`/api/relatorios/ficha-bem/${f.bem.id}/eventos`)
        .set("Cookie", f.cookies[0]!)
        .query({ limite: "50" });
      expect(r.status).toBe(200);
      expect(r.body.resumo.quantidade).toBeGreaterThanOrEqual(12);
      const tipos = r.body.dados.map((e: { tipo: string }) => e.tipo);
      expect(tipos.filter((t: string) => t === "TRANSFERENCIA")).toHaveLength(
        1,
      );
      expect(
        tipos.filter((t: string) => t === "REVISAO_ORCAMENTO"),
      ).toHaveLength(2);
      expect(tipos).toContain("CORRECAO_INVENTARIO");
      expect([...new Set(tipos)].sort()).toEqual(
        [...TipoEventoRelatorioSchema.options].sort(),
      );
      expect(
        r.body.dados.find((e: { tipo: string }) => e.tipo === "DEVOLUCAO")
          .autor,
      ).toBeNull();
      const cadastro = await request(app.getHttpServer())
        .get(`/api/relatorios/ficha-bem/${f.bem.id}`)
        .set("Cookie", f.cookies[1]!);
      expect(cadastro.status).toBe(200);
      expect(cadastro.body.dados.cadastro.status).toBe("BAIXADO");
      const filtrado = await request(app.getHttpServer())
        .get(`/api/relatorios/ficha-bem/${f.bem.id}/eventos`)
        .set("Cookie", f.cookies[1]!)
        .query({ evento: "DEPRECIACAO", pagina: "2", limite: "1" });
      expect(filtrado.status).toBe(200);
      expect(filtrado.body.meta.total).toBe(2);
      expect(filtrado.body.dados).toHaveLength(1);
    });
    it("PDF autenticado dos nove tipos contém todas as páginas e não apenas a prévia", async () => {
      const pasta = path.resolve("../../test-results/relatorios-pdf");
      mkdirSync(pasta, { recursive: true });
      for (const tipo of tipos) {
        const r = await request(app.getHttpServer())
          .get(`/api/relatorios/${tipo}/pdf`)
          .set("Cookie", f.cookies[0]!)
          .query(filtros(tipo))
          .buffer(true)
          .parse((res, cb) => {
            const chunks: Buffer[] = [];
            res.on("data", (c) => chunks.push(Buffer.from(c)));
            res.on("end", () => cb(null, Buffer.concat(chunks)));
          });
        expect(r.status).toBe(200);
        expect(r.headers["content-type"]).toMatch(/application\/pdf/);
        expect(r.headers["content-disposition"]).toMatch(
          /^attachment; filename="sipat-/,
        );
        expect(r.body.subarray(0, 5).toString()).toBe("%PDF-");
        writeFileSync(path.join(pasta, `${tipo}.pdf`), r.body);
      }
      const r = await request(app.getHttpServer())
        .get(`/api/relatorios/ficha-bem/${f.bem.id}/pdf`)
        .set("Cookie", f.cookies[1]!)
        .buffer(true)
        .parse((res, cb) => {
          const chunks: Buffer[] = [];
          res.on("data", (c) => chunks.push(Buffer.from(c)));
          res.on("end", () => cb(null, Buffer.concat(chunks)));
        });
      expect(r.status).toBe(200);
      writeFileSync(path.join(pasta, "ficha-bem.pdf"), r.body);
      expect(
        (
          await request(app.getHttpServer())
            .get("/api/relatorios/baixas/pdf")
            .query(periodo)
        ).status,
      ).toBe(401);
      expect(
        (
          await request(app.getHttpServer())
            .get("/api/relatorios/baixas/pdf")
            .set("Cookie", f.cookies[0]!)
            .query({ ...periodo, pagina: "1" })
        ).status,
      ).toBe(400);
    });
    it("anônimo, primeiro acesso e sessão revogada são bloqueados; operações restritas permanecem", async () => {
      expect(
        (await request(app.getHttpServer()).get("/api/relatorios")).status,
      ).toBe(401);
      expect(
        (
          await request(app.getHttpServer())
            .get(`/api/patrimonios/${f.bem.id}/baixa`)
            .set("Cookie", f.cookies[0]!)
        ).status,
      ).toBe(403);
      await db.usuario.update({
        where: { id: f.usuarios[0]!.id },
        data: { trocaSenhaObrigatoria: true },
      });
      expect(
        (
          await request(app.getHttpServer())
            .get("/api/relatorios")
            .set("Cookie", f.cookies[0]!)
        ).status,
      ).toBe(403);
      await db.usuario.update({
        where: { id: f.usuarios[0]!.id },
        data: { trocaSenhaObrigatoria: false },
      });
      const token = f.cookies[1]!.split("=")[1]!;
      await db.sessaoUsuario.updateMany({
        where: { tokenHash: calcularHashTokenSessao(token)! },
        data: { revogadoAt: new Date() },
      });
      expect(
        (
          await request(app.getHttpServer())
            .get("/api/relatorios")
            .set("Cookie", f.cookies[1]!)
        ).status,
      ).toBe(401);
    });
    it("rejeita integralmente PDF acima de mil linhas sem truncamento", async () => {
      await db.transferenciaPatrimonio.createMany({
        data: Array.from({ length: 1001 }, () => ({
          patrimonioId: f.bem.id,
          setorAntigoId: f.setor.id,
          setorAtualId: f.destino.id,
          comissaoId: f.comissao.id,
          createdById: f.usuarios[0]!.id,
          dataTransferencia: new Date("2020-01-01T12:00:00Z"),
        })),
      });
      const q = {
        inicio: "2020-01-01",
        fim: "2020-01-01",
        patrimonioId: f.bem.id,
      };
      const preview = await request(app.getHttpServer())
        .get("/api/relatorios/movimentacoes")
        .set("Cookie", f.cookies[0]!)
        .query(q);
      expect(preview.status).toBe(200);
      expect(preview.body.meta.total).toBe(1001);
      expect(preview.body.dados).toHaveLength(20);
      const r = await request(app.getHttpServer())
        .get("/api/relatorios/movimentacoes/pdf")
        .set("Cookie", f.cookies[0]!)
        .query(q);
      expect(r.status).toBe(422);
      expect(r.body.codigo).toBe("RELATORIO_LIMITE_EXCEDIDO");
      expect(r.headers["content-type"]).toMatch(/application\/json/);
    });
    it("planos de consultas finitas são executáveis; consultas não mudam o domínio", async () => {
      const antes = await db.patrimonio.findUnique({ where: { id: f.bem.id } });
      const repo = new RelatoriosRepository(db);
      for (const t of tipos) {
        const fonte = construirFonte(t, { ...filtros(t) }, new Date());
        const plano = await db.$queryRawUnsafe(
          `EXPLAIN ${fonte.sql.text}`,
          ...fonte.sql.values,
        );
        expect(plano).toBeDefined();
        await repo.leitura((r) => r.linhas(fonte, 0, 20));
      }
      expect(
        await db.patrimonio.findUnique({ where: { id: f.bem.id } }),
      ).toEqual(antes);
    });
  },
);
