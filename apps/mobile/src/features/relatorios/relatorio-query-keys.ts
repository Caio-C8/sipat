export const relatorioQueryKeys = {
  all: ["relatorios"] as const,
  catalogs: () => [...relatorioQueryKeys.all, "catalog"] as const,
  catalog: () => [...relatorioQueryKeys.catalogs(), "tipos"] as const,
  options: (tipo: string, catalogo: string, busca: string) =>
    [
      ...relatorioQueryKeys.catalogs(),
      "opcoes",
      tipo,
      catalogo,
      busca,
    ] as const,
};
