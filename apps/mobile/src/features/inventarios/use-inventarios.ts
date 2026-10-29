import type {
  InventarioDetalhe,
  ListarSetoresInventarioResponse,
  SetorInventarioResumo,
  StatusInventario,
  StatusSetorInventario,
} from "@repo/contracts";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { publicAppConfig } from "../../config/public-app-config";
import { ApiError, isApiError } from "../../lib/api/api-error";
import type { SessionManager } from "../auth/session/session-manager";
import {
  createInventariosOperations,
  type InventariosOperations,
} from "./api/inventarios-operations";

export type RemoteState<T> =
  | Readonly<{ status: "loading" }>
  | Readonly<{ status: "success"; data: T }>
  | Readonly<{ status: "error"; error: ApiError }>;

const loading = Object.freeze({ status: "loading" }) as RemoteState<never>;

function unavailableOperations(): InventariosOperations {
  const fail = async () => {
    throw new ApiError("network");
  };
  return {
    listar: fail,
    consultar: fail,
    listarSetores: fail,
    consultarSetor: fail,
    iniciarSetor: fail,
  } as unknown as InventariosOperations;
}

function normalizeError(error: unknown) {
  return isApiError(error) ? error : new ApiError("invalid-response");
}

export function inventarioErrorMessage(error: ApiError, detail = false) {
  if (error.status === 401)
    return "Sua sessão expirou. Aguarde o redirecionamento para entrar novamente.";
  if (error.status === 403)
    return "Seu perfil não tem permissão para realizar esta operação.";
  if (error.status === 404)
    return detail
      ? "O inventário ou setor solicitado não foi encontrado."
      : "Nenhum inventário foi encontrado para esta consulta.";
  if (error.status === 409) {
    if (error.code === "OUTRO_SETOR_INVENTARIO_EM_ANDAMENTO")
      return "Outro setor já está em conferência. Os dados foram atualizados.";
    return "O inventário foi alterado por outra pessoa. Os dados foram atualizados.";
  }
  if (error.kind === "timeout")
    return "A consulta demorou mais que o esperado.";
  if (error.kind === "network") return "Sem conexão ou API indisponível.";
  if (error.kind === "invalid-response")
    return "A API retornou dados fora do contrato esperado.";
  return detail
    ? "Não foi possível carregar este inventário."
    : "Não foi possível carregar os inventários.";
}

function useOperations() {
  return useMemo(
    () =>
      publicAppConfig.apiBaseUrl
        ? createInventariosOperations(publicAppConfig.apiBaseUrl)
        : unavailableOperations(),
    [],
  );
}

function useCancelableLoad<T>(loadData: (signal: AbortSignal) => Promise<T>) {
  const [state, setState] = useState<RemoteState<T>>(loading);
  const controller = useRef<AbortController | null>(null);
  const generation = useRef(0);

  const load = useCallback(async () => {
    controller.current?.abort();
    const currentController = new AbortController();
    controller.current = currentController;
    const currentGeneration = generation.current + 1;
    generation.current = currentGeneration;
    await Promise.resolve();
    setState(loading);
    try {
      const data = await loadData(currentController.signal);
      if (
        !currentController.signal.aborted &&
        currentGeneration === generation.current
      ) {
        setState({ status: "success", data });
      }
    } catch (error) {
      if (
        !currentController.signal.aborted &&
        currentGeneration === generation.current
      ) {
        setState({ status: "error", error: normalizeError(error) });
      }
    }
  }, [loadData]);

  useEffect(() => {
    const timer = setTimeout(() => void load(), 0);
    return () => {
      clearTimeout(timer);
      controller.current?.abort();
    };
  }, [load]);

  return { state, reload: load, setState };
}

export function useInventarios(
  manager: SessionManager,
  status: Extract<StatusInventario, "PENDENTE" | "EM_ANDAMENTO">,
  busca: string | undefined,
  pagina: number,
) {
  const operations = useOperations();
  return useCancelableLoad(
    useCallback(
      (signal: AbortSignal) =>
        manager.authorizedRequest(
          (accessToken) =>
            operations.listar(
              {
                pagina: String(pagina),
                limite: "10",
                busca,
                status,
              },
              { accessToken, signal },
            ),
          true,
        ),
      [busca, manager, operations, pagina, status],
    ),
  );
}

export type InventarioSetoresData = Readonly<{
  inventario: InventarioDetalhe;
  setores: ListarSetoresInventarioResponse;
}>;

export function useInventarioSetores(
  manager: SessionManager,
  inventarioId: string,
  validId: boolean,
  busca: string | undefined,
  status: StatusSetorInventario | undefined,
  pagina: number,
) {
  const operations = useOperations();
  return useCancelableLoad(
    useCallback(
      async (signal: AbortSignal) => {
        if (!validId) throw new ApiError("invalid-response");
        return manager.authorizedRequest(async (accessToken) => {
          const options = { accessToken, signal };
          const [inventario, setores] = await Promise.all([
            operations.consultar(inventarioId, options),
            operations.listarSetores(
              inventarioId,
              {
                pagina: String(pagina),
                limite: "20",
                busca,
                status,
              },
              options,
            ),
          ]);
          return { inventario, setores };
        }, true);
      },
      [busca, inventarioId, manager, operations, pagina, status, validId],
    ),
  );
}

export type SetorDetailData = Readonly<{
  inventario: InventarioDetalhe;
  setor: SetorInventarioResumo;
  setorEmAndamento: SetorInventarioResumo | null;
}>;

export function useSetorInventarioDetail(
  manager: SessionManager,
  inventarioId: string,
  setorInventarioId: string,
  validIds: boolean,
) {
  const operations = useOperations();
  const loadData = useCallback(
    async (signal: AbortSignal): Promise<SetorDetailData> => {
      if (!validIds) throw new ApiError("invalid-response");
      return manager.authorizedRequest(async (accessToken) => {
        const options = { accessToken, signal };
        const [inventario, setor] = await Promise.all([
          operations.consultar(inventarioId, options),
          operations.consultarSetor(inventarioId, setorInventarioId, options),
        ]);
        if (!setor) throw new ApiError("http", 404);
        const setoresEmAndamento = await operations.listarSetores(
          inventarioId,
          { pagina: "1", limite: "1", status: "EM_ANDAMENTO" },
          options,
        );
        return {
          inventario,
          setor,
          setorEmAndamento: setoresEmAndamento.dados[0] ?? null,
        };
      }, true);
    },
    [inventarioId, manager, operations, setorInventarioId, validIds],
  );
  const remote = useCancelableLoad(loadData);
  const [starting, setStarting] = useState(false);
  const startingRef = useRef(false);
  const [mutationError, setMutationError] = useState<ApiError | null>(null);

  const start = useCallback(async () => {
    if (startingRef.current || !validIds) return;
    startingRef.current = true;
    setStarting(true);
    setMutationError(null);
    try {
      const setor = await manager.authorizedRequest(
        (accessToken) =>
          operations.iniciarSetor(inventarioId, setorInventarioId, {
            accessToken,
          }),
        false,
      );
      remote.setState((current) =>
        current.status === "success"
          ? {
              status: "success",
              data: { ...current.data, setor, setorEmAndamento: setor },
            }
          : current,
      );
    } catch (error) {
      const normalized = normalizeError(error);
      setMutationError(normalized);
      if (normalized.status === 409) await remote.reload();
    } finally {
      startingRef.current = false;
      setStarting(false);
    }
  }, [inventarioId, manager, operations, remote, setorInventarioId, validIds]);

  return { ...remote, start, starting, mutationError };
}
