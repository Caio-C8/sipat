import { test } from "node:test";
import assert from "node:assert/strict";
import {
  queryRelatorio,
  queryPdfRelatorio,
  OpcoesRelatorioQuerySchema,
} from "./queries";
import {
  patrimoniosResumoSchema,
  pendenciasDepreciacaoLinhaSchema,
  pendenciasDepreciacaoResumoSchema,
  EventoFichaSchema,
} from "./responses";

test("relatórios rejeitam filtros desconhecidos, períodos inválidos e excesso de paginação", () => {
  const schema = queryRelatorio("movimentacoes");
  const valido = { inicio: "2026-01-01", fim: "2026-12-31" };
  assert.equal(schema.parse(valido).limite, 20);
  for (const q of [
    { ...valido, tabela: "usuarios" },
    { ...valido, inicio: "2026-02-30" },
    { ...valido, fim: "2027-01-02" },
    { ...valido, fim: "2025-12-31" },
    { ...valido, pagina: "1002", limite: "50" },
    { ...valido, limite: "51" },
    { ...valido, pagina: "9007199254740993" },
  ])
    assert.equal(schema.safeParse(q).success, false);
  assert.equal(
    queryPdfRelatorio("movimentacoes").safeParse({ ...valido, pagina: "1" })
      .success,
    false,
  );
});
test("competências até doze meses e bases enumeradas por domínio", () => {
  const schema = queryRelatorio("depreciacoes");
  assert.equal(
    schema.safeParse({
      competenciaInicio: "2026-01",
      competenciaFim: "2026-12",
    }).success,
    true,
  );
  for (const fim of ["2027-01", "2026-00", "2025-12"])
    assert.equal(
      schema.safeParse({ competenciaInicio: "2026-01", competenciaFim: fim })
        .success,
      false,
    );
  assert.equal(
    queryRelatorio("manutencoes").safeParse({
      inicio: "2026-01-01",
      fim: "2026-01-02",
      base: "REGISTRO",
    }).success,
    false,
  );
  assert.equal(queryRelatorio("inventarios").safeParse({}).success, false);
  assert.equal(
    OpcoesRelatorioQuerySchema.safeParse({ tipo: "sql" }).success,
    false,
  );
  assert.equal(
    queryRelatorio("pendencias-depreciacao").safeParse({
      competencia: "2026-10",
    }).success,
    true,
  );
  assert.equal(
    queryRelatorio("pendencias-depreciacao").safeParse({
      competencia: "2026-13",
    }).success,
    false,
  );
});

test("relatório de pendências expõe apenas estado contábil derivado", () => {
  assert.equal(
    pendenciasDepreciacaoLinhaSchema.safeParse({
      id: "7041c62b-5f83-432c-a178-889977d839b1",
      patrimonioId: "7041c62b-5f83-432c-a178-889977d839b1",
      numeroPatrimonio: "123",
      descricao: "Notebook",
      status: "ATIVO",
      primeiraCompetencia: "2026-01",
      ultimaCompetenciaProcessada: "2026-08",
      competenciaEsperada: "2026-09",
      quantidadePendencias: 2,
      valorLiquidoAtual: "900.0000000",
      valorResidual: "100.0000000",
      quotaPrevista: "10.0000000",
    }).success,
    true,
  );
  assert.equal(
    pendenciasDepreciacaoResumoSchema.safeParse({
      quantidade: 2,
      bensDistintos: 1,
      competenciaMaisAntiga: "2026-09",
      quantidadeCompetencias: 2,
    }).success,
    true,
  );
});
test("lacunas contábeis são nulas, totais têm sete casas sem limite individual", () => {
  assert.equal(
    patrimoniosResumoSchema.safeParse({
      quantidade: 2,
      semNumeroOficial: 1,
      semContabilidade: 1,
      incorporacao: "999999999999999999999.0000000",
      brutoAtual: null,
      acumuladoAtual: null,
      liquidoAtual: null,
    }).success,
    true,
  );
  assert.equal(
    EventoFichaSchema.safeParse({ tipo: "EVENTO_FICTICIO" }).success,
    false,
  );
  assert.equal(
    queryRelatorio("ficha-bem").safeParse({ inicio: "2026-01-01" }).success,
    false,
  );
  assert.deepEqual(
    queryRelatorio("ficha-bem").parse({ busca: "  comissão  " }).busca,
    "comissão",
  );
  assert.equal(
    queryRelatorio("ficha-bem").safeParse({ busca: "a".repeat(201) }).success,
    false,
  );
});
