import { useQuery } from "@tanstack/react-query";
import type {
  EventosFichaResponse,
  FichaResponse,
  RelatorioTabularResponse,
  TipoRelatorio,
  TipoTabular,
} from "@repo/contracts";
import { useCallback, useMemo } from "react";
import { publicAppConfig } from "../../config/public-app-config";
import { ApiError } from "../../lib/api/api-error";
import { DOMAIN_STALE_TIME_MS } from "../../lib/query/query-policy";
import { remoteQueryState } from "../../lib/query/remote-query-state";
import type { SessionManager } from "../auth/session/session-manager";
import { createRelatoriosOperations } from "./api/relatorios-operations";
import { relatorioQueryKeys } from "./relatorio-query-keys";

type Query = Readonly<Record<string, string | number | boolean | undefined>>;

export type RelatorioPreviaRequest = Readonly<{
  tipo: TipoRelatorio;
  query: Query;
  patrimonioId?: string;
}>;

export type RelatorioPreviaData =
  | Readonly<{
      kind: "tabular";
      response: RelatorioTabularResponse;
    }>
  | Readonly<{
      kind: "ficha";
      ficha: FichaResponse;
      response: EventosFichaResponse;
    }>;

function unavailableBaseUrl() {
  return "http://configuracao-indisponivel.invalid";
}

function queryForApi(query: Query): Query {
  return {
    ...query,
    pagina: String(query.pagina ?? 1),
    limite: String(query.limite ?? 20),
  };
}

export async function fetchRelatorioPrevia(
  manager: SessionManager,
  request: RelatorioPreviaRequest,
  signal?: AbortSignal,
): Promise<RelatorioPreviaData> {
  const operations = createRelatoriosOperations(
    publicAppConfig.apiBaseUrl ?? unavailableBaseUrl(),
  );
  return manager.authorizedRequest(async (accessToken) => {
    const options = { accessToken, signal };
    const query = queryForApi(request.query);
    if (request.tipo === "ficha-bem") {
      if (!request.patrimonioId) throw new ApiError("invalid-response");
      const [ficha, response] = await Promise.all([
        operations.ficha(request.patrimonioId, options),
        operations.eventos(request.patrimonioId, query, options),
      ]);
      return { kind: "ficha", ficha, response };
    }
    const response = await operations.consultar(
      request.tipo as TipoTabular,
      query,
      options,
    );
    return { kind: "tabular", response };
  }, true);
}

export function relatorioPreviaErrorMessage(error: ApiError) {
  if (error.status === 401)
    return "Sua sessão expirou. Entre novamente para consultar a prévia.";
  if (error.status === 403)
    return "Seu perfil não tem permissão para consultar esta prévia.";
  if (error.status === 422)
    return "Os filtros não foram aceitos pela API. Ajuste-os e consulte novamente.";
  if (error.status === 429 || error.code === "RELATORIO_LIMITE_EXCEDIDO")
    return error.retryAfterSeconds
      ? `O limite de consultas foi atingido. Tente novamente em ${error.retryAfterSeconds} segundos.`
      : "O limite de consultas foi atingido. Aguarde e tente novamente.";
  if (error.status === 503 || error.code === "RELATORIO_INDISPONIVEL")
    return "Este relatório está temporariamente indisponível.";
  if (error.kind === "timeout" || error.code === "RELATORIO_TEMPO_EXCEDIDO")
    return "A consulta excedeu o tempo limite. Refine os filtros e tente novamente.";
  if (error.kind === "network")
    return "Sem conexão. Verifique sua internet e tente novamente.";
  if (error.kind === "invalid-response")
    return "A API retornou uma prévia inválida. Nenhum dado foi exibido.";
  return "Não foi possível consultar a prévia.";
}

export function useRelatorioPrevia(
  manager: SessionManager,
  request?: RelatorioPreviaRequest,
) {
  const stableRequest = useMemo(() => request, [request]);
  const query = useQuery<RelatorioPreviaData>({
    queryKey: request
      ? relatorioQueryKeys.preview(
          request.tipo,
          request.query,
          request.patrimonioId,
        )
      : relatorioQueryKeys.previews(),
    queryFn: ({ signal }) =>
      fetchRelatorioPrevia(manager, stableRequest!, signal),
    enabled: Boolean(request),
    staleTime: DOMAIN_STALE_TIME_MS,
    retry: false,
  });
  const refetch = query.refetch;
  const reload = useCallback(() => refetch(), [refetch]);
  return {
    state: remoteQueryState(query),
    isFetching: query.isFetching,
    reload,
  };
}
