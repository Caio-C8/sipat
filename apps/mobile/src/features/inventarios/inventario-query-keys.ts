import type { StatusInventario, StatusSetorInventario } from "@repo/contracts";
import type { ContextoRegistrosSetor } from "./use-inventarios";

function normalizedText(value: string | undefined) {
  const normalized = value?.trim();
  return normalized || undefined;
}

export const inventarioQueryKeys = {
  all: ["inventarios"] as const,
  lists: () => [...inventarioQueryKeys.all, "list"] as const,
  list: (status: StatusInventario, busca: string | undefined, pagina: number) =>
    [
      ...inventarioQueryKeys.lists(),
      { status, busca: normalizedText(busca), pagina, limite: 10 },
    ] as const,
  details: () => [...inventarioQueryKeys.all, "detail"] as const,
  detail: (inventarioId: string) =>
    [...inventarioQueryKeys.details(), inventarioId] as const,
  sectors: (inventarioId: string) =>
    [...inventarioQueryKeys.detail(inventarioId), "sectors"] as const,
  sectorList: (
    inventarioId: string,
    busca: string | undefined,
    status: StatusSetorInventario | undefined,
    pagina: number,
  ) =>
    [
      ...inventarioQueryKeys.sectors(inventarioId),
      "list",
      { busca: normalizedText(busca), status, pagina, limite: 20 },
    ] as const,
  sectorDetail: (
    inventarioId: string,
    setorInventarioId: string,
    paginaPendencias: number,
    paginaRegistros: number,
    contextoRegistros: ContextoRegistrosSetor,
  ) =>
    [
      ...inventarioQueryKeys.sectors(inventarioId),
      setorInventarioId,
      {
        paginaPendencias,
        paginaRegistros,
        contextoRegistros,
        limite: 10,
      },
    ] as const,
  items: (inventarioId: string) =>
    [...inventarioQueryKeys.detail(inventarioId), "items"] as const,
  item: (inventarioId: string, itemInventarioId: string) =>
    [...inventarioQueryKeys.items(inventarioId), itemInventarioId] as const,
};
