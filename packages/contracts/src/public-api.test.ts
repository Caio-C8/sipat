import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  ErroCampoSchema,
  MetaPaginacaoSchema,
  PaginacaoQuerySchema,
  RespostaErroSchema,
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
});
