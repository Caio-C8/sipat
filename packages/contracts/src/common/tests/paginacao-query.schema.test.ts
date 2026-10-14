import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { esperaInvalidos, parseValido } from "../../contract-assertions";
import { PaginacaoQuerySchema } from "../paginacao-query.schema";

describe("PaginacaoQuerySchema", () => {
  it("aplica os valores padrão", () => {
    assert.deepEqual(parseValido(PaginacaoQuerySchema, {}), {
      pagina: 1,
      limite: 20,
    });
  });

  it("converte strings numéricas e aceita os limites", () => {
    assert.deepEqual(
      parseValido(PaginacaoQuerySchema, {
        pagina: "01",
        limite: "50",
      }),
      {
        pagina: 1,
        limite: 50,
      },
    );
  });

  it("rejeita representações e limites inválidos", () => {
    esperaInvalidos(PaginacaoQuerySchema, [
      { pagina: "0" },
      { pagina: "-1" },
      { pagina: "1.5" },
      { pagina: "1e2" },
      { pagina: "0x10" },
      { pagina: "" },
      { pagina: " " },
      { pagina: true },
      { pagina: 1 },
      { pagina: null },
      { pagina: [] },
      { pagina: "9".repeat(20) },
      { limite: "0" },
      { limite: "51" },
      { limite: "1.5" },
      { limite: "" },
      { limite: true },
      { limite: 1 },
      { limite: null },
    ]);
  });

  it("rejeita propriedades desconhecidas", () => {
    esperaInvalidos(PaginacaoQuerySchema, [
      {
        pagina: "1",
        limite: "20",
        outroCampo: "valor",
      },
    ]);
  });
});
