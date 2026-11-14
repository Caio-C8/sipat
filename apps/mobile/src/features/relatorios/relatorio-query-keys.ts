export const relatorioQueryKeys = {
  all: ["relatorios"] as const,
  catalogs: () => [...relatorioQueryKeys.all, "catalog"] as const,
  catalog: () => [...relatorioQueryKeys.catalogs(), "tipos"] as const,
};
