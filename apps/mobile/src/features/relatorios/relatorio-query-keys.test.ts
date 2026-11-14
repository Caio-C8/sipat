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
});
