import { describe, expect, it } from "vitest";
import { parseHttpError } from "./api-error";

describe("parseHttpError", () => {
  it("preserva código base e dados públicos adicionais", () => {
    const error = parseHttpError(
      409,
      {
        status: 409,
        sucesso: false,
        codigo: "ITEM_INVENTARIO_JA_VERIFICADO",
        mensagem: "Item já verificado.",
        erros: [],
        requisicaoId: "req-1",
        dados: { setor: "Gabinete 01" },
      },
      null,
    );
    expect(error).toMatchObject({
      status: 409,
      code: "ITEM_INVENTARIO_JA_VERIFICADO",
      data: { setor: "Gabinete 01" },
    });
  });
});
