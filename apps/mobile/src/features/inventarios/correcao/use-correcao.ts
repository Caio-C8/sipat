import type {
  InventarioDetalhe,
  ItemInventarioResponse,
  SetorInventarioResumo,
} from "@repo/contracts";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useMemo, useRef } from "react";
import { ApiError, isApiError } from "../../../lib/api/api-error";
import { DOMAIN_STALE_TIME_MS } from "../../../lib/query/query-policy";
import { remoteQueryState } from "../../../lib/query/remote-query-state";
import {
  currentSessionIdentity,
  isCurrentSession,
} from "../../../lib/query/session-mutation";
import type { SessionManager } from "../../auth/session/session-manager";
import { inventarioQueryKeys } from "../inventario-query-keys";
import { invalidateInventarioCorrection } from "../inventario-mutation-invalidation";
import { useInventariosOperations } from "../use-inventarios";
import {
  releaseSubmission,
  tryAcquireSubmission,
} from "../conferencia/conferencia-state";
import { buildCorrecaoBody, type CorrecaoChoice } from "./correcao-state";

type CorrecaoData = Readonly<{
  inventario: InventarioDetalhe;
  item: ItemInventarioResponse;
  setorInventario: SetorInventarioResumo;
}>;

function normalizeError(error: unknown) {
  return isApiError(error) ? error : new ApiError("invalid-response");
}

export function useCorrecao(
  manager: SessionManager,
  inventarioId: string,
  itemInventarioId: string,
  validIds: boolean,
) {
  const operations = useInventariosOperations();
  const queryClient = useQueryClient();
  const queryKey = useMemo(
    () => inventarioQueryKeys.item(inventarioId, itemInventarioId),
    [inventarioId, itemInventarioId],
  );
  const query = useQuery<CorrecaoData>({
    queryKey,
    queryFn: ({ signal }) =>
      manager.authorizedRequest(async (accessToken) => {
        const options = { accessToken, signal };
        const [inventario, item] = await Promise.all([
          operations.consultar(inventarioId, options),
          operations.consultarItem(inventarioId, itemInventarioId, options),
        ]);
        if (!item) throw new ApiError("http", 404);

        let pagina = 1;
        let ultimaPagina = 1;
        let setorInventario: SetorInventarioResumo | undefined;
        do {
          const setores = await operations.listarSetores(
            inventarioId,
            { pagina: String(pagina), limite: "50" },
            options,
          );
          setorInventario = setores.dados.find(
            (candidate) => candidate.setor.id === item.setorEsperado.id,
          );
          ultimaPagina = setores.meta.ultimaPagina;
          pagina += 1;
        } while (!setorInventario && pagina <= ultimaPagina);
        if (!setorInventario) throw new ApiError("invalid-response");
        return { inventario, item, setorInventario };
      }, true),
    enabled: validIds,
    staleTime: DOMAIN_STALE_TIME_MS,
  });
  const refetch = query.refetch;
  const reload = useCallback(() => refetch(), [refetch]);
  const lock = useRef(false);
  const correction = useMutation<
    ItemInventarioResponse,
    ApiError,
    Readonly<{
      body: ReturnType<typeof buildCorrecaoBody>;
      identityId: string | null;
    }>
  >({
    mutationFn: async ({
      body,
    }: Readonly<{
      body: ReturnType<typeof buildCorrecaoBody>;
      identityId: string | null;
    }>) => {
      try {
        return await manager.authorizedRequest(
          (accessToken) =>
            operations.corrigirItem(inventarioId, itemInventarioId, body, {
              accessToken,
            }),
          false,
        );
      } catch (error) {
        throw normalizeError(error);
      }
    },
    onSuccess: (_item, variables) =>
      isCurrentSession(manager, variables.identityId)
        ? invalidateInventarioCorrection(queryClient, inventarioId)
        : undefined,
    onError: (error) => (error.status === 409 ? reload() : undefined),
    retry: false,
  });

  const submit = useCallback(
    async (choice: CorrecaoChoice, observation: string) => {
      if (!validIds || !tryAcquireSubmission(lock)) return false;
      correction.reset();
      try {
        const body = buildCorrecaoBody(choice, observation);
        await correction.mutateAsync({
          body,
          identityId: currentSessionIdentity(manager),
        });
        return true;
      } catch {
        return false;
      } finally {
        releaseSubmission(lock);
      }
    },
    [correction, manager, validIds],
  );

  return {
    state: validIds
      ? remoteQueryState(query)
      : ({ status: "error", error: new ApiError("invalid-response") } as const),
    isFetching: query.isFetching,
    reload,
    mutationError: correction.error,
    submit,
    submitting: correction.isPending,
  };
}
