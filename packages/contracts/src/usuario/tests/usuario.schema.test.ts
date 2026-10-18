import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { esperaInvalido, parseValido } from "../../contract-assertions";
import {
  AlterarSituacaoUsuarioSchema,
  AlterarUsuarioSchema,
  CriarUsuarioSchema,
  ListarUsuariosQuerySchema,
  UsuarioDetalheSchema,
  UsuarioParamsSchema,
} from "../index";

const usuarioDetalhe = {
  id: "5c0945b2-7d3c-4b75-8bc6-5b0bf04086ab",
  nome: "Maria da Silva",
  email: "maria@example.com",
  perfil: "ADMINISTRADOR",
  ativo: true,
  createdById: "d4f7ccde-d880-4881-a547-a5c34bf263b2",
  createdAt: "2026-10-17T12:00:00.000Z",
  updatedAt: null,
} as const;

describe("contratos de usuários", () => {
  it("normaliza nome e e-mail na criação sem alterar a senha", () => {
    const senha = "  frase longa segura  ";
    const resultado = parseValido(CriarUsuarioSchema, {
      nome: "  Maria da Silva  ",
      email: "  MARIA@EXAMPLE.COM  ",
      senha,
      perfil: "ADMINISTRADOR",
    });

    assert.equal(resultado.nome, "Maria da Silva");
    assert.equal(resultado.email, "maria@example.com");
    assert.equal(resultado.senha, senha);
  });

  it("aceita espaços e Unicode e conta pontos de código na senha", () => {
    const senha = "🔐".repeat(15);
    assert.equal(
      parseValido(CriarUsuarioSchema, {
        nome: "Usuário",
        email: "usuario@example.com",
        senha,
        perfil: "DIRETOR_PATRIMONIO",
      }).senha,
      senha,
    );

    esperaInvalido(
      CriarUsuarioSchema,
      {
        nome: "Usuário",
        email: "usuario@example.com",
        senha: "🔐".repeat(14),
        perfil: "DIRETOR_PATRIMONIO",
      },
      "senha",
    );
  });

  it("rejeita senha acima do limite e propriedades internas", () => {
    esperaInvalido(
      CriarUsuarioSchema,
      {
        nome: "Usuário",
        email: "usuario@example.com",
        senha: "a".repeat(129),
        perfil: "ADMINISTRADOR",
      },
      "senha",
    );
    esperaInvalido(CriarUsuarioSchema, {
      nome: "Usuário",
      email: "usuario@example.com",
      senha: "a".repeat(15),
      perfil: "ADMINISTRADOR",
      ativo: false,
    });
  });

  it("preserva a semântica de PATCH e exige campo informado", () => {
    esperaInvalido(AlterarUsuarioSchema, {});
    esperaInvalido(AlterarUsuarioSchema, { nome: undefined });
    esperaInvalido(AlterarUsuarioSchema, { nome: "" }, "nome");
    esperaInvalido(AlterarUsuarioSchema, { nome: null }, "nome");
    esperaInvalido(AlterarUsuarioSchema, { ativo: false });

    assert.deepEqual(
      parseValido(AlterarUsuarioSchema, {
        email: " NOVO@EXAMPLE.COM ",
      }),
      { email: "novo@example.com" },
    );
  });

  it("valida params, perfil, situação e paginação finita", () => {
    esperaInvalido(UsuarioParamsSchema, { usuarioId: "invalido" }, "usuarioId");
    esperaInvalido(AlterarSituacaoUsuarioSchema, { ativo: "false" }, "ativo");
    esperaInvalido(ListarUsuariosQuerySchema, { limite: "51" }, "limite");
    esperaInvalido(ListarUsuariosQuerySchema, { perfil: "GESTOR" }, "perfil");

    assert.deepEqual(
      parseValido(ListarUsuariosQuerySchema, {
        busca: "  maria  ",
        ativo: "FALSE",
      }),
      {
        pagina: 1,
        limite: 20,
        busca: "maria",
        ativo: false,
      },
    );
  });

  it("mantém respostas sem senha, hash, sessão ou token", () => {
    assert.deepEqual(
      parseValido(UsuarioDetalheSchema, usuarioDetalhe),
      usuarioDetalhe,
    );

    for (const campo of ["senha", "senhaHash", "sessao", "token"] as const) {
      esperaInvalido(UsuarioDetalheSchema, {
        ...usuarioDetalhe,
        [campo]: "segredo",
      });
    }
  });
});
