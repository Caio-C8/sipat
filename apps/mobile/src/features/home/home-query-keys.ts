export const homeQueryKeys = {
  all: ["home"] as const,
  setores: () => [...homeQueryKeys.all, "setores"] as const,
  patrimonios: () => [...homeQueryKeys.all, "patrimonios"] as const,
  inventarios: () => [...homeQueryKeys.all, "inventarios"] as const,
};
