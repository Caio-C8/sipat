import type {
  ListarPatrimoniosResponse,
  PatrimonioDetalhe,
} from "@repo/contracts";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { publicAppConfig } from "../../config/public-app-config";
import { ApiError, isApiError } from "../../lib/api/api-error";
import type { SessionManager } from "../auth/session/session-manager";
import {
  createPatrimoniosOperations,
  type PatrimonioCatalogs,
  type PatrimoniosOperations,
} from "./api/patrimonios-operations";

export type PatrimonioFilters = Readonly<{
  status?: "ATIVO" | "BAIXADO" | "EMPRESTADO" | "EM_MANUTENCAO";
  setorId?: string;
  especieId?: string;
  naturezaId?: string;
  tipoNumeroPatrimonial?: "OFICIAL" | "SEM_NUMERO_OFICIAL";
}>;

type RemoteState<T> =
  | Readonly<{ status: "loading" }>
  | Readonly<{ status: "success"; data: T }>
  | Readonly<{ status: "error"; error: ApiError }>;

const loading = Object.freeze({ status: "loading" }) as RemoteState<never>;

function unavailableOperations(): PatrimoniosOperations {
  const fail = async () => {
    throw new ApiError("network");
  };
  return {
    listar: fail,
    consultar: fail,
    listarCatalogos: fail,
  } as PatrimoniosOperations;
}

function normalizeError(error: unknown) {
  return isApiError(error) ? error : new ApiError("invalid-response");
}

export function patrimonioErrorMessage(error: ApiError, detail = false) {
  if (error.status === 401)
    return "Sua sessão expirou. Aguarde o redirecionamento para entrar novamente.";
  if (error.status === 403)
    return "Seu perfil não tem permissão para consultar patrimônios.";
  if (error.status === 404 && detail)
    return "O patrimônio solicitado não foi encontrado.";
  if (error.kind === "timeout")
    return "A consulta demorou mais que o esperado.";
  if (error.kind === "network")
    return "Sem conexão. Verifique sua internet e tente novamente.";
  if (error.kind === "invalid-response")
    return "Não foi possível carregar as informações. Atualize e tente novamente.";
  return detail
    ? "Não foi possível carregar este patrimônio."
    : "Não foi possível carregar os patrimônios.";
}

function useOperations() {
  return useMemo(
    () =>
      publicAppConfig.apiBaseUrl
        ? createPatrimoniosOperations(publicAppConfig.apiBaseUrl)
        : unavailableOperations(),
    [],
  );
}

export function usePatrimonios(
  manager: SessionManager,
  busca: string | undefined,
  filters: PatrimonioFilters,
  pagina: number,
) {
  const operations = useOperations();
  const [state, setState] =
    useState<RemoteState<ListarPatrimoniosResponse>>(loading);
  const generation = useRef(0);
  const controller = useRef<AbortController | null>(null);

  const load = useCallback(async () => {
    controller.current?.abort();
    const currentController = new AbortController();
    controller.current = currentController;
    const currentGeneration = generation.current + 1;
    generation.current = currentGeneration;
    await Promise.resolve();
    setState(loading);

    try {
      const data = await manager.authorizedRequest(
        (accessToken) =>
          operations.listar(
            {
              pagina: String(pagina),
              limite: "20",
              busca,
              ...filters,
            },
            { accessToken, signal: currentController.signal },
          ),
        true,
      );
      if (
        currentController.signal.aborted ||
        generation.current !== currentGeneration
      )
        return;
      setState({ status: "success", data });
    } catch (error) {
      if (
        currentController.signal.aborted ||
        generation.current !== currentGeneration
      )
        return;
      setState({ status: "error", error: normalizeError(error) });
    }
  }, [busca, filters, manager, operations, pagina]);

  const refresh = useCallback(() => {
    void load();
  }, [load]);

  useEffect(() => {
    const timer = setTimeout(refresh, 0);
    return () => {
      clearTimeout(timer);
      controller.current?.abort();
    };
  }, [refresh]);

  return { state, reload: load };
}

export function usePatrimonioCatalogs(manager: SessionManager) {
  const operations = useOperations();
  const [state, setState] = useState<RemoteState<PatrimonioCatalogs>>(loading);
  const controller = useRef<AbortController | null>(null);

  const load = useCallback(async () => {
    controller.current?.abort();
    const currentController = new AbortController();
    controller.current = currentController;
    await Promise.resolve();
    setState(loading);
    try {
      const data = await manager.authorizedRequest(
        (accessToken) =>
          operations.listarCatalogos({
            accessToken,
            signal: currentController.signal,
          }),
        true,
      );
      if (!currentController.signal.aborted)
        setState({ status: "success", data });
    } catch (error) {
      if (!currentController.signal.aborted)
        setState({ status: "error", error: normalizeError(error) });
    }
  }, [manager, operations]);

  const refresh = useCallback(() => {
    void load();
  }, [load]);

  useEffect(() => {
    const timer = setTimeout(refresh, 0);
    return () => {
      clearTimeout(timer);
      controller.current?.abort();
    };
  }, [refresh]);

  return { state, reload: load };
}

export function usePatrimonioDetail(
  manager: SessionManager,
  patrimonioId: string,
  validId: boolean,
) {
  const operations = useOperations();
  const [state, setState] = useState<RemoteState<PatrimonioDetalhe>>(loading);
  const controller = useRef<AbortController | null>(null);

  const load = useCallback(async () => {
    await Promise.resolve();
    if (!validId) {
      setState({ status: "error", error: new ApiError("invalid-response") });
      return;
    }
    controller.current?.abort();
    const currentController = new AbortController();
    controller.current = currentController;
    setState(loading);
    try {
      const data = await manager.authorizedRequest(
        (accessToken) =>
          operations.consultar(patrimonioId, {
            accessToken,
            signal: currentController.signal,
          }),
        true,
      );
      if (!currentController.signal.aborted)
        setState({ status: "success", data });
    } catch (error) {
      if (!currentController.signal.aborted)
        setState({ status: "error", error: normalizeError(error) });
    }
  }, [manager, operations, patrimonioId, validId]);

  const refresh = useCallback(() => {
    void load();
  }, [load]);

  useEffect(() => {
    const timer = setTimeout(refresh, 0);
    return () => {
      clearTimeout(timer);
      controller.current?.abort();
    };
  }, [refresh]);

  return { state, reload: load };
}
