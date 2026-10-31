import type { PerfilUsuario } from "@repo/contracts";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { publicAppConfig } from "../../config/public-app-config";
import { ApiError, isApiError } from "../../lib/api/api-error";
import type { SessionManager } from "../auth/session/session-manager";
import {
  createHomeOperations,
  type HomeOperations,
  type InventariosHome,
} from "./api/home-operations";

export type HomeBlockName = "setores" | "patrimonios" | "inventarios";

export type HomeBlock<T> =
  | Readonly<{ status: "loading" }>
  | Readonly<{ status: "success"; data: T }>
  | Readonly<{ status: "error"; error: ApiError }>;

export type HomeDashboardState = Readonly<{
  setores: HomeBlock<number> | null;
  patrimonios: HomeBlock<number>;
  inventarios: HomeBlock<InventariosHome>;
}>;

const loading = Object.freeze({ status: "loading" }) as HomeBlock<never>;

function initialState(profile: PerfilUsuario): HomeDashboardState {
  return {
    setores: profile === "ADMINISTRADOR" ? loading : null,
    patrimonios: loading,
    inventarios: loading,
  };
}

function unavailableOperations(): HomeOperations {
  const fail = async () => {
    throw new ApiError("network");
  };
  return {
    contarSetores: fail,
    contarPatrimonios: fail,
    obterInventarios: fail,
  } as HomeOperations;
}

function normalizeError(error: unknown) {
  return isApiError(error) ? error : new ApiError("invalid-response");
}

export function homeErrorMessage(error: ApiError) {
  if (error.status === 403)
    return "Seu perfil não tem permissão para consultar este bloco.";
  if (error.status === 401)
    return "Sua sessão expirou. Aguarde o redirecionamento para entrar novamente.";
  if (error.kind === "timeout")
    return "A consulta demorou mais que o esperado.";
  if (error.kind === "network")
    return "Sem conexão. Verifique sua internet e tente novamente.";
  if (error.kind === "invalid-response")
    return "Não foi possível carregar estas informações. Atualize e tente novamente.";
  return "Não foi possível carregar estas informações.";
}

export function useHomeDashboard(
  manager: SessionManager,
  profile: PerfilUsuario,
) {
  const operations = useMemo(
    () =>
      publicAppConfig.apiBaseUrl
        ? createHomeOperations(publicAppConfig.apiBaseUrl)
        : unavailableOperations(),
    [],
  );
  const [state, setState] = useState<HomeDashboardState>(() =>
    initialState(profile),
  );
  const controllers = useRef(new Map<HomeBlockName, AbortController>());
  const generations = useRef(new Map<HomeBlockName, number>());

  const loadBlock = useCallback(
    async (block: HomeBlockName) => {
      if (block === "setores" && profile !== "ADMINISTRADOR") return;

      controllers.current.get(block)?.abort();
      const controller = new AbortController();
      controllers.current.set(block, controller);
      const generation = (generations.current.get(block) ?? 0) + 1;
      generations.current.set(block, generation);
      setState((current) => ({ ...current, [block]: loading }));

      try {
        let data: number | InventariosHome;
        if (block === "setores") {
          data = await manager.authorizedRequest(
            (accessToken) =>
              operations.contarSetores({
                accessToken,
                signal: controller.signal,
              }),
            true,
          );
        } else if (block === "patrimonios") {
          data = await manager.authorizedRequest(
            (accessToken) =>
              operations.contarPatrimonios({
                accessToken,
                signal: controller.signal,
              }),
            true,
          );
        } else {
          data = await manager.authorizedRequest(
            (accessToken) =>
              operations.obterInventarios({
                accessToken,
                signal: controller.signal,
              }),
            true,
          );
        }
        if (
          controller.signal.aborted ||
          generations.current.get(block) !== generation
        )
          return;
        setState((current) => {
          if (block === "setores")
            return {
              ...current,
              setores: { status: "success", data: data as number },
            };
          if (block === "patrimonios")
            return {
              ...current,
              patrimonios: { status: "success", data: data as number },
            };
          return {
            ...current,
            inventarios: {
              status: "success",
              data: data as InventariosHome,
            },
          };
        });
      } catch (error) {
        if (
          controller.signal.aborted ||
          generations.current.get(block) !== generation
        )
          return;
        setState((current) => ({
          ...current,
          [block]: { status: "error", error: normalizeError(error) },
        }));
      }
    },
    [manager, operations, profile],
  );

  const refresh = useCallback(() => {
    if (profile === "ADMINISTRADOR") void loadBlock("setores");
    void loadBlock("patrimonios");
    void loadBlock("inventarios");
  }, [loadBlock, profile]);

  useEffect(() => {
    setState(initialState(profile));
    refresh();
    const activeControllers = controllers.current;
    return () => {
      for (const controller of activeControllers.values()) controller.abort();
      activeControllers.clear();
    };
  }, [profile, refresh]);

  return { state, refresh, retry: loadBlock };
}
