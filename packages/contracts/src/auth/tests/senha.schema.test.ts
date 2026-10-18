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

const novaSenha = "  frase longa segura  ";
const tokenValido = "A".repeat(43);

describe("SenhaSchema", () => {
  it("preserva espaços e conta limites em pontos de código Unicode", () => {
    const senhaComEspacos = " ".repeat(15);
    const senhaUnicode = "🔐".repeat(15);

    assert.equal(parseValido(SenhaSchema, senhaComEspacos), senhaComEspacos);
    assert.equal(parseValido(SenhaSchema, senhaUnicode), senhaUnicode);
    assert.equal(parseValido(SenhaSchema, "🔐".repeat(128)), "🔐".repeat(128));
    esperaInvalidos(SenhaSchema, [
      "🔐".repeat(14),
      "🔐".repeat(129),
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
        confirmacaoNovaSenha: "outra frase longa segura",
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
        confirmacaoNovaSenha: "outra frase longa segura",
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
