import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  CABECALHO_CSRF,
  ErroCampoSchema,
  IdentidadeAutenticadaSchema,
  MetaPaginacaoSchema,
  PaginacaoQuerySchema,
  PerfilUsuarioSchema,
  RespostaErroSchema,
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
});
