import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { esperaInvalido, parseValido } from "../../contract-assertions";
import {
  ChaveIdempotenciaSchema,
  CODIGOS_CONFLITO_IDEMPOTENCIA,
  CodigoConflitoIdempotenciaSchema,
  MENSAGENS_CONFLITO_IDEMPOTENCIA,
  RespostaConflitoIdempotenciaSchema,
} from "../idempotencia.schema";

const CHAVE = "7041C62B-5F83-432C-A178-889977D839B1";

describe("contratos públicos de idempotência", () => {
  it("normaliza uma chave UUID e rejeita ausência ou formato inválido", () => {
    assert.equal(
      parseValido(ChaveIdempotenciaSchema, CHAVE),
      CHAVE.toLowerCase(),
    );
    esperaInvalido(ChaveIdempotenciaSchema, undefined);
    esperaInvalido(ChaveIdempotenciaSchema, "chave-livre");
  });

  it("publica somente os três códigos de conflito aprovados", () => {
    assert.deepEqual(
      CodigoConflitoIdempotenciaSchema.options,
      CODIGOS_CONFLITO_IDEMPOTENCIA,
    );
    esperaInvalido(
      CodigoConflitoIdempotenciaSchema,
      "MOVIMENTACAO_EM_PROCESSAMENTO",
    );
  });

  for (const codigo of CODIGOS_CONFLITO_IDEMPOTENCIA) {
    it(`exige 409, mensagem estável e campo corrigível para ${codigo}`, () => {
      const mensagem = MENSAGENS_CONFLITO_IDEMPOTENCIA[codigo];
      const resposta = {
        status: 409,
        sucesso: false,
        codigo,
        mensagem,
        erros: [{ campo: "chaveIdempotencia", codigo, mensagem }],
        requisicaoId: "req-123",
      };

      assert.deepEqual(
        parseValido(RespostaConflitoIdempotenciaSchema, resposta),
        resposta,
      );
      assert.equal(
        RespostaConflitoIdempotenciaSchema.safeParse({
          ...resposta,
          erros: [],
        }).success,
        true,
      );
      esperaInvalido(RespostaConflitoIdempotenciaSchema, {
        ...resposta,
        status: 400,
      });
      esperaInvalido(RespostaConflitoIdempotenciaSchema, {
        ...resposta,
        mensagem: "Mensagem variável.",
      });
      esperaInvalido(RespostaConflitoIdempotenciaSchema, {
        ...resposta,
        erros: [{ campo: "chave", codigo, mensagem }],
      });
      esperaInvalido(RespostaConflitoIdempotenciaSchema, {
        ...resposta,
        resultadoAnterior: { id: CHAVE },
      });
    });
  }
});
