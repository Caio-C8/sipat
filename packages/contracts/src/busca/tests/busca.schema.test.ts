import assert from "node:assert/strict";
import test from "node:test";
import {
  BuscaGlobalQuerySchema,
  BuscaGlobalResponseSchema,
  DominioBuscaGlobalSchema,
  DominiosBuscaGlobal,
} from "../index";

test("normaliza termo e limita cada grupo a no máximo cinco resultados", () => {
  assert.deepEqual(BuscaGlobalQuerySchema.parse({ termo: "  mesa  " }), {
    termo: "mesa",
    limite: 5,
  });
  assert.equal(
    BuscaGlobalQuerySchema.safeParse({ termo: "a", limite: 6 }).success,
    false,
  );
});

test("exige os quinze grupos e rejeita campos internos na resposta", () => {
  const grupos = DominiosBuscaGlobal.map((dominio) => ({
    dominio,
    rotulo: dominio,
    total: 0,
    truncado: false,
    verTodosDestino: null,
    itens: [],
  }));
  const resposta = {
    status: 200,
    sucesso: true,
    mensagem: "Busca concluída.",
    dados: { termo: "mesa", grupos },
  };

  assert.equal(BuscaGlobalResponseSchema.safeParse(resposta).success, true);
  assert.equal(
    BuscaGlobalResponseSchema.safeParse({
      ...resposta,
      dados: { ...resposta.dados, segredo: "não permitido" },
    }).success,
    false,
  );
  assert.equal(DominioBuscaGlobalSchema.safeParse("USUARIOS").success, false);
});
