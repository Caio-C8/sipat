import { ApiError, parseHttpError } from "./api-error";

export const PDF_MAX_BYTES = 10 * 1024 * 1024;
export const PDF_TIMEOUT_MS = 25_000;

export class ApiRequestCancelledError extends Error {
  constructor(options?: ErrorOptions) {
    super("A requisição foi cancelada.", options);
    this.name = "ApiRequestCancelledError";
  }
}

type BinaryRequest = Readonly<{
  baseUrl: string;
  path: string;
  token: string;
  query?: Readonly<Record<string, string | number | boolean | undefined>>;
  signal?: AbortSignal;
  timeoutMs?: number;
  maxBytes?: number;
}>;

function urlFor(request: BinaryRequest) {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(request.query ?? {})) {
    if (value !== undefined) search.set(key, String(value));
  }
  const query = search.toString();
  return `${request.baseUrl}${request.path}${query ? `?${query}` : ""}`;
}

function isPdf(bytes: Uint8Array) {
  if (bytes.length < 10) return false;
  const signature = String.fromCharCode(...bytes.subarray(0, 5));
  if (signature !== "%PDF-") return false;
  const tail = bytes.subarray(Math.max(0, bytes.length - 1_024));
  return new TextDecoder("ascii").decode(tail).includes("%%EOF");
}

export async function apiBinaryRequest(
  request: BinaryRequest,
): Promise<Uint8Array> {
  const controller = new AbortController();
  let timedOut = false;
  const abortFromCaller = () => controller.abort();
  request.signal?.addEventListener("abort", abortFromCaller, { once: true });
  const timeout = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, request.timeoutMs ?? PDF_TIMEOUT_MS);

  let response: Response;
  try {
    response = await fetch(urlFor(request), {
      method: "GET",
      headers: {
        Accept: "application/pdf",
        Authorization: `Bearer ${request.token}`,
      },
      signal: controller.signal,
    });
  } catch (cause) {
    if (request.signal?.aborted) throw new ApiRequestCancelledError({ cause });
    throw new ApiError(
      timedOut ? "timeout" : "network",
      undefined,
      undefined,
      [],
      undefined,
      undefined,
      {
        cause,
      },
    );
  } finally {
    clearTimeout(timeout);
    request.signal?.removeEventListener("abort", abortFromCaller);
  }

  if (!response.ok) {
    let payload: unknown;
    if (response.headers.get("content-type")?.includes("application/json")) {
      try {
        payload = await response.json();
      } catch {
        payload = undefined;
      }
    }
    throw parseHttpError(
      response.status,
      payload,
      response.headers.get("retry-after"),
    );
  }

  const contentType = response.headers.get("content-type")?.split(";", 1)[0];
  if (contentType?.trim().toLowerCase() !== "application/pdf")
    throw new ApiError("invalid-response", response.status);

  const maxBytes = request.maxBytes ?? PDF_MAX_BYTES;
  const declaredSize = Number(response.headers.get("content-length"));
  if (Number.isFinite(declaredSize) && declaredSize > maxBytes)
    throw new ApiError("invalid-response", response.status);

  let bytes: Uint8Array;
  try {
    bytes = new Uint8Array(await response.arrayBuffer());
  } catch (cause) {
    throw new ApiError(
      "invalid-response",
      response.status,
      undefined,
      [],
      undefined,
      undefined,
      {
        cause,
      },
    );
  }
  if (bytes.length > maxBytes || !isPdf(bytes))
    throw new ApiError("invalid-response", response.status);
  return bytes;
}
