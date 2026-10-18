import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  CABECALHO_CSRF,
  AuthMeResponseSchema,
  AlterarSituacaoUsuarioSchema,
  AlterarUsuarioSchema,
  ConsultarUsuarioResponseSchema,
  CriarUsuarioResponseSchema,
  CriarUsuarioSchema,
  ErroCampoSchema,
  IdentidadeAutenticadaSchema,
  ListarUsuariosQuerySchema,
  ListarUsuariosResponseSchema,
  LoginBodySchema,
  LoginResponseSchema,
  MetaPaginacaoSchema,
  PaginacaoQuerySchema,
  PerfilUsuarioSchema,
  RespostaErroSchema,
  UsuarioDetalheSchema,
  UsuarioParamsSchema,
  UsuarioResumoSchema,
  VALOR_CABECALHO_CSRF,
  criarRespostaSucessoPaginadaSchema,
  criarRespostaSucessoSchema,
} from "./index";

describe("@repo/contracts — API pública", () => {
  it("exporta os schemas genéricos do baseline", () => {
    const schemas = [
      MetaPaginacaoSchema,
      ErroCampoSchema,
      RespostaErroSchema,
      PaginacaoQuerySchema,
    ];

    for (const schema of schemas) {
      assert.equal(typeof schema.safeParse, "function");
    }

    assert.equal(typeof criarRespostaSucessoSchema, "function");
    assert.equal(typeof criarRespostaSucessoPaginadaSchema, "function");
  });

  it("exporta os contratos de identidade e CSRF pelo entrypoint", () => {
    assert.equal(typeof PerfilUsuarioSchema.safeParse, "function");
    assert.equal(typeof IdentidadeAutenticadaSchema.safeParse, "function");
    assert.equal(CABECALHO_CSRF, "X-SIPAT-CSRF");
    assert.equal(VALOR_CABECALHO_CSRF, "1");
  });

  it("exporta os contratos de autenticação pelo entrypoint", () => {
    for (const schema of [
      LoginBodySchema,
      LoginResponseSchema,
      AuthMeResponseSchema,
    ]) {
      assert.equal(typeof schema.safeParse, "function");
    }
  });

  it("exporta os contratos de gestão de usuários pelo entrypoint", () => {
    const schemas = [
      UsuarioParamsSchema,
      ListarUsuariosQuerySchema,
      CriarUsuarioSchema,
      AlterarUsuarioSchema,
      AlterarSituacaoUsuarioSchema,
      UsuarioResumoSchema,
      UsuarioDetalheSchema,
      ListarUsuariosResponseSchema,
      CriarUsuarioResponseSchema,
      ConsultarUsuarioResponseSchema,
    ];

    for (const schema of schemas) {
      assert.equal(typeof schema.safeParse, "function");
    }
  });
});
