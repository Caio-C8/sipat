import { useQueries, useQuery } from "@tanstack/react-query";
import { useState, type Dispatch, type SetStateAction } from "react";
import { REFERENCE_STALE_TIME_MS } from "../../../lib/query/query-policy";
import type { SessionManager } from "../../auth/session/session-manager";
import { patrimonioQueryKeys } from "../patrimonio-query-keys";
import type { CreatePatrimonioOperations } from "./create-patrimonio-operations";

type CatalogPage = Readonly<{
  dados: readonly unknown[];
  meta: Readonly<{ pagina: number; ultimaPagina: number }>;
}>;

function catalogState<T extends CatalogPage>(
  results: readonly Readonly<{
    data?: T;
    error: Error | null;
    isFetching: boolean;
    refetch(): Promise<unknown>;
  }>[],
  setPageCount: Dispatch<SetStateAction<number>>,
) {
  const pages = results.flatMap((result) => (result.data ? [result.data] : []));
  const lastPage = pages.at(-1);
  const hasNextPage = Boolean(
    lastPage && lastPage.meta.pagina < lastPage.meta.ultimaPagina,
  );
  return {
    data: pages.length ? { pages } : undefined,
    error: results.find((result) => result.error)?.error ?? null,
    isFetching: results.some((result) => result.isFetching),
    hasNextPage,
    fetchNextPage: async () => {
      if (hasNextPage) setPageCount((current) => current + 1);
    },
    refetch: () => Promise.all(results.map((result) => result.refetch())),
  };
}

export function useCreatePatrimonioQueries(
  manager: SessionManager,
  operations: CreatePatrimonioOperations,
  processoCompraId: string,
) {
  const [speciesPageCount, setSpeciesPageCount] = useState(1);
  const [sectorsPageCount, setSectorsPageCount] = useState(1);
  const [processesPageCount, setProcessesPageCount] = useState(1);
  const speciesResults = useQueries({
    queries: Array.from({ length: speciesPageCount }, (_, index) => {
      const page = index + 1;
      return {
        queryKey: patrimonioQueryKeys.catalog("species", page),
        queryFn: ({ signal }: Readonly<{ signal: AbortSignal }>) =>
          manager.authorizedRequest(
            (accessToken) =>
              operations.listSpecies({ page }, { accessToken, signal }),
            true,
          ),
        staleTime: REFERENCE_STALE_TIME_MS,
      };
    }),
  });
  const sectorResults = useQueries({
    queries: Array.from({ length: sectorsPageCount }, (_, index) => {
      const page = index + 1;
      return {
        queryKey: patrimonioQueryKeys.catalog("sectors", page),
        queryFn: ({ signal }: Readonly<{ signal: AbortSignal }>) =>
          manager.authorizedRequest(
            (accessToken) =>
              operations.listSectors({ page }, { accessToken, signal }),
            true,
          ),
        staleTime: REFERENCE_STALE_TIME_MS,
      };
    }),
  });
  const processResults = useQueries({
    queries: Array.from({ length: processesPageCount }, (_, index) => {
      const page = index + 1;
      return {
        queryKey: patrimonioQueryKeys.catalog("processes", page),
        queryFn: ({ signal }: Readonly<{ signal: AbortSignal }>) =>
          manager.authorizedRequest(
            (accessToken) =>
              operations.listPurchaseProcesses(
                { page },
                { accessToken, signal },
              ),
            true,
          ),
        staleTime: REFERENCE_STALE_TIME_MS,
      };
    }),
  });
  const processDetail = useQuery({
    queryKey: patrimonioQueryKeys.processDetail(processoCompraId),
    queryFn: ({ signal }) =>
      manager.authorizedRequest(
        (accessToken) =>
          operations.getPurchaseProcess(processoCompraId, {
            accessToken,
            signal,
          }),
        true,
      ),
    enabled: processoCompraId.length > 0,
    staleTime: REFERENCE_STALE_TIME_MS,
  });

  return {
    species: catalogState(speciesResults, setSpeciesPageCount),
    sectors: catalogState(sectorResults, setSectorsPageCount),
    processes: catalogState(processResults, setProcessesPageCount),
    processDetail,
  };
}
