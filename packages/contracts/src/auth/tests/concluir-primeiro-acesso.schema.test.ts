import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  esperaInvalido,
  esperaInvalidos,
  parseValido,
} from "../../contract-assertions";
import { ConcluirPrimeiroAcessoBodySchema } from "../concluir-primeiro-acesso.schema";

const novaSenha = "  frase segura 1!  ";

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
        confirmacaoNovaSenha: "outra senha 2@ segura",
      },
      "confirmacaoNovaSenha",
    );
  });

  it("rejeita limites inválidos e propriedades extras", () => {
    for (const senha of ["Aa1!xyz", "Senha123", `A1!${"🔐".repeat(126)}`]) {
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
