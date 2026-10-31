import { useQuery } from "@tanstack/react-query";
import type { PerfilUsuario } from "@repo/contracts";
import { useCallback, useMemo } from "react";
import { publicAppConfig } from "../../config/public-app-config";
import { ApiError } from "../../lib/api/api-error";
import { DOMAIN_STALE_TIME_MS } from "../../lib/query/query-policy";
import {
  remoteQueryState,
  type RemoteQueryState,
} from "../../lib/query/remote-query-state";
import type { SessionManager } from "../auth/session/session-manager";
import {
  createHomeOperations,
  type HomeOperations,
  type InventariosHome,
} from "./api/home-operations";
import { homeQueryKeys } from "./home-query-keys";

export type HomeBlockName = "setores" | "patrimonios" | "inventarios";
export type HomeBlock<T> = RemoteQueryState<T>;

export type HomeDashboardState = Readonly<{
  setores: HomeBlock<number> | null;
  patrimonios: HomeBlock<number>;
  inventarios: HomeBlock<InventariosHome>;
}>;

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
  const setores = useQuery({
    queryKey: homeQueryKeys.setores(),
    queryFn: ({ signal }) =>
      manager.authorizedRequest(
        (accessToken) => operations.contarSetores({ accessToken, signal }),
        true,
      ),
    enabled: profile === "ADMINISTRADOR",
    staleTime: DOMAIN_STALE_TIME_MS,
  });
  const patrimonios = useQuery({
    queryKey: homeQueryKeys.patrimonios(),
    queryFn: ({ signal }) =>
      manager.authorizedRequest(
        (accessToken) => operations.contarPatrimonios({ accessToken, signal }),
        true,
      ),
    staleTime: DOMAIN_STALE_TIME_MS,
  });
  const inventarios = useQuery({
    queryKey: homeQueryKeys.inventarios(),
    queryFn: ({ signal }) =>
      manager.authorizedRequest(
        (accessToken) => operations.obterInventarios({ accessToken, signal }),
        true,
      ),
    staleTime: DOMAIN_STALE_TIME_MS,
  });
  const refetchSetores = setores.refetch;
  const refetchPatrimonios = patrimonios.refetch;
  const refetchInventarios = inventarios.refetch;

  const retry = useCallback(
    (block: HomeBlockName) => {
      if (block === "setores") return refetchSetores();
      if (block === "patrimonios") return refetchPatrimonios();
      return refetchInventarios();
    },
    [refetchInventarios, refetchPatrimonios, refetchSetores],
  );
  const refresh = useCallback(() => {
    if (profile === "ADMINISTRADOR") void refetchSetores();
    void refetchPatrimonios();
    void refetchInventarios();
  }, [profile, refetchInventarios, refetchPatrimonios, refetchSetores]);

  return {
    state: {
      setores: profile === "ADMINISTRADOR" ? remoteQueryState(setores) : null,
      patrimonios: remoteQueryState(patrimonios),
      inventarios: remoteQueryState(inventarios),
    } satisfies HomeDashboardState,
    isFetching:
      setores.isFetching || patrimonios.isFetching || inventarios.isFetching,
    refresh,
    retry,
  };
}
