import { useInfiniteQuery } from "@tanstack/react-query";
import type { CatalogoOpcaoRelatorio, TipoRelatorio } from "@repo/contracts";
import { REFERENCE_STALE_TIME_MS } from "../../lib/query/query-policy";
import type { SessionManager } from "../auth/session/session-manager";
import type { RelatoriosOperations } from "./api/relatorios-operations";
import { relatorioQueryKeys } from "./relatorio-query-keys";

export function useRelatorioCatalogo(
  manager: SessionManager,
  operations: RelatoriosOperations,
  tipo: TipoRelatorio,
  catalogo: CatalogoOpcaoRelatorio | undefined,
  busca: string,
  enabled: boolean,
) {
  const normalizedSearch = busca.trim();
  const query = useInfiniteQuery({
    queryKey: relatorioQueryKeys.options(
      tipo,
      catalogo ?? "inativo",
      normalizedSearch,
    ),
    queryFn: ({ pageParam, signal }) => {
      if (!catalogo) throw new Error("Catálogo não selecionado.");
      return manager.authorizedRequest(
        (accessToken) =>
          operations.opcoes(catalogo, tipo, normalizedSearch, pageParam, {
            accessToken,
            signal,
          }),
        true,
      );
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage) =>
      lastPage.meta.pagina < lastPage.meta.ultimaPagina
        ? lastPage.meta.pagina + 1
        : undefined,
    enabled: enabled && Boolean(catalogo),
    staleTime: REFERENCE_STALE_TIME_MS,
  });

  return {
    items: query.data?.pages.flatMap((page) => page.dados) ?? [],
    error: query.error,
    loading: query.isLoading || query.isFetchingNextPage,
    hasNextPage: query.hasNextPage,
    fetchNextPage: query.fetchNextPage,
    refetch: query.refetch,
  };
}
