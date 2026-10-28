import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { test } from "node:test";
import {
  CriarMovimentacaoBodySchema,
  ListarMovimentacoesQuerySchema,
  ListarOpcoesMovimentacaoQuerySchema,
  MovimentacaoDetalheSchema,
  CriarMovimentacaoResponseSchema,
} from "../movimentacao.schema";
import {
  RespostaErroSchema,
  CriarMovimentacaoBodySchema as Exportado,
} from "../../index";
const item = () => ({
  patrimonioId: randomUUID(),
  setorOrigemEsperadoId: randomUUID(),
  setorDestinoId: randomUUID(),
});
const body = (quantidade = 1) => ({
  chaveIdempotencia: randomUUID(),
  comissaoId: randomUUID(),
  observacao: "  Mudança de sala  ",
  itens: Array.from({ length: quantidade }, item),
});
test("aceita 1/10, normaliza motivo e rejeita 0/11, UUIDs e campos proibidos", () => {
  for (const n of [1, 10])
    assert.equal(Exportado.parse(body(n)).observacao, "Mudança de sala");
  for (const n of [0, 11])
    assert.equal(CriarMovimentacaoBodySchema.safeParse(body(n)).success, false);
  for (const observacao of [undefined, null, "", "   ", "x".repeat(2001)])
    assert.equal(
      CriarMovimentacaoBodySchema.safeParse({ ...body(), observacao }).success,
      false,
    );
  for (const campo of [
    "dataTransferencia",
    "createdById",
    "status",
    "lote",
    "codigo",
    "origemRegistro",
    "id",
    "createdAt",
  ])
    assert.equal(
      CriarMovimentacaoBodySchema.safeParse({ ...body(), [campo]: "proibido" })
        .success,
      false,
    );
  for (const campo of [
    "patrimonioId",
    "setorOrigemEsperadoId",
    "setorDestinoId",
  ])
    assert.equal(
      CriarMovimentacaoBodySchema.safeParse({
        ...body(),
        itens: [{ ...item(), [campo]: "invalido" }],
      }).success,
      false,
    );
  for (const campo of ["chaveIdempotencia", "comissaoId"])
    assert.equal(
      CriarMovimentacaoBodySchema.safeParse({ ...body(), [campo]: "invalido" })
        .success,
      false,
    );
  assert.equal(
    CriarMovimentacaoBodySchema.safeParse({
      ...body(),
      itens: [{ ...item(), usuarioId: randomUUID() }],
    }).success,
    false,
  );
});
test("duplicidade e destino igual apontam índices públicos originais", () => {
  const original = item();
  const resposta = CriarMovimentacaoBodySchema.safeParse({
    ...body(),
    itens: [
      original,
      { ...original, setorDestinoId: original.setorOrigemEsperadoId },
    ],
  });
  assert.equal(resposta.success, false);
  if (!resposta.success)
    assert.deepEqual(
      resposta.error.issues.map((x) => x.path),
      [
        ["itens", 1, "patrimonioId"],
        ["itens", 1, "setorDestinoId"],
      ],
    );
});
test("consulta combina filtros, paginação 20/50 e dias civis com extremos independentes", () => {
  assert.deepEqual(ListarMovimentacoesQuerySchema.parse({}), {
    pagina: 1,
    limite: 20,
  });
  assert.equal(
    ListarMovimentacoesQuerySchema.parse({
      limite: "50",
      busca: " mesa ",
      comissaoId: randomUUID(),
      dataInicio: "2026-10-28",
      dataFim: "2026-10-28",
    }).busca,
    "mesa",
  );
  for (const query of [
    { limite: "51" },
    { pagina: true },
    { dataInicio: "2026-02-30" },
    { dataFim: "28/10/2026" },
    { dataInicio: "2026-10-29", dataFim: "2026-10-28" },
    { busca: " " },
    { orderBy: "nome" },
  ])
    assert.equal(
      ListarMovimentacoesQuerySchema.safeParse(query).success,
      false,
    );
  for (const query of [{ dataInicio: "2026-10-28" }, { dataFim: "2026-10-28" }])
    assert.equal(ListarMovimentacoesQuerySchema.safeParse(query).success, true);
});
test("auxiliares exigem contexto e não aceitam filtros administrativos", () => {
  for (const contexto of ["REGISTRO", "FILTRO"])
    assert.equal(
      ListarOpcoesMovimentacaoQuerySchema.safeParse({ contexto, busca: " a " })
        .success,
      true,
    );
  for (const query of [
    {},
    { contexto: "ADMIN" },
    { contexto: "FILTRO", ativo: "true" },
  ])
    assert.equal(
      ListarOpcoesMovimentacaoQuerySchema.safeParse(query).success,
      false,
    );
});
test("responses individuais preservam histórico nulo e vínculo de correção, sem vazamentos", () => {
  const relacionado = { id: randomUUID(), nome: "Setor" };
  const comum = {
    id: randomUUID(),
    patrimonio: {
      id: randomUUID(),
      numeroPatrimonio: "1",
      tipoNumeroPatrimonial: "OFICIAL",
      descricao: "Mesa",
    },
    setorOrigem: relacionado,
    setorDestino: relacionado,
    comissao: relacionado,
    dataTransferencia: "2026-10-28T03:00:00.000Z",
    origemRegistro: "COMUM",
    observacao: null,
    createdAt: "2026-10-28T03:00:00.000Z",
    registradoPor: relacionado,
    correcaoInventario: null,
  };
  assert.equal(MovimentacaoDetalheSchema.safeParse(comum).success, true);
  assert.equal(
    MovimentacaoDetalheSchema.safeParse({
      ...comum,
      observacao: "  motivo antigo  ",
    }).success,
    true,
  );
  assert.equal(
    MovimentacaoDetalheSchema.parse({
      ...comum,
      observacao: "  motivo antigo  ",
    }).observacao,
    "  motivo antigo  ",
  );
  assert.equal(
    MovimentacaoDetalheSchema.safeParse({
      ...comum,
      origemRegistro: "CORRECAO_INVENTARIO",
      correcaoInventario: {
        inventarioId: randomUUID(),
        itemInventarioId: randomUUID(),
      },
    }).success,
    true,
  );
  assert.equal(
    MovimentacaoDetalheSchema.safeParse({
      ...comum,
      origemRegistro: "CORRECAO_INVENTARIO",
    }).success,
    false,
  );
  assert.equal(
    MovimentacaoDetalheSchema.safeParse({ ...comum, senha: "segredo" }).success,
    false,
  );
  assert.equal(
    CriarMovimentacaoResponseSchema.safeParse({
      status: 201,
      sucesso: true,
      mensagem: "Registradas",
      dados: [comum, { ...comum, id: randomUUID() }],
    }).success,
    true,
  );
  assert.equal(
    RespostaErroSchema.safeParse({
      status: 409,
      sucesso: false,
      codigo: "MOVIMENTACAO_IMPEDIDA",
      mensagem: "Revise os itens",
      erros: [
        {
          campo: "itens.0.setorDestinoId",
          codigo: "DESTINO_INATIVO",
          mensagem: "Escolha outro destino",
        },
      ],
      requisicaoId: randomUUID(),
    }).success,
    true,
  );
});

test("UUIDs equivalentes não permitem duplicidade ou destino igual por variação de caixa", () => {
  const original = {
    ...item(),
    patrimonioId: "aabbccdd-aaaa-4aaa-8aaa-aabbccddeeff",
    setorOrigemEsperadoId: "11223344-aaaa-4aaa-8aaa-aabbccddeeff",
  };
  const duplicado = CriarMovimentacaoBodySchema.safeParse({
    ...body(),
    itens: [
      original,
      { ...original, patrimonioId: original.patrimonioId.toUpperCase() },
    ],
  });
  assert.equal(duplicado.success, false);
  const igual = CriarMovimentacaoBodySchema.safeParse({
    ...body(),
    itens: [
      {
        ...original,
        setorDestinoId: original.setorOrigemEsperadoId.toUpperCase(),
      },
    ],
  });
  assert.equal(igual.success, false);
  assert.equal(
    CriarMovimentacaoBodySchema.parse({
      ...body(),
      itens: [
        { ...original, patrimonioId: original.patrimonioId.toUpperCase() },
      ],
    }).itens[0]?.patrimonioId,
    original.patrimonioId,
  );
});
