import Constants from "expo-constants";
import type { AppEnvironment } from "@repo/contracts";

const DEFAULT_APP_NAME = "SIPAT";
const DEFAULT_APP_ENVIRONMENT: AppEnvironment = "development";
const DEFAULT_API_PORT = 3001;

const APP_ENVIRONMENTS = [
  "development",
  "staging",
  "production",
  "test",
] as const satisfies readonly AppEnvironment[];

export type PublicAppConfig = Readonly<{
  appName: string;
  appVersion: string;
  environment: AppEnvironment;
  apiHealthUrl?: string;
}>;

function isAppEnvironment(value: string): value is AppEnvironment {
  return APP_ENVIRONMENTS.some((environment) => environment === value);
}

function normalizeBaseUrl(value: string | undefined): string | undefined {
  const normalized = value?.trim().replace(/\/+$/, "");
  return normalized || undefined;
}

function getDevelopmentApiUrl(
  hostUri: string | undefined,
  portValue: string | undefined,
): string | undefined {
  if (!hostUri) {
    return undefined;
  }

  const port = Number(portValue ?? DEFAULT_API_PORT);

  if (!Number.isInteger(port) || port <= 0 || port > 65_535) {
    throw new Error("EXPO_PUBLIC_API_PORT deve ser uma porta TCP válida.");
  }

  try {
    const metroUrl = new URL(`http://${hostUri}`);
    return `http://${metroUrl.hostname}:${port}`;
  } catch {
    return undefined;
  }
}

export function getPublicAppConfig(
  appName: string | undefined,
  environment: string | undefined,
  apiBaseUrl: string | undefined,
  apiPort: string | undefined,
  hostUri: string | undefined,
): PublicAppConfig {
  const normalizedEnvironment = environment ?? DEFAULT_APP_ENVIRONMENT;

  if (!isAppEnvironment(normalizedEnvironment)) {
    throw new Error(
      "EXPO_PUBLIC_APP_ENV deve ser development, staging, production ou test.",
    );
  }

  const resolvedApiBaseUrl =
    normalizeBaseUrl(apiBaseUrl) ??
    (normalizedEnvironment === "development"
      ? getDevelopmentApiUrl(hostUri, apiPort)
      : undefined);

  return Object.freeze({
    appName: appName?.trim() || DEFAULT_APP_NAME,
    appVersion: Constants.expoConfig?.version ?? "0.1.0",
    environment: normalizedEnvironment,
    apiHealthUrl: resolvedApiBaseUrl
      ? `${resolvedApiBaseUrl}/api/health`
      : undefined,
  });
}

export const publicAppConfig = getPublicAppConfig(
  process.env.EXPO_PUBLIC_APP_NAME,
  process.env.EXPO_PUBLIC_APP_ENV,
  process.env.EXPO_PUBLIC_API_URL,
  process.env.EXPO_PUBLIC_API_PORT,
  Constants.expoConfig?.hostUri,
);
