import type { VerificarItemInventarioResultado } from "@repo/contracts";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useCallback, useRef, useState } from "react";
import { ApiError, isApiError } from "../../../lib/api/api-error";
import {
  currentSessionIdentity,
  isCurrentSession,
} from "../../../lib/query/session-mutation";
import type { SessionManager } from "../../auth/session/session-manager";
import {
  useInventariosOperations,
  useSetorInventarioDetail,
} from "../use-inventarios";
import { invalidateInventarioVerification } from "../inventario-mutation-invalidation";
import {
  parseNumeroPatrimonial,
  releaseSubmission,
  tryAcquireSubmission,
} from "./conferencia-state";

function normalizeError(error: unknown) {
  return isApiError(error) ? error : new ApiError("invalid-response");
}

export function useConferencia(
  manager: SessionManager,
  inventarioId: string,
  setorInventarioId: string,
  validIds: boolean,
) {
  const detail = useSetorInventarioDetail(
    manager,
    inventarioId,
    setorInventarioId,
    validIds,
  );
  const operations = useInventariosOperations();
  const queryClient = useQueryClient();
  const lock = useRef(false);
  const [inputError, setInputError] = useState<string | null>(null);
  const [lastResult, setLastResult] =
    useState<VerificarItemInventarioResultado | null>(null);
  const [divergenceOpen, setDivergenceOpen] = useState(false);
  const dismissLastResult = useCallback(() => setLastResult(null), []);
  const verification = useMutation<
    VerificarItemInventarioResultado,
    ApiError,
    Readonly<{
      numeroPatrimonial: string;
      identityId: string | null;
    }>
  >({
    mutationFn: async ({
      numeroPatrimonial,
    }: Readonly<{
      numeroPatrimonial: string;
      identityId: string | null;
    }>) => {
      try {
        return await manager.authorizedRequest(
          (accessToken) =>
            operations.verificarItem(
              inventarioId,
              setorInventarioId,
              numeroPatrimonial,
              { accessToken },
            ),
          false,
        );
      } catch (error) {
        throw normalizeError(error);
      }
    },
    onSuccess: (_result, variables) =>
      isCurrentSession(manager, variables.identityId)
        ? invalidateInventarioVerification(
            queryClient,
            inventarioId,
            setorInventarioId,
          )
        : undefined,
    onError: (error) => (error.status === 409 ? detail.reload() : undefined),
    retry: false,
  });

  const submit = useCallback(
    async (rawValue: string) => {
      if (!tryAcquireSubmission(lock)) return false;
      const parsed = parseNumeroPatrimonial(rawValue);
      if (!parsed.success) {
        setInputError("Informe um número patrimonial positivo.");
        releaseSubmission(lock);
        return false;
      }

      setInputError(null);
      verification.reset();
      setLastResult(null);
      setDivergenceOpen(false);
      try {
        const result = await verification.mutateAsync({
          numeroPatrimonial: parsed.data,
          identityId: currentSessionIdentity(manager),
        });
        setLastResult(result);
        setDivergenceOpen(
          result.item.situacao === "DIVERGENCIA" ||
            result.tipo === "LOCALIZACAO_POSTERIOR_REGISTRADA",
        );
        return true;
      } catch {
        return false;
      } finally {
        releaseSubmission(lock);
      }
    },
    [manager, verification],
  );

  return {
    detail,
    dismissLastResult,
    divergenceOpen,
    inputError,
    lastResult,
    mutationError: verification.error,
    setDivergenceOpen,
    submit,
    submitting: verification.isPending,
  };
}
