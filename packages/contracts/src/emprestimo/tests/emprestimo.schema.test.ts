import assert from "node:assert/strict";
import { test } from "node:test";
import {
  CriarEmprestimoBodySchema,
  RegistrarDevolucaoEmprestimoBodySchema,
  ListarEmprestimosQuerySchema,
  EmprestimoDetalheSchema,
} from "../emprestimo.schema";

const a = "a0000000-0000-4000-8000-000000000001";
const b = "a0000000-0000-4000-8000-000000000002";
const base = {
  chaveIdempotencia: "a0000000-0000-4000-8000-000000000003",
  modoAgrupamento: "EM_GRUPO",
  patrimonioIds: [a],
  destinatario: "Pessoa externa",
  finalidade: "Uso temporário",
  dataEmprestimo: "2026-10-01",
  dataPrevistaDevolucao: "2026-10-31",
  comissaoId: b,
};

test("aceita um bem com modo explícito e destinatário pessoa ou instituição", () => {
  assert.equal(CriarEmprestimoBodySchema.safeParse(base).success, true);
  assert.equal(
    CriarEmprestimoBodySchema.safeParse({
      ...base,
      modoAgrupamento: "SEPARADAMENTE",
      destinatario: "Instituição externa",
    }).success,
    true,
  );
  assert.equal(
    CriarEmprestimoBodySchema.safeParse({ ...base, modoAgrupamento: undefined })
      .success,
    false,
  );
});
test("recusa campos obrigatórios, repetição e sequência inválida", () => {
  for (const payload of [
    { ...base, finalidade: " " },
    { ...base, destinatario: " " },
    { ...base, patrimonioIds: [a, a] },
    {
      ...base,
      patrimonioIds: Array.from(
        { length: 51 },
        (_, i) => `a0000000-0000-4000-8000-${String(i).padStart(12, "0")}`,
      ),
    },
    { ...base, dataPrevistaDevolucao: "2026-09-30" },
    { ...base, criadoPorId: b },
  ])
    assert.equal(CriarEmprestimoBodySchema.safeParse(payload).success, false);
});
test("devolução parcial valida duplicidade", () => {
  const dados = {
    chaveIdempotencia: b,
    emprestimoIds: [a],
    dataDevolucao: "2026-10-02",
    comissaoId: b,
  };
  assert.equal(
    RegistrarDevolucaoEmprestimoBodySchema.safeParse(dados).success,
    true,
  );
  assert.equal(
    RegistrarDevolucaoEmprestimoBodySchema.safeParse({
      ...dados,
      emprestimoIds: [a, a],
    }).success,
    false,
  );
  assert.equal(
    RegistrarDevolucaoEmprestimoBodySchema.safeParse({
      ...dados,
      emprestimoIds: [],
    }).success,
    false,
  );
});
test("filtros paginados não aceitam booleano ou período inválido", () => {
  assert.deepEqual(ListarEmprestimosQuerySchema.parse({}).pagina, 1);
  assert.equal(
    ListarEmprestimosQuerySchema.parse({ somenteAtrasados: "false" })
      .somenteAtrasados,
    false,
  );
  assert.equal(
    ListarEmprestimosQuerySchema.safeParse({ somenteAtrasados: "sim" }).success,
    false,
  );
  assert.equal(
    ListarEmprestimosQuerySchema.safeParse({
      dataInicio: "2026-10-02",
      dataFim: "2026-10-01",
    }).success,
    false,
  );
});
test("detalhe aceita legado sem modo e campos opcionais antigos nulos", () => {
  const item = {
    id: a,
    patrimonio: { id: b, numeroPatrimonio: "123", descricao: "Bem" },
    setorVinculo: { id: a, nome: "Setor" },
    pendente: true,
    devolucao: null,
  };
  const detalhe = {
    id: a,
    modoAgrupamento: null,
    destinatario: null,
    dataEmprestimo: "2026-10-01T00:00:00.000Z",
    dataPrevistaDevolucao: null,
    total: 1,
    pendentes: 1,
    situacao: "EM_ANDAMENTO",
    emAtraso: false,
    createdAt: "2026-10-01T10:00:00.000Z",
    finalidade: null,
    observacao: null,
    comissao: { id: b, nome: "Comissão" },
    registradoPor: { id: a, nome: "Diretor" },
    itens: [item],
  };
  assert.equal(EmprestimoDetalheSchema.safeParse(detalhe).success, true);
});
