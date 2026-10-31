import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  InventarioDetalhe,
  ListarInventariosResponse,
  ListarItensInventarioResponse,
  ListarSetoresInventarioResponse,
  SetorInventarioResumo,
  StatusInventario,
  StatusSetorInventario,
} from "@repo/contracts";
import { useCallback, useMemo, useRef } from "react";
import { publicAppConfig } from "../../config/public-app-config";
import { ApiError, isApiError } from "../../lib/api/api-error";
import { DOMAIN_STALE_TIME_MS } from "../../lib/query/query-policy";
import {
  currentSessionIdentity,
  isCurrentSession,
} from "../../lib/query/session-mutation";
import {
  remoteQueryState,
  type RemoteQueryState,
} from "../../lib/query/remote-query-state";
import type { SessionManager } from "../auth/session/session-manager";
import {
  createInventariosOperations,
  type InventariosOperations,
} from "./api/inventarios-operations";
import { inventarioQueryKeys } from "./inventario-query-keys";
import {
  invalidateInventarioConclusion,
  invalidateInventarioStart,
} from "./inventario-mutation-invalidation";

export type RemoteState<T> = RemoteQueryState<T>;

function unavailableOperations(): InventariosOperations {
  const fail = async () => {
    throw new ApiError("network");
  };
  return {
    listar: fail,
    consultar: fail,
    listarSetores: fail,
    listarItens: fail,
    consultarSetor: fail,
    consultarItem: fail,
    iniciarSetor: fail,
    verificarItem: fail,
    corrigirItem: fail,
    concluirSetor: fail,
  } as InventariosOperations;
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
    if (error.code === "CORRECAO_ITEM_INVENTARIO_INCOMPATIVEL")
      return "Este item não pode mais ser corrigido porque sua situação mudou. Os dados foram atualizados.";
    if (error.code === "INVENTARIO_FINALIZADO")
      return "O inventário foi finalizado e não aceita novas alterações.";
    return "O inventário foi alterado por outra pessoa. Os dados foram atualizados.";
  }
  if (error.kind === "timeout")
    return "A consulta demorou mais que o esperado.";
  if (error.kind === "network")
    return "Sem conexão. Verifique sua internet e tente novamente.";
  if (error.kind === "invalid-response")
    return "Não foi possível carregar as informações. Atualize e tente novamente.";
  return detail
    ? "Não foi possível carregar este inventário."
    : "Não foi possível carregar os inventários.";
}

export function useInventariosOperations() {
  return useMemo(
    () =>
      publicAppConfig.apiBaseUrl
        ? createInventariosOperations(publicAppConfig.apiBaseUrl)
        : unavailableOperations(),
    [],
  );
}

const disabledInventarios: ListarInventariosResponse = {
  status: 200,
  sucesso: true,
  mensagem: "Consulta desabilitada para este perfil.",
  dados: [],
  meta: { total: 0, pagina: 1, ultimaPagina: 1, limite: 10 },
};

export function useInventarios(
  manager: SessionManager,
  status: StatusInventario,
  busca: string | undefined,
  pagina: number,
  enabled = true,
) {
  const operations = useInventariosOperations();
  const query = useQuery<ListarInventariosResponse>({
    queryKey: inventarioQueryKeys.list(status, busca, pagina),
    queryFn: ({ signal }) =>
      manager.authorizedRequest(
        (accessToken) =>
          operations.listar(
            {
              pagina: String(pagina),
              limite: "10",
              busca: busca?.trim() || undefined,
              status,
            },
            { accessToken, signal },
          ),
        true,
      ),
    enabled,
    staleTime: DOMAIN_STALE_TIME_MS,
  });
  const refetch = query.refetch;
  const reload = useCallback(() => refetch(), [refetch]);

  return {
    state: enabled
      ? remoteQueryState(query)
      : ({ status: "success", data: disabledInventarios } as const),
    isFetching: query.isFetching,
    reload,
  };
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
  const operations = useInventariosOperations();
  const query = useQuery<InventarioSetoresData>({
    queryKey: inventarioQueryKeys.sectorList(
      inventarioId,
      busca,
      status,
      pagina,
    ),
    queryFn: ({ signal }) =>
      manager.authorizedRequest(async (accessToken) => {
        const options = { accessToken, signal };
        const [inventario, setores] = await Promise.all([
          operations.consultar(inventarioId, options),
          operations.listarSetores(
            inventarioId,
            {
              pagina: String(pagina),
              limite: "20",
              busca: busca?.trim() || undefined,
              status,
            },
            options,
          ),
        ]);
        return { inventario, setores };
      }, true),
    enabled: validId,
    staleTime: DOMAIN_STALE_TIME_MS,
  });
  const refetch = query.refetch;
  const reload = useCallback(() => refetch(), [refetch]);

  return {
    state: validId
      ? remoteQueryState(query)
      : ({ status: "error", error: new ApiError("invalid-response") } as const),
    isFetching: query.isFetching,
    reload,
  };
}

export type SetorDetailData = Readonly<{
  inventario: InventarioDetalhe;
  setor: SetorInventarioResumo;
  setorEmAndamento: SetorInventarioResumo | null;
  pendencias: ListarItensInventarioResponse;
  registros: ListarItensInventarioResponse;
  totaisRegistros: Readonly<{ previstos: number; encontradosAqui: number }>;
}>;

export type ContextoRegistrosSetor =
  "TODOS" | "PREVISTO" | "ENCONTRADO_NO_SETOR";

export function useSetorInventarioDetail(
  manager: SessionManager,
  inventarioId: string,
  setorInventarioId: string,
  validIds: boolean,
  paginaPendencias = 1,
  paginaRegistros = 1,
  contextoRegistros: ContextoRegistrosSetor = "PREVISTO",
) {
  const operations = useInventariosOperations();
  const queryClient = useQueryClient();
  const queryKey = useMemo(
    () =>
      inventarioQueryKeys.sectorDetail(
        inventarioId,
        setorInventarioId,
        paginaPendencias,
        paginaRegistros,
        contextoRegistros,
      ),
    [
      contextoRegistros,
      inventarioId,
      paginaPendencias,
      paginaRegistros,
      setorInventarioId,
    ],
  );
  const query = useQuery<SetorDetailData>({
    queryKey,
    queryFn: ({ signal }) =>
      manager.authorizedRequest(async (accessToken) => {
        const options = { accessToken, signal };
        const carregarRegistros = (
          contextoSetor: Exclude<ContextoRegistrosSetor, "TODOS"> | undefined,
          pagina: number,
          limite: string,
        ) =>
          operations.listarItens(
            inventarioId,
            {
              pagina: String(pagina),
              limite,
              setorInventarioId,
              contextoSetor,
              statusVerificacao: "VERIFICADO",
            },
            options,
          );
        const registrosPromise = carregarRegistros(
          contextoRegistros === "TODOS" ? undefined : contextoRegistros,
          paginaRegistros,
          "10",
        );
        const previstosPromise =
          contextoRegistros === "PREVISTO"
            ? registrosPromise
            : carregarRegistros("PREVISTO", 1, "1");
        const encontradosPromise =
          contextoRegistros === "ENCONTRADO_NO_SETOR"
            ? registrosPromise
            : carregarRegistros("ENCONTRADO_NO_SETOR", 1, "1");
        const [
          inventario,
          setor,
          pendencias,
          registros,
          registrosPrevistos,
          registrosEncontrados,
        ] = await Promise.all([
          operations.consultar(inventarioId, options),
          operations.consultarSetor(inventarioId, setorInventarioId, options),
          operations.listarItens(
            inventarioId,
            {
              pagina: String(paginaPendencias),
              limite: "10",
              setorInventarioId,
              statusCorrecao: "PENDENTE",
            },
            options,
          ),
          registrosPromise,
          previstosPromise,
          encontradosPromise,
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
          pendencias,
          registros,
          totaisRegistros: {
            previstos: registrosPrevistos.meta.total,
            encontradosAqui: registrosEncontrados.meta.total,
          },
        };
      }, true),
    enabled: validIds,
    staleTime: DOMAIN_STALE_TIME_MS,
  });
  const startingRef = useRef(false);
  const concludingRef = useRef(false);
  const refetch = query.refetch;
  const reload = useCallback(() => refetch(), [refetch]);
  const startMutation = useMutation<
    SetorInventarioResumo,
    ApiError,
    Readonly<{ identityId: string | null }>
  >({
    mutationFn: async ({
      identityId: _identityId,
    }: Readonly<{ identityId: string | null }>) => {
      try {
        return await manager.authorizedRequest(
          (accessToken) =>
            operations.iniciarSetor(inventarioId, setorInventarioId, {
              accessToken,
            }),
          false,
        );
      } catch (error) {
        throw normalizeError(error);
      }
    },
    onSuccess: (_setor, variables) =>
      isCurrentSession(manager, variables.identityId)
        ? invalidateInventarioStart(queryClient, inventarioId)
        : undefined,
    onError: (error) =>
      error.status === 409
        ? queryClient.refetchQueries({ queryKey, exact: true })
        : undefined,
    retry: false,
  });
  const concludeMutation = useMutation<
    SetorInventarioResumo,
    ApiError,
    Readonly<{ identityId: string | null }>
  >({
    mutationFn: async ({
      identityId: _identityId,
    }: Readonly<{ identityId: string | null }>) => {
      try {
        return await manager.authorizedRequest(
          (accessToken) =>
            operations.concluirSetor(inventarioId, setorInventarioId, {
              accessToken,
            }),
          false,
        );
      } catch (error) {
        throw normalizeError(error);
      }
    },
    onSuccess: (_setor, variables) =>
      isCurrentSession(manager, variables.identityId)
        ? invalidateInventarioConclusion(queryClient, inventarioId)
        : undefined,
    onError: (error) =>
      error.status === 409
        ? queryClient.refetchQueries({ queryKey, exact: true })
        : undefined,
    retry: false,
  });

  const start = useCallback(async () => {
    if (startingRef.current || !validIds) return false;
    startingRef.current = true;
    startMutation.reset();
    concludeMutation.reset();
    try {
      await startMutation.mutateAsync({
        identityId: currentSessionIdentity(manager),
      });
      return true;
    } catch {
      return false;
    } finally {
      startingRef.current = false;
    }
  }, [concludeMutation, manager, startMutation, validIds]);

  const conclude = useCallback(async () => {
    if (concludingRef.current || !validIds) return false;
    concludingRef.current = true;
    startMutation.reset();
    concludeMutation.reset();
    try {
      await concludeMutation.mutateAsync({
        identityId: currentSessionIdentity(manager),
      });
      return true;
    } catch {
      return false;
    } finally {
      concludingRef.current = false;
    }
  }, [concludeMutation, manager, startMutation, validIds]);

  const mutationError = startMutation.error ?? concludeMutation.error;

  return {
    state: validIds
      ? remoteQueryState(query)
      : ({ status: "error", error: new ApiError("invalid-response") } as const),
    isFetching: query.isFetching,
    reload,
    conclude,
    concluding: concludeMutation.isPending,
    start,
    starting: startMutation.isPending,
    mutationError,
  };
}
