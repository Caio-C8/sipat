import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  CriarReavaliacaoBodySchema,
  ListarReavaliacoesQuerySchema,
  PreviaReavaliacaoBodySchema,
} from "../reavaliacao.schema";

const id1 = "11111111-1111-4111-8111-111111111111";
const id2 = "22222222-2222-4222-8222-222222222222";
const base = {
  dataReferencia: "2026-10-29",
  comissaoId: id2,
  itens: [
    {
      patrimonioId: id1,
      valorReavaliado: "1200.0000001",
      vidaUtilNovaMeses: 60,
      residual: { tipo: "PERCENTUAL", percentual: "12.50" },
    },
  ],
};

describe("contratos de reavaliação", () => {
  it("aceita os dois tipos de residual e normaliza UUID", () => {
    assert.equal(PreviaReavaliacaoBodySchema.safeParse(base).success, true);
    const emReais = {
      ...base,
      itens: [
        {
          ...base.itens[0],
          residual: { tipo: "VALOR", valor: "100.0000000" },
        },
      ],
    };
    assert.equal(PreviaReavaliacaoBodySchema.safeParse(emReais).success, true);
  });

  it("aceita confirmação explícita somente com valor verdadeiro", () => {
    assert.equal(
      PreviaReavaliacaoBodySchema.safeParse({
        ...base,
        itens: [{ ...base.itens[0], definirPrimeiroParametro: true }],
      }).success,
      true,
    );
    assert.equal(
      PreviaReavaliacaoBodySchema.safeParse({
        ...base,
        itens: [{ ...base.itens[0], definirPrimeiroParametro: false }],
      }).success,
      false,
    );
  });

  it("rejeita duplicatas, extras, ambos os residuais e limites monetários", () => {
    const invalidos = [
      { ...base, itens: [base.itens[0], base.itens[0]] },
      { ...base, inesperado: true },
      {
        ...base,
        itens: [
          {
            ...base.itens[0],
            residual: { tipo: "VALOR", valor: "100", percentual: "10" },
          },
        ],
      },
      { ...base, itens: [{ ...base.itens[0], valorReavaliado: "1.12345678" }] },
      { ...base, itens: [{ ...base.itens[0], vidaUtilNovaMeses: 1201 }] },
      {
        ...base,
        itens: [
          {
            ...base.itens[0],
            residual: { tipo: "PERCENTUAL", percentual: "100.01" },
          },
        ],
      },
      { ...base, dataReferencia: "2026-02-30" },
      { ...base, itens: [] },
      { ...base, itens: Array.from({ length: 21 }, () => base.itens[0]) },
    ];
    for (const invalido of invalidos) {
      assert.equal(
        PreviaReavaliacaoBodySchema.safeParse(invalido).success,
        false,
      );
    }
  });

  it("exige versão e chave válidas na confirmação", () => {
    assert.equal(CriarReavaliacaoBodySchema.safeParse(base).success, false);
    assert.equal(
      CriarReavaliacaoBodySchema.safeParse({
        ...base,
        versaoPrevia: "a".repeat(64),
        chaveIdempotencia: id2,
      }).success,
      true,
    );
  });

  it("limita paginação e intervalo dos filtros", () => {
    assert.equal(ListarReavaliacoesQuerySchema.safeParse({}).success, true);
    assert.equal(
      ListarReavaliacoesQuerySchema.safeParse({ limite: "51" }).success,
      false,
    );
    assert.equal(
      ListarReavaliacoesQuerySchema.safeParse({
        dataInicio: "2026-10-30",
        dataFim: "2026-10-29",
      }).success,
      false,
    );
  });
});
