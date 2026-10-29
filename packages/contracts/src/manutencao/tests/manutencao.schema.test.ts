import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { test } from "node:test";
import {
  AtualizarOrcamentoManutencaoBodySchema,
  CampoDadosDocumentoManutencaoSchema,
  CriarManutencaoBodySchema,
  DadosDocumentoManutencaoSchema,
  DocumentoManutencaoSchema,
  ListarManutencoesQuerySchema,
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

test("documento exige fase e relação coerentes, sem aceitar chaves internas na resposta", () => {
  const dados = { chaveIdempotencia: randomUUID(), fase: "PEDIDO" };
  assert.equal(DadosDocumentoManutencaoSchema.safeParse(dados).success, true);
  assert.equal(
    DadosDocumentoManutencaoSchema.safeParse({ ...dados, itemId: randomUUID() })
      .success,
    false,
  );
  assert.equal(
    DadosDocumentoManutencaoSchema.safeParse({ ...dados, fase: "ENVIO" })
      .success,
    false,
  );
  assert.equal(
    CampoDadosDocumentoManutencaoSchema.safeParse(
      JSON.stringify({ ...dados, fase: "ENVIO", itemId: randomUUID() }),
    ).success,
    true,
  );
  assert.equal(
    CampoDadosDocumentoManutencaoSchema.safeParse("{").success,
    false,
  );
  const doc = {
    id: randomUUID(),
    fase: "PEDIDO",
    itemId: null,
    tamanhoBytes: 100,
    nome: "Documento.pdf",
    criadoEm: "2026-10-03T12:00:00.000Z",
    url: `/api/backend/manutencoes/${randomUUID()}/documentos/${randomUUID()}`,
  };
  assert.equal(DocumentoManutencaoSchema.safeParse(doc).success, true);
  assert.equal(
    DocumentoManutencaoSchema.safeParse({
      ...doc,
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
