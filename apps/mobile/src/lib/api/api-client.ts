import { ApiError, parseHttpError } from "./api-error";

const DEFAULT_TIMEOUT_MS = 8_000;

export type ApiRequest<T> = Readonly<{
  path: string;
  method: "GET" | "POST";
  baseUrl: string;
  token?: string;
  body?: unknown;
  responseSchema?: Readonly<{
    safeParse(
      value: unknown,
    ): Readonly<{ success: true; data: T }> | Readonly<{ success: false }>;
  }>;
  signal?: AbortSignal;
}>;

export async function apiRequest<T = void>({
  path,
  method,
  baseUrl,
  token,
  body,
  responseSchema,
  signal,
}: ApiRequest<T>): Promise<T> {
  const controller = new AbortController();
  let timedOut = false;
  const abortFromCaller = () => controller.abort();
  signal?.addEventListener("abort", abortFromCaller, { once: true });
  const timeout = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, DEFAULT_TIMEOUT_MS);

  let response: Response;
  try {
    response = await fetch(`${baseUrl}/api${path}`, {
      method,
      headers: {
        Accept: "application/json",
        ...(body === undefined ? {} : { "Content-Type": "application/json" }),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: controller.signal,
    });
  } catch (cause) {
    if (timedOut)
      throw new ApiError("timeout", undefined, undefined, [], undefined, {
        cause,
      });
    throw new ApiError("network", undefined, undefined, [], undefined, {
      cause,
    });
  } finally {
    clearTimeout(timeout);
    signal?.removeEventListener("abort", abortFromCaller);
  }

  const hasJson = response.headers
    .get("content-type")
    ?.includes("application/json");
  let payload: unknown;
  try {
    payload = hasJson ? await response.json() : undefined;
  } catch (cause) {
    throw new ApiError(
      "invalid-response",
      response.status,
      undefined,
      [],
      undefined,
      { cause },
    );
  }

  if (!response.ok) {
    throw parseHttpError(
      response.status,
      payload,
      response.headers.get("retry-after"),
    );
  }
  if (!responseSchema) return undefined as T;

  const parsed = responseSchema.safeParse(payload);
  if (!parsed.success) throw new ApiError("invalid-response", response.status);
  return parsed.data;
}
