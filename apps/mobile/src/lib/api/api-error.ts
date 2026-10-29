import { RespostaErroSchema, type ErroCampo } from "@repo/contracts";

export type ApiErrorKind = "http" | "network" | "timeout" | "invalid-response";

export class ApiError extends Error {
  constructor(
    readonly kind: ApiErrorKind,
    readonly status?: number,
    readonly code?: string,
    readonly fieldErrors: readonly ErroCampo[] = [],
    readonly retryAfterSeconds?: number,
    readonly data?: unknown,
    options?: ErrorOptions,
  ) {
    super(messageFor(kind, status), options);
    this.name = "ApiError";
  }
}

function messageFor(kind: ApiErrorKind, status?: number) {
  if (kind === "timeout") return "A API demorou para responder.";
  if (kind === "network") return "Não foi possível alcançar a API.";
  if (kind === "invalid-response")
    return "A API retornou uma resposta inválida.";
  return `A API respondeu com HTTP ${status ?? "desconhecido"}.`;
}

export function parseHttpError(
  status: number,
  payload: unknown,
  retryAfter: string | null,
): ApiError {
  const objectPayload =
    typeof payload === "object" && payload !== null && !Array.isArray(payload)
      ? payload
      : null;
  const parsed = RespostaErroSchema.safeParse(
    objectPayload
      ? {
          status: Reflect.get(objectPayload, "status"),
          sucesso: Reflect.get(objectPayload, "sucesso"),
          codigo: Reflect.get(objectPayload, "codigo"),
          mensagem: Reflect.get(objectPayload, "mensagem"),
          erros: Reflect.get(objectPayload, "erros"),
          requisicaoId: Reflect.get(objectPayload, "requisicaoId"),
        }
      : payload,
  );
  const retryAfterSeconds = retryAfter ? Number(retryAfter) : undefined;
  return new ApiError(
    "http",
    status,
    parsed.success ? parsed.data.codigo : undefined,
    parsed.success ? parsed.data.erros : [],
    Number.isFinite(retryAfterSeconds) ? retryAfterSeconds : undefined,
    objectPayload ? Reflect.get(objectPayload, "dados") : undefined,
  );
}

export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}
