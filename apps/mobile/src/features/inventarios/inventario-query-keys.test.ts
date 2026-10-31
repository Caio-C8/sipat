import { describe, expect, it } from "vitest";
import { inventarioQueryKeys } from "./inventario-query-keys";

describe("inventarioQueryKeys", () => {
  it("normaliza busca e explicita status e paginação", () => {
    expect(inventarioQueryKeys.list("PENDENTE", " 2026 ", 2)).toEqual(
      inventarioQueryKeys.list("PENDENTE", "2026", 2),
    );
    expect(inventarioQueryKeys.list("PENDENTE", "2026", 2)).not.toEqual(
      inventarioQueryKeys.list("EM_ANDAMENTO", "2026", 2),
    );
    expect(inventarioQueryKeys.list("PENDENTE", "2026", 2)).not.toEqual(
      inventarioQueryKeys.list("PENDENTE", "2026", 3),
    );
  });

  it("separa inventário, setor, contexto e item", () => {
    expect(
      inventarioQueryKeys.sectorDetail(
        "inventario-1",
        "setor-1",
        1,
        1,
        "PREVISTO",
      ),
    ).not.toEqual(
      inventarioQueryKeys.sectorDetail(
        "inventario-1",
        "setor-1",
        1,
        1,
        "ENCONTRADO_NO_SETOR",
      ),
    );
    expect(inventarioQueryKeys.item("inventario-1", "item-1")).not.toEqual(
      inventarioQueryKeys.item("inventario-1", "item-2"),
    );
  });
});
