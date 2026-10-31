import type {
  InventarioDetalhe,
  ListarInventariosResponse,
  ListarItensInventarioResponse,
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

export function useCancelableLoad<T>(
  loadData: (signal: AbortSignal) => Promise<T>,
) {
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
  status: StatusInventario,
  busca: string | undefined,
  pagina: number,
  enabled = true,
) {
  const operations = useInventariosOperations();
  return useCancelableLoad(
    useCallback(
      (signal: AbortSignal) => {
        if (!enabled) {
          return Promise.resolve({
            status: 200 as const,
            sucesso: true as const,
            mensagem: "Consulta desabilitada para este perfil.",
            dados: [],
            meta: {
              total: 0,
              pagina: 1,
              ultimaPagina: 1,
              limite: 10,
            },
          } satisfies ListarInventariosResponse);
        }
        return manager.authorizedRequest(
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
        );
      },
      [busca, enabled, manager, operations, pagina, status],
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
  const operations = useInventariosOperations();
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
  const loadData = useCallback(
    async (signal: AbortSignal): Promise<SetorDetailData> => {
      if (!validIds) throw new ApiError("invalid-response");
      return manager.authorizedRequest(async (accessToken) => {
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
      }, true);
    },
    [
      inventarioId,
      contextoRegistros,
      manager,
      operations,
      paginaPendencias,
      paginaRegistros,
      setorInventarioId,
      validIds,
    ],
  );
  const remote = useCancelableLoad(loadData);
  const [starting, setStarting] = useState(false);
  const startingRef = useRef(false);
  const [concluding, setConcluding] = useState(false);
  const concludingRef = useRef(false);
  const [mutationError, setMutationError] = useState<ApiError | null>(null);

  const start = useCallback(async () => {
    if (startingRef.current || !validIds) return false;
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
      return true;
    } catch (error) {
      const normalized = normalizeError(error);
      setMutationError(normalized);
      if (normalized.status === 409) await remote.reload();
      return false;
    } finally {
      startingRef.current = false;
      setStarting(false);
    }
  }, [inventarioId, manager, operations, remote, setorInventarioId, validIds]);

  const conclude = useCallback(async () => {
    if (concludingRef.current || !validIds) return false;
    concludingRef.current = true;
    setConcluding(true);
    setMutationError(null);
    try {
      await manager.authorizedRequest(
        (accessToken) =>
          operations.concluirSetor(inventarioId, setorInventarioId, {
            accessToken,
          }),
        false,
      );
      await remote.reload();
      return true;
    } catch (error) {
      const normalized = normalizeError(error);
      setMutationError(normalized);
      if (normalized.status === 409) await remote.reload();
      return false;
    } finally {
      concludingRef.current = false;
      setConcluding(false);
    }
  }, [inventarioId, manager, operations, remote, setorInventarioId, validIds]);

  return {
    ...remote,
    conclude,
    concluding,
    start,
    starting,
    mutationError,
  };
}
