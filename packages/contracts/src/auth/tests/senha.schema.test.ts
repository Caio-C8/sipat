import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  esperaInvalido,
  esperaInvalidos,
  parseValido,
} from "../../contract-assertions";
import { AlterarSenhaBodySchema } from "../alterar-senha.schema";
import {
  MENSAGEM_SOLICITACAO_REDEFINICAO_SENHA,
  RedefinirSenhaBodySchema,
  SolicitarRedefinicaoSenhaBodySchema,
  SolicitarRedefinicaoSenhaResponseSchema,
  TokenRedefinicaoSenhaSchema,
} from "../redefinir-senha.schema";
import { SenhaSchema } from "../senha.schema";

const novaSenha = "  frase segura 1!  ";
const tokenValido = "A".repeat(43);

describe("SenhaSchema", () => {
  it("preserva espaços e aceita classes de caracteres Unicode", () => {
    const senhaComEspacos = " Senha 1! ";
    const senhaUnicode = "Árvore٢🔐x";

    assert.equal(parseValido(SenhaSchema, "Senha1!a"), "Senha1!a");
    assert.equal(parseValido(SenhaSchema, senhaComEspacos), senhaComEspacos);
    assert.equal(parseValido(SenhaSchema, senhaUnicode), senhaUnicode);
    assert.equal(
      parseValido(SenhaSchema, `A1!${"🔐".repeat(125)}`),
      `A1!${"🔐".repeat(125)}`,
    );
  });

  it("exige oito pontos de código, letra, número e símbolo", () => {
    esperaInvalidos(SenhaSchema, [
      "Aa1!xyz",
      "1234!678",
      "Senha!aa",
      "Senha123",
      "Senha 12",
      `A1!${"🔐".repeat(126)}`,
      null,
      undefined,
    ]);
  });
});

describe("AlterarSenhaBodySchema", () => {
  it("aceita senha atual sem trim e nova senha confirmada", () => {
    const senhaAtual = " senha atual ";

    assert.deepEqual(
      parseValido(AlterarSenhaBodySchema, {
        senhaAtual,
        novaSenha,
        confirmacaoNovaSenha: novaSenha,
      }),
      { senhaAtual, novaSenha, confirmacaoNovaSenha: novaSenha },
    );
  });

  it("rejeita senha atual inválida, confirmação divergente e propriedades extras", () => {
    esperaInvalido(
      AlterarSenhaBodySchema,
      {
        senhaAtual: "senha atual",
        novaSenha,
        confirmacaoNovaSenha: "outra senha 2@ segura",
      },
      "confirmacaoNovaSenha",
    );
    esperaInvalido(
      AlterarSenhaBodySchema,
      {
        senhaAtual: "",
        novaSenha,
        confirmacaoNovaSenha: novaSenha,
      },
      "senhaAtual",
    );
    esperaInvalido(AlterarSenhaBodySchema, {
      senhaAtual: "senha atual",
      novaSenha,
      confirmacaoNovaSenha: novaSenha,
      usuarioId: "5c0945b2-7d3c-4b75-8bc6-5b0bf04086ab",
    });
  });
});

describe("SolicitarRedefinicaoSenhaBodySchema", () => {
  it("normaliza o e-mail com a mesma regra do cadastro", () => {
    assert.deepEqual(
      parseValido(SolicitarRedefinicaoSenhaBodySchema, {
        email: "  MARIA@EXAMPLE.COM  ",
      }),
      { email: "maria@example.com" },
    );
  });

  it("rejeita e-mail inválido e propriedades extras", () => {
    esperaInvalido(
      SolicitarRedefinicaoSenhaBodySchema,
      { email: "invalido" },
      "email",
    );
    esperaInvalido(SolicitarRedefinicaoSenhaBodySchema, {
      email: "maria@example.com",
      ativo: true,
    });
  });
});

describe("RedefinirSenhaBodySchema", () => {
  it("aceita somente token Base64url canônico de 32 bytes", () => {
    assert.equal(
      parseValido(TokenRedefinicaoSenhaSchema, tokenValido),
      tokenValido,
    );
    for (const caractereFinal of "AEIMQUYcgkosw048") {
      const tokenCanonico = `${"A".repeat(42)}${caractereFinal}`;
      assert.equal(
        parseValido(TokenRedefinicaoSenhaSchema, tokenCanonico),
        tokenCanonico,
      );
    }

    esperaInvalidos(TokenRedefinicaoSenhaSchema, [
      "A".repeat(42),
      "A".repeat(44),
      `${"A".repeat(42)}=`,
      `${"A".repeat(42)}+`,
      `${"A".repeat(42)}/`,
      `${"A".repeat(42)}B`,
      null,
      undefined,
    ]);
  });

  it("preserva a senha e rejeita confirmação divergente e propriedades extras", () => {
    assert.deepEqual(
      parseValido(RedefinirSenhaBodySchema, {
        token: tokenValido,
        novaSenha,
        confirmacaoNovaSenha: novaSenha,
      }),
      {
        token: tokenValido,
        novaSenha,
        confirmacaoNovaSenha: novaSenha,
      },
    );

    esperaInvalido(
      RedefinirSenhaBodySchema,
      {
        token: tokenValido,
        novaSenha,
        confirmacaoNovaSenha: "outra senha 2@ segura",
      },
      "confirmacaoNovaSenha",
    );
    esperaInvalido(RedefinirSenhaBodySchema, {
      token: tokenValido,
      novaSenha,
      confirmacaoNovaSenha: novaSenha,
      email: "maria@example.com",
    });
  });
});

describe("SolicitarRedefinicaoSenhaResponseSchema", () => {
  const resposta = {
    status: 202,
    sucesso: true,
    mensagem: MENSAGEM_SOLICITACAO_REDEFINICAO_SENHA,
  } as const;

  it("aceita uma única response neutra", () => {
    assert.deepEqual(
      parseValido(SolicitarRedefinicaoSenhaResponseSchema, resposta),
      resposta,
    );
    esperaInvalido(SolicitarRedefinicaoSenhaResponseSchema, {
      ...resposta,
      status: 200,
    });
    esperaInvalido(SolicitarRedefinicaoSenhaResponseSchema, {
      ...resposta,
      mensagem: "E-mail enviado.",
    });
  });

  it("rejeita dados da conta e campos sensíveis", () => {
    for (const campo of [
      "email",
      "ativo",
      "senha",
      "senhaHash",
      "token",
      "dados",
    ] as const) {
      esperaInvalido(SolicitarRedefinicaoSenhaResponseSchema, {
        ...resposta,
        [campo]: "segredo",
      });
    }
  });
});
