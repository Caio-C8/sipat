import { describe, expect, it } from "vitest";
import { ApiError } from "@/lib/api/core/api-error";
import { detalhesErroEmprestimo } from "./apresentacao";

describe("apresentação de erros de empréstimo", () => {
  it("identifica o bem selecionado sem exibir o caminho técnico da API", () => {
    const erro = new ApiError({
      status: 409,
      codigo: "CRONOLOGIA_PATRIMONIAL_CONFLITANTE",
      mensagem: "Não foi possível registrar o empréstimo.",
      categoria: "http",
      erros: [
        {
          campo: "patrimonioIds.0",
          codigo: "CRONOLOGIA_PATRIMONIAL_CONFLITANTE",
          mensagem: "Confira a data e o histórico do bem.",
        },
      ],
    });

    expect(
      detalhesErroEmprestimo(erro, [
        {
          numeroPatrimonio: "1",
          descricao: "NOTEBOOK CORPORATIVO — UNIDADE DE DEMONSTRAÇÃO 01",
        },
      ]),
    ).toEqual([
      "1 — NOTEBOOK CORPORATIVO — UNIDADE DE DEMONSTRAÇÃO 01: Confira a data e o histórico do bem.",
    ]);
  });

  it("mantém apenas a orientação quando o campo não representa um bem", () => {
    const erro = new ApiError({
      status: 409,
      codigo: "COMISSAO_FORA_DA_VIGENCIA",
      mensagem: "A comissão não está vigente.",
      categoria: "http",
      erros: [
        {
          campo: "comissaoId",
          codigo: "COMISSAO_FORA_DA_VIGENCIA",
          mensagem: "Escolha uma comissão vigente.",
        },
      ],
    });

    expect(detalhesErroEmprestimo(erro, [])).toEqual([
      "Escolha uma comissão vigente.",
    ]);
  });
});
