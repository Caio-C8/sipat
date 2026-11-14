import { describe, expect, it } from "vitest";
import { relatorioQueryKeys } from "./relatorio-query-keys";

describe("relatorioQueryKeys", () => {
  it("mantém o catálogo em uma família determinística sem identidade", () => {
    expect(relatorioQueryKeys.all).toEqual(["relatorios"]);
    expect(relatorioQueryKeys.catalogs()).toEqual(["relatorios", "catalog"]);
    expect(relatorioQueryKeys.catalog()).toEqual([
      "relatorios",
      "catalog",
      "tipos",
    ]);
  });

  it("isola prévias por tipo, filtros canônicos, página e patrimônio", () => {
    expect(
      relatorioQueryKeys.preview(
        "ficha-bem",
        { pagina: 2, limite: 20, evento: "BAIXA" },
        "00000000-0000-4000-8000-000000000001",
      ),
    ).toEqual([
      "relatorios",
      "previa",
      "ficha-bem",
      "00000000-0000-4000-8000-000000000001",
      { pagina: 2, limite: 20, evento: "BAIXA" },
    ]);
  });
});
