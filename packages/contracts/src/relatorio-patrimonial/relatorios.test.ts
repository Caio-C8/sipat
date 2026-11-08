import { test } from "node:test";
import assert from "node:assert/strict";
import {
  queryRelatorio,
  queryPdfRelatorio,
  OpcoesRelatorioQuerySchema,
} from "./queries";
import {
  patrimoniosResumoSchema,
  EventoFichaSchema,
  pendenciasDepreciacaoLinhaSchema,
  respostasTabulares,
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

test("pendências de depreciação têm filtros finitos e response própria", () => {
  const schema = queryRelatorio("pendencias-depreciacao");
  assert.deepEqual(schema.parse({ competencia: "2026-10" }), {
    competencia: "2026-10",
    pagina: 1,
    limite: 20,
  });
  for (const query of [
    { competencia: "2026-1" },
    { competencia: "2026-10", comissaoId: "invalido" },
    { competencia: "2026-10", limite: "51" },
  ]) {
    assert.equal(schema.safeParse(query).success, false);
  }

  const linha = {
    patrimonioId: "7041c62b-5f83-432c-a178-889977d839b1",
    competencia: "2026-10",
    numeroPatrimonio: "123",
    descricao: "Notebook",
    especie: "Computador",
    setor: "Tecnologia",
    dataDisponivelUso: "2026-01-15",
    primeiraCompetencia: "2026-02",
    proximaCompetenciaDevida: "2026-10",
    quotaPrevista: "100.0000000",
  } as const;
  assert.deepEqual(pendenciasDepreciacaoLinhaSchema.parse(linha), linha);
  assert.equal(
    pendenciasDepreciacaoLinhaSchema.safeParse({
      ...linha,
      competencia: "2026-13",
    }).success,
    false,
  );

  assert.equal(
    respostasTabulares["pendencias-depreciacao"].safeParse({
      status: 200,
      sucesso: true,
      mensagem: "Pendências consultadas.",
      tipo: "pendencias-depreciacao",
      dados: [linha],
      resumo: {
        quantidadeBens: 1,
        quantidadeCompetencias: 1,
        competenciaMaisAntiga: "2026-10",
        referenciaEm: "2026-10-27T15:30:00.000Z",
      },
      meta: { total: 1, pagina: 1, ultimaPagina: 1, limite: 20 },
      consulta: {
        id: "36db147d-0f25-4da4-8ab2-45e1c038d85a",
        instante: "2026-10-27T15:30:00.000Z",
        filtros: { competencia: "2026-10" },
        criterioTemporal: "Competência devida",
        ordenacao: "Competência e patrimônio",
        avisos: [],
        excluidosDataDesconhecida: 0,
      },
    }).success,
    true,
  );
});
