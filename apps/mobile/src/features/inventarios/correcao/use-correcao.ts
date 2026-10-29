import type {
  InventarioDetalhe,
  ItemInventarioResponse,
  SetorInventarioResumo,
} from "@repo/contracts";
import { useCallback, useRef, useState } from "react";
import { ApiError, isApiError } from "../../../lib/api/api-error";
import type { SessionManager } from "../../auth/session/session-manager";
import {
  useCancelableLoad,
  useInventariosOperations,
} from "../use-inventarios";
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
  const loadData = useCallback(
    async (signal: AbortSignal): Promise<CorrecaoData> => {
      if (!validIds) throw new ApiError("invalid-response");
      return manager.authorizedRequest(async (accessToken) => {
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
      }, true);
    },
    [inventarioId, itemInventarioId, manager, operations, validIds],
  );
  const remote = useCancelableLoad(loadData);
  const lock = useRef(false);
  const [submitting, setSubmitting] = useState(false);
  const [mutationError, setMutationError] = useState<ApiError | null>(null);

  const submit = useCallback(
    async (choice: CorrecaoChoice, observation: string) => {
      if (!validIds || !tryAcquireSubmission(lock)) return false;
      setSubmitting(true);
      setMutationError(null);
      try {
        const body = buildCorrecaoBody(choice, observation);
        const item = await manager.authorizedRequest(
          (accessToken) =>
            operations.corrigirItem(inventarioId, itemInventarioId, body, {
              accessToken,
            }),
          false,
        );
        remote.setState((current) =>
          current.status === "success"
            ? {
                status: "success",
                data: { ...current.data, item },
              }
            : current,
        );
        return true;
      } catch (error) {
        const normalized = normalizeError(error);
        setMutationError(normalized);
        if (normalized.status === 409) await remote.reload();
        return false;
      } finally {
        releaseSubmission(lock);
        setSubmitting(false);
      }
    },
    [inventarioId, itemInventarioId, manager, operations, remote, validIds],
  );

  return { ...remote, mutationError, submit, submitting };
}
