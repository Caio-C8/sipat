import { describe, expect, it } from "vitest";
import { prepararFiltrosBaixas } from "./filtros";

describe("prepararFiltrosBaixas", () => {
  it("abre a consulta sem filtros para listar todas as baixas", () => {
    expect(prepararFiltrosBaixas({})).toEqual({});
  });

  it("preserva período e filtros compartilháveis informados na URL", () => {
    expect(
      prepararFiltrosBaixas({
        inicio: "2026-10-01",
        fim: "2026-10-31",
        tipo: "FURTO",
        pagina: "2",
        ignorado: ["a", "b"],
      }),
    ).toEqual({
      inicio: "2026-10-01",
      fim: "2026-10-31",
      tipo: "FURTO",
      pagina: "2",
    });
  });

  it("não mascara período parcial inválido", () => {
    expect(prepararFiltrosBaixas({ inicio: "2026-11-01" })).toEqual({
      inicio: "2026-11-01",
    });
  });
});
