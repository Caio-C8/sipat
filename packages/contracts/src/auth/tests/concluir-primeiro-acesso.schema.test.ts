import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  esperaInvalido,
  esperaInvalidos,
  parseValido,
} from "../../contract-assertions";
import { ConcluirPrimeiroAcessoBodySchema } from "../concluir-primeiro-acesso.schema";

const novaSenha = "  frase longa segura  ";

describe("ConcluirPrimeiroAcessoBodySchema", () => {
  it("aceita somente a nova senha confirmada e preserva seu valor", () => {
    assert.deepEqual(
      parseValido(ConcluirPrimeiroAcessoBodySchema, {
        novaSenha,
        confirmacaoNovaSenha: novaSenha,
      }),
      { novaSenha, confirmacaoNovaSenha: novaSenha },
    );
  });

  it("rejeita confirmação divergente no campo corrigível", () => {
    esperaInvalido(
      ConcluirPrimeiroAcessoBodySchema,
      {
        novaSenha,
        confirmacaoNovaSenha: "outra frase longa segura",
      },
      "confirmacaoNovaSenha",
    );
  });

  it("rejeita limites inválidos e propriedades extras", () => {
    for (const senha of ["🔐".repeat(14), "🔐".repeat(129)]) {
      esperaInvalidos(ConcluirPrimeiroAcessoBodySchema, [
        { novaSenha: senha, confirmacaoNovaSenha: senha },
      ]);
    }

    esperaInvalido(ConcluirPrimeiroAcessoBodySchema, {
      novaSenha,
      confirmacaoNovaSenha: novaSenha,
      senhaAtual: "senha inicial",
    });
  });
});
