import type { AppEnvironment, HealthResponse } from "@repo/contracts";

const APP_ENVIRONMENTS = new Set<AppEnvironment>([
  "development",
  "staging",
  "production",
  "test",
]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isHealthResponse(value: unknown): value is HealthResponse {
  if (!isRecord(value)) {
    return false;
  }

  return (
    value.status === "ok" &&
    typeof value.service === "string" &&
    typeof value.environment === "string" &&
    APP_ENVIRONMENTS.has(value.environment as AppEnvironment) &&
    typeof value.version === "string" &&
    typeof value.timestamp === "string" &&
    !Number.isNaN(Date.parse(value.timestamp))
  );
}

export async function getApiHealth(
  url: string,
  signal: AbortSignal,
): Promise<HealthResponse> {
  const response = await fetch(url, {
    headers: {
      Accept: "application/json",
    },
    signal,
  });

  if (!response.ok) {
    throw new Error(`A API respondeu com HTTP ${response.status}.`);
  }

  const payload: unknown = await response.json();

  if (!isHealthResponse(payload)) {
    throw new Error("A API retornou um health check inválido.");
  }

  return payload;
}
