import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { test } from "node:test";
import {
  AtualizarOrcamentoManutencaoBodySchema,
  AnexoObservacaoManutencaoSchema,
  CampoDadosAnexoObservacaoManutencaoSchema,
  CriarManutencaoBodySchema,
  DadosAnexoObservacaoManutencaoSchema,
  ListarManutencoesQuerySchema,
  ManutencaoResumoSchema,
  RegistrarRetornoManutencaoBodySchema,
} from "../../index";

const item = () => ({ patrimonioId: randomUUID(), tipo: "CORRETIVA" });
const pedido = (n = 1) => ({
  chaveIdempotencia: randomUUID(),
  dataEnvio: "2026-10-01",
  comissaoId: randomUUID(),
  itens: Array.from({ length: n }, item),
});

test("criação distingue campos e limita a 50 patrimônios distintos", () => {
  assert.equal(CriarManutencaoBodySchema.safeParse(pedido(1)).success, true);
  assert.equal(CriarManutencaoBodySchema.safeParse(pedido(50)).success, true);
  for (const n of [0, 51])
    assert.equal(CriarManutencaoBodySchema.safeParse(pedido(n)).success, false);
  const base = pedido();
  assert.equal(
    CriarManutencaoBodySchema.safeParse({
      ...base,
      itens: [base.itens[0], base.itens[0]],
    }).success,
    false,
  );
  assert.equal(
    CriarManutencaoBodySchema.safeParse({ ...base, status: "CONCLUIDA" })
      .success,
    false,
  );
  assert.equal(
    CriarManutencaoBodySchema.safeParse({
      ...base,
      itens: [{ ...item(), criadoPorId: randomUUID() }],
    }).success,
    false,
  );
  assert.equal(
    CriarManutencaoBodySchema.safeParse({
      ...base,
      itens: [{ ...item(), fornecedorId: null }],
    }).success,
    true,
  );
  assert.equal(
    CriarManutencaoBodySchema.safeParse({
      ...base,
      itens: [{ ...item(), fornecedorId: "" }],
    }).success,
    false,
  );
});

test("orçamento e retorno exigem valores canônicos e versões válidas", () => {
  const orcamento = {
    versaoEsperada: 0,
    dataOrcamento: "2026-10-02",
    descricaoOrcamento: "Peças",
    valorOrcamento: "0",
  };
  assert.equal(
    AtualizarOrcamentoManutencaoBodySchema.safeParse(orcamento).success,
    true,
  );
  for (const valor of ["-1", "01", "1e3", "1.12345678", 1])
    assert.equal(
      AtualizarOrcamentoManutencaoBodySchema.safeParse({
        ...orcamento,
        valorOrcamento: valor,
      }).success,
      false,
    );
  assert.equal(
    AtualizarOrcamentoManutencaoBodySchema.safeParse({
      ...orcamento,
      versaoEsperada: -1,
    }).success,
    false,
  );
  const retorno = {
    chaveIdempotencia: randomUUID(),
    dataRetorno: "2026-10-03",
    descricaoServicoRealizado: "Conserto",
    valorRealizado: "1.50",
    garantia: null,
  };
  assert.equal(
    RegistrarRetornoManutencaoBodySchema.safeParse(retorno).success,
    true,
  );
  assert.equal(
    RegistrarRetornoManutencaoBodySchema.safeParse({
      ...retorno,
      garantia: undefined,
    }).success,
    false,
  );
  assert.equal(
    RegistrarRetornoManutencaoBodySchema.safeParse({
      ...retorno,
      garantia: { descricao: "90 dias" },
    }).success,
    true,
  );
});

test("anexo da observação aceita somente a chave pública necessária", () => {
  const dados = { chaveIdempotencia: randomUUID() };
  assert.equal(
    DadosAnexoObservacaoManutencaoSchema.safeParse(dados).success,
    true,
  );
  assert.equal(
    DadosAnexoObservacaoManutencaoSchema.safeParse({
      ...dados,
      itemId: randomUUID(),
    }).success,
    false,
  );
  assert.equal(
    CampoDadosAnexoObservacaoManutencaoSchema.safeParse(JSON.stringify(dados))
      .success,
    true,
  );
  assert.equal(
    CampoDadosAnexoObservacaoManutencaoSchema.safeParse("{").success,
    false,
  );
  const anexo = {
    url: `/api/backend/manutencoes/${randomUUID()}/anexo-observacao`,
  };
  assert.equal(AnexoObservacaoManutencaoSchema.safeParse(anexo).success, true);
  assert.equal(
    AnexoObservacaoManutencaoSchema.safeParse({
      ...anexo,
      chave: "uploads/interno.pdf",
    }).success,
    false,
  );
});

test("filtro paginado verifica período inclusivo ordenado", () => {
  assert.deepEqual(ListarManutencoesQuerySchema.parse({}).pagina, 1);
  assert.equal(
    ListarManutencoesQuerySchema.safeParse({
      dataEnvioInicio: "2026-10-03",
      dataEnvioFim: "2026-10-02",
    }).success,
    false,
  );
  assert.equal(
    ListarManutencoesQuerySchema.safeParse({ pagina: "0" }).success,
    false,
  );
});

test("número humano do pedido é uma string decimal positiva", () => {
  const resumo = {
    id: randomUUID(),
    numeroPedido: "42",
    numeroRequisicao: null,
    dataEnvio: "2026-10-01",
    dataRetorno: null,
    status: "EM_ANDAMENTO",
    totalItens: 1,
    itensPendentes: 1,
    itensRetornados: 0,
    temAnexoObservacao: false,
  };
  assert.equal(ManutencaoResumoSchema.safeParse(resumo).success, true);
  for (const numeroPedido of [0, "0", "01", "1.0", "pedido-1"])
    assert.equal(
      ManutencaoResumoSchema.safeParse({ ...resumo, numeroPedido }).success,
      false,
    );
});
