import { useQuery } from "@tanstack/react-query";
import type {
  ListarPatrimoniosResponse,
  PatrimonioDetalhe,
} from "@repo/contracts";
import { useCallback, useMemo } from "react";
import { publicAppConfig } from "../../config/public-app-config";
import { ApiError } from "../../lib/api/api-error";
import {
  DOMAIN_STALE_TIME_MS,
  REFERENCE_STALE_TIME_MS,
} from "../../lib/query/query-policy";
import {
  remoteQueryState,
  type RemoteQueryState,
} from "../../lib/query/remote-query-state";
import type { SessionManager } from "../auth/session/session-manager";
import {
  createPatrimoniosOperations,
  type PatrimonioCatalogs,
  type PatrimoniosOperations,
} from "./api/patrimonios-operations";
import { patrimonioQueryKeys } from "./patrimonio-query-keys";

export type PatrimonioFilters = Readonly<{
  status?: "ATIVO" | "BAIXADO" | "EMPRESTADO" | "EM_MANUTENCAO";
  setorId?: string;
  especieId?: string;
  naturezaId?: string;
  tipoNumeroPatrimonial?: "OFICIAL" | "SEM_NUMERO_OFICIAL";
}>;

export type PatrimonioRemoteState<T> = RemoteQueryState<T>;

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
  const query = useQuery<ListarPatrimoniosResponse>({
    queryKey: patrimonioQueryKeys.list(busca, filters, pagina),
    queryFn: ({ signal }) =>
      manager.authorizedRequest(
        (accessToken) =>
          operations.listar(
            {
              pagina: String(pagina),
              limite: "20",
              busca: busca?.trim() || undefined,
              ...filters,
            },
            { accessToken, signal },
          ),
        true,
      ),
    staleTime: DOMAIN_STALE_TIME_MS,
  });
  const refetch = query.refetch;
  const reload = useCallback(() => refetch(), [refetch]);

  return {
    state: remoteQueryState(query),
    isFetching: query.isFetching,
    reload,
  };
}

export function usePatrimonioCatalogs(manager: SessionManager) {
  const operations = useOperations();
  const query = useQuery<PatrimonioCatalogs>({
    queryKey: patrimonioQueryKeys.filterCatalogs(),
    queryFn: ({ signal }) =>
      manager.authorizedRequest(
        (accessToken) => operations.listarCatalogos({ accessToken, signal }),
        true,
      ),
    staleTime: REFERENCE_STALE_TIME_MS,
  });
  const refetch = query.refetch;
  const reload = useCallback(() => refetch(), [refetch]);

  return {
    state: remoteQueryState(query),
    isFetching: query.isFetching,
    reload,
  };
}

export function usePatrimonioDetail(
  manager: SessionManager,
  patrimonioId: string,
  validId: boolean,
) {
  const operations = useOperations();
  const query = useQuery<PatrimonioDetalhe>({
    queryKey: patrimonioQueryKeys.detail(patrimonioId),
    queryFn: ({ signal }) =>
      manager.authorizedRequest(
        (accessToken) =>
          operations.consultar(patrimonioId, { accessToken, signal }),
        true,
      ),
    enabled: validId,
    staleTime: DOMAIN_STALE_TIME_MS,
  });
  const refetch = query.refetch;
  const reload = useCallback(() => refetch(), [refetch]);
  const state = validId
    ? remoteQueryState(query)
    : ({
        status: "error",
        error: new ApiError("invalid-response"),
      } as const);

  return { state, isFetching: query.isFetching, reload };
}
