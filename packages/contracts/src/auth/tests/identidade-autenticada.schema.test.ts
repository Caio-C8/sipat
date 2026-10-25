import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  esperaInvalido,
  esperaInvalidos,
  parseValido,
} from "../../contract-assertions";
import {
  CABECALHO_CSRF,
  IdentidadeAutenticadaSchema,
  PerfilUsuarioSchema,
  VALOR_CABECALHO_CSRF,
} from "../identidade-autenticada.schema";

describe("PerfilUsuarioSchema", () => {
  it("aceita exatamente os perfis confirmados pelos requisitos", () => {
    assert.equal(
      parseValido(PerfilUsuarioSchema, "ADMINISTRADOR"),
      "ADMINISTRADOR",
    );
    assert.equal(
      parseValido(PerfilUsuarioSchema, "DIRETOR_PATRIMONIO"),
      "DIRETOR_PATRIMONIO",
    );
  });

  it("rejeita perfis desconhecidos e representações aproximadas", () => {
    esperaInvalidos(PerfilUsuarioSchema, [
      "USUARIO",
      "DIRETOR DE PATRIMONIO",
      "administrador",
      "",
      null,
      undefined,
    ]);
  });
});

describe("IdentidadeAutenticadaSchema", () => {
  const identidadeValida = {
    id: "28df5e9c-3e60-4a8e-a4d4-8ca70221f4f0",
    nome: "Maria da Silva",
    email: "maria@example.com",
    perfil: "ADMINISTRADOR",
    trocaSenhaObrigatoria: true,
  } as const;

  it("aceita a identidade mínima e segura", () => {
    assert.deepEqual(
      parseValido(IdentidadeAutenticadaSchema, identidadeValida),
      identidadeValida,
    );
    assert.deepEqual(
      parseValido(IdentidadeAutenticadaSchema, {
        ...identidadeValida,
        trocaSenhaObrigatoria: false,
      }),
      { ...identidadeValida, trocaSenhaObrigatoria: false },
    );
  });

  it("rejeita UUID e e-mail inválidos", () => {
    esperaInvalido(
      IdentidadeAutenticadaSchema,
      { ...identidadeValida, id: "nao-e-uuid" },
      "id",
    );
    esperaInvalido(
      IdentidadeAutenticadaSchema,
      { ...identidadeValida, email: "email-invalido" },
      "email",
    );
  });

  it("rejeita propriedades inesperadas e campos sensíveis", () => {
    for (const campo of [
      "senha",
      "senhaHash",
      "token",
      "cookie",
      "ultimoLoginAt",
      "sessaoId",
    ] as const) {
      esperaInvalido(IdentidadeAutenticadaSchema, {
        ...identidadeValida,
        [campo]: "nao-pode-vazar",
      });
    }
  });

  it("exige um boolean para o estado de primeiro acesso", () => {
    const semEstadoPrimeiroAcesso = {
      id: identidadeValida.id,
      nome: identidadeValida.nome,
      email: identidadeValida.email,
      perfil: identidadeValida.perfil,
    };

    esperaInvalido(
      IdentidadeAutenticadaSchema,
      semEstadoPrimeiroAcesso,
      "trocaSenhaObrigatoria",
    );
    esperaInvalido(
      IdentidadeAutenticadaSchema,
      { ...identidadeValida, trocaSenhaObrigatoria: "true" },
      "trocaSenhaObrigatoria",
    );
  });
});

describe("constantes CSRF", () => {
  it("expõe somente o nome e o valor públicos definidos", () => {
    assert.equal(CABECALHO_CSRF, "X-SIPAT-CSRF");
    assert.equal(VALOR_CABECALHO_CSRF, "1");
  });
});
