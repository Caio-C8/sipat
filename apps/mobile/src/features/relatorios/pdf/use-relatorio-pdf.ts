import type { TipoTabular } from "@repo/contracts";
import { useCallback, useEffect, useRef, useState } from "react";
import { publicAppConfig } from "../../../config/public-app-config";
import { ApiError, isApiError } from "../../../lib/api/api-error";
import { ApiRequestCancelledError } from "../../../lib/api/binary-api-client";
import type { SessionManager } from "../../auth/session/session-manager";
import { createRelatoriosOperations } from "../api/relatorios-operations";
import type { RelatorioPreviaRequest } from "../use-relatorio-previa";
import {
  cleanupRelatorioPdfTemporaries,
  openRelatorioPdf,
  PdfPresentationError,
  releaseWebPdfUrls,
  type PdfOpenMethod,
} from "./pdf-platform";

export class PdfEmissionCoordinator {
  private controller: AbortController | null = null;

  async run(operation: (signal: AbortSignal) => Promise<void>) {
    if (this.controller) return false;
    const controller = new AbortController();
    this.controller = controller;
    try {
      await operation(controller.signal);
    } finally {
      if (this.controller === controller) this.controller = null;
    }
    return true;
  }

  cancel() {
    this.controller?.abort();
    this.controller = null;
  }
}

export type RelatorioPdfState =
  | Readonly<{ status: "idle" }>
  | Readonly<{ status: "loading" }>
  | Readonly<{ status: "success"; method: PdfOpenMethod }>
  | Readonly<{ status: "error"; error: ApiError | PdfPresentationError }>;

function unavailableBaseUrl() {
  return "http://configuracao-indisponivel.invalid";
}

export async function emitRelatorioPdf(
  manager: SessionManager,
  request: RelatorioPreviaRequest,
  signal: AbortSignal,
) {
  await cleanupRelatorioPdfTemporaries();
  const operations = createRelatoriosOperations(
    publicAppConfig.apiBaseUrl ?? unavailableBaseUrl(),
  );
  const bytes = await manager.authorizedRequest((accessToken) => {
    const options = { accessToken, signal };
    if (request.tipo === "ficha-bem") {
      if (!request.patrimonioId) throw new ApiError("invalid-response");
      return operations.fichaPdf(request.patrimonioId, request.query, options);
    }
    return operations.pdf(request.tipo as TipoTabular, request.query, options);
  }, true);
  if (signal.aborted) throw new ApiRequestCancelledError();
  return openRelatorioPdf(bytes);
}

export function relatorioPdfErrorMessage(
  error: ApiError | PdfPresentationError,
) {
  if (error instanceof PdfPresentationError) {
    if (error.kind === "viewer-unavailable")
      return "Nenhum visualizador ou compartilhamento compatível está disponível.";
    if (error.kind === "directory-create")
      return "O dispositivo não permitiu preparar a pasta temporária.";
    if (error.kind === "file-create")
      return "O dispositivo não permitiu preparar o arquivo temporário.";
    if (error.kind === "file-write")
      return "O dispositivo não permitiu gravar o arquivo temporário.";
    if (error.kind === "file-validation")
      return "O arquivo temporário não pôde ser validado no dispositivo.";
    return "O documento foi recebido, mas não pôde ser aberto.";
  }
  if (error.status === 401)
    return "Sua sessão expirou. Entre novamente para emitir o documento.";
  if (error.status === 403)
    return "Seu perfil não tem permissão para emitir este documento.";
  if (error.status === 422)
    return "O relatório excede os limites ou os filtros não foram aceitos. Ajuste os filtros.";
  if (error.status === 429 || error.code === "RELATORIO_LIMITE_EXCEDIDO")
    return error.retryAfterSeconds
      ? `Já existe uma emissão em andamento. Tente novamente em ${error.retryAfterSeconds} segundos.`
      : "Já existe uma emissão em andamento. Aguarde e tente novamente.";
  if (error.status === 503 || error.code === "RELATORIO_INDISPONIVEL")
    return "A emissão está temporariamente indisponível.";
  if (error.kind === "timeout" || error.code === "RELATORIO_TEMPO_EXCEDIDO")
    return "A emissão excedeu o tempo limite de 25 segundos. Refine os filtros e tente novamente.";
  if (error.kind === "network")
    return "Sem conexão. Verifique sua internet e tente novamente.";
  return "A API não retornou um PDF válido. Nenhum arquivo foi aberto ou preservado.";
}

export function useRelatorioPdf(
  manager: SessionManager,
  request: RelatorioPreviaRequest,
) {
  const [state, setState] = useState<RelatorioPdfState>({ status: "idle" });
  const coordinator = useRef(new PdfEmissionCoordinator());

  const emit = useCallback(async () => {
    await coordinator.current.run(async (signal) => {
      setState({ status: "loading" });
      try {
        const method = await emitRelatorioPdf(manager, request, signal);
        if (!signal.aborted) setState({ status: "success", method });
      } catch (error) {
        if (signal.aborted || error instanceof ApiRequestCancelledError) return;
        setState({
          status: "error",
          error:
            isApiError(error) || error instanceof PdfPresentationError
              ? error
              : new PdfPresentationError("open", { cause: error }),
        });
      }
    });
  }, [manager, request]);

  useEffect(
    () => () => {
      coordinator.current.cancel();
      releaseWebPdfUrls();
    },
    [],
  );

  return { state, emit };
}
