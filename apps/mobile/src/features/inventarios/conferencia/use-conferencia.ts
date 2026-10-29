import type { VerificarItemInventarioResultado } from "@repo/contracts";
import { useCallback, useRef, useState } from "react";
import { ApiError, isApiError } from "../../../lib/api/api-error";
import type { SessionManager } from "../../auth/session/session-manager";
import {
  useInventariosOperations,
  useSetorInventarioDetail,
} from "../use-inventarios";
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
  const lock = useRef(false);
  const [submitting, setSubmitting] = useState(false);
  const [inputError, setInputError] = useState<string | null>(null);
  const [mutationError, setMutationError] = useState<ApiError | null>(null);
  const [lastResult, setLastResult] =
    useState<VerificarItemInventarioResultado | null>(null);
  const [divergenceOpen, setDivergenceOpen] = useState(false);

  const submit = useCallback(
    async (rawValue: string) => {
      if (!tryAcquireSubmission(lock)) return false;
      const parsed = parseNumeroPatrimonial(rawValue);
      if (!parsed.success) {
        setInputError(
          "Informe um número positivo sem zeros à esquerda ou use SP- seguido do número.",
        );
        releaseSubmission(lock);
        return false;
      }

      setSubmitting(true);
      setInputError(null);
      setMutationError(null);
      try {
        const result = await manager.authorizedRequest(
          (accessToken) =>
            operations.verificarItem(
              inventarioId,
              setorInventarioId,
              parsed.data,
              { accessToken },
            ),
          false,
        );
        await detail.reload();
        setLastResult(result);
        setDivergenceOpen(result.item.situacao === "DIVERGENCIA");
        return true;
      } catch (error) {
        const normalized = normalizeError(error);
        setMutationError(normalized);
        if (normalized.status === 409) await detail.reload();
        return false;
      } finally {
        setSubmitting(false);
        releaseSubmission(lock);
      }
    },
    [detail, inventarioId, manager, operations, setorInventarioId],
  );

  return {
    detail,
    divergenceOpen,
    inputError,
    lastResult,
    mutationError,
    setDivergenceOpen,
    submit,
    submitting,
  };
}
