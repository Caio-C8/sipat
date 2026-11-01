import { test } from "node:test";
import assert from "node:assert/strict";
import {
  queryRelatorio,
  queryPdfRelatorio,
  OpcoesRelatorioQuerySchema,
} from "./queries";
import { patrimoniosResumoSchema, EventoFichaSchema } from "./responses";

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
});
