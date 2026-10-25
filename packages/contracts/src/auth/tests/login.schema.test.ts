import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  esperaInvalido,
  esperaInvalidos,
  parseValido,
} from "../../contract-assertions";
import {
  AuthMeResponseSchema,
  LoginBodySchema,
  LoginResponseSchema,
  SenhaLoginSchema,
} from "../login.schema";

const identidade = {
  id: "28df5e9c-3e60-4a8e-a4d4-8ca70221f4f0",
  nome: "Maria da Silva",
  email: "maria@example.com",
  perfil: "ADMINISTRADOR",
  trocaSenhaObrigatoria: true,
} as const;

describe("LoginBodySchema", () => {
  it("normaliza o e-mail exatamente como o cadastro", () => {
    assert.deepEqual(
      parseValido(LoginBodySchema, {
        email: "  MARIA@EXAMPLE.COM  ",
        senha: " senha preservada ",
      }),
      {
        email: "maria@example.com",
        senha: " senha preservada ",
      },
    );
  });

  it("rejeita e-mail, senha e propriedades fora do contrato", () => {
    esperaInvalido(
      LoginBodySchema,
      { email: "invalido", senha: "senha" },
      "email",
    );
    esperaInvalidos(SenhaLoginSchema, ["", "a".repeat(129), null, undefined]);
    esperaInvalido(LoginBodySchema, {
      email: "maria@example.com",
      senha: "senha",
      perfil: "ADMINISTRADOR",
    });
  });
});

describe("responses de autenticação", () => {
  const resposta = {
    status: 200,
    sucesso: true,
    mensagem: "Autenticação realizada com sucesso.",
    dados: identidade,
  } as const;

  it("aceita somente a identidade segura no login e em /auth/me", () => {
    assert.deepEqual(parseValido(LoginResponseSchema, resposta), resposta);
    assert.deepEqual(parseValido(AuthMeResponseSchema, resposta), resposta);
  });

  it("rejeita segredos e campos internos nas respostas", () => {
    for (const campo of [
      "senha",
      "senhaHash",
      "token",
      "cookie",
      "ultimoLoginAt",
      "sessaoId",
    ] as const) {
      esperaInvalido(LoginResponseSchema, {
        ...resposta,
        dados: { ...identidade, [campo]: "segredo" },
      });
      esperaInvalido(AuthMeResponseSchema, {
        ...resposta,
        dados: { ...identidade, [campo]: "segredo" },
      });
    }
  });
});
