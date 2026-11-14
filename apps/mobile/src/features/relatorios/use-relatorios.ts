import { useQuery } from "@tanstack/react-query";
import type { CatalogoRelatoriosResponse } from "@repo/contracts";
import { useCallback, useMemo } from "react";
import { publicAppConfig } from "../../config/public-app-config";
import { ApiError } from "../../lib/api/api-error";
import { REFERENCE_STALE_TIME_MS } from "../../lib/query/query-policy";
import { remoteQueryState } from "../../lib/query/remote-query-state";
import type { SessionManager } from "../auth/session/session-manager";
import {
  createRelatoriosOperations,
  type RelatoriosOperations,
} from "./api/relatorios-operations";
import { relatorioQueryKeys } from "./relatorio-query-keys";

function unavailableOperations(): RelatoriosOperations {
  const operations = createRelatoriosOperations(
    "http://configuracao-indisponivel.invalid",
  );
  return {
    ...operations,
    async catalogo() {
      throw new ApiError("network");
    },
  };
}

export function relatorioErrorMessage(error: ApiError) {
  if (error.status === 401)
    return "Sua sessão expirou. Aguarde o redirecionamento para entrar novamente.";
  if (error.status === 403)
    return "Seu perfil não tem permissão para consultar relatórios.";
  if (error.kind === "timeout")
    return "A consulta demorou mais que o esperado.";
  if (error.kind === "network")
    return "Sem conexão. Verifique sua internet e tente novamente.";
  if (error.kind === "invalid-response")
    return "A API retornou um catálogo inválido. Atualize e tente novamente.";
  return "Não foi possível carregar os relatórios.";
}

export function useRelatoriosCatalog(manager: SessionManager) {
  const operations = useMemo(
    () =>
      publicAppConfig.apiBaseUrl
        ? createRelatoriosOperations(publicAppConfig.apiBaseUrl)
        : unavailableOperations(),
    [],
  );
  const query = useQuery<CatalogoRelatoriosResponse>({
    queryKey: relatorioQueryKeys.catalog(),
    queryFn: ({ signal }) =>
      manager.authorizedRequest(
        (accessToken) => operations.catalogo({ accessToken, signal }),
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
