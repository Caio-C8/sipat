import { describe, expect, it } from "vitest";
import { patrimonioQueryKeys } from "./patrimonio-query-keys";

describe("patrimonioQueryKeys", () => {
  it("normaliza busca e ordem dos filtros", () => {
    expect(
      patrimonioQueryKeys.list(
        "  notebook  ",
        { setorId: "setor-1", status: "ATIVO" },
        2,
      ),
    ).toEqual(
      patrimonioQueryKeys.list(
        "notebook",
        { status: "ATIVO", setorId: "setor-1" },
        2,
      ),
    );
  });

  it("separa busca, filtros, páginas, detalhes e catálogos", () => {
    const base = patrimonioQueryKeys.list(undefined, {}, 1);
    expect(patrimonioQueryKeys.list("mesa", {}, 1)).not.toEqual(base);
    expect(
      patrimonioQueryKeys.list(undefined, { status: "ATIVO" }, 1),
    ).not.toEqual(base);
    expect(patrimonioQueryKeys.list(undefined, {}, 2)).not.toEqual(base);
    expect(patrimonioQueryKeys.detail("patrimonio-1")).not.toEqual(
      patrimonioQueryKeys.detail("patrimonio-2"),
    );
    expect(patrimonioQueryKeys.catalog("species", 1)).not.toEqual(
      patrimonioQueryKeys.catalog("sectors", 1),
    );
    expect(patrimonioQueryKeys.catalog("species", 1)).not.toEqual(
      patrimonioQueryKeys.catalog("species", 2),
    );
  });
});
