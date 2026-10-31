import type { PatrimonioFilters } from "./use-patrimonios";

function normalizedText(value: string | undefined) {
  const normalized = value?.trim();
  return normalized || undefined;
}

export function normalizePatrimonioFilters(filters: PatrimonioFilters) {
  return {
    status: filters.status,
    setorId: filters.setorId,
    especieId: filters.especieId,
    naturezaId: filters.naturezaId,
    tipoNumeroPatrimonial: filters.tipoNumeroPatrimonial,
  } as const;
}

export const patrimonioQueryKeys = {
  all: ["patrimonios"] as const,
  lists: () => [...patrimonioQueryKeys.all, "list"] as const,
  list: (
    busca: string | undefined,
    filters: PatrimonioFilters,
    pagina: number,
  ) =>
    [
      ...patrimonioQueryKeys.lists(),
      {
        busca: normalizedText(busca),
        filters: normalizePatrimonioFilters(filters),
        pagina,
        limite: 20,
      },
    ] as const,
  details: () => [...patrimonioQueryKeys.all, "detail"] as const,
  detail: (patrimonioId: string) =>
    [...patrimonioQueryKeys.details(), patrimonioId] as const,
  catalogs: () => [...patrimonioQueryKeys.all, "catalog"] as const,
  filterCatalogs: () => [...patrimonioQueryKeys.catalogs(), "filters"] as const,
  catalog: (
    kind: "species" | "sectors" | "processes",
    pagina: number,
    search?: string,
  ) =>
    [
      ...patrimonioQueryKeys.catalogs(),
      kind,
      { search: normalizedText(search), pagina, limite: 20 },
    ] as const,
  processDetail: (processoCompraId: string) =>
    [...patrimonioQueryKeys.catalogs(), "process", processoCompraId] as const,
};
