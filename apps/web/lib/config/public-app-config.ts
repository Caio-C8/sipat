import type { AppEnvironment } from "@repo/contracts";

const DEFAULT_APP_NAME = "Project Starter";
const DEFAULT_APP_ENVIRONMENT: AppEnvironment = "development";

const APP_ENVIRONMENTS = [
  "development",
  "staging",
  "production",
  "test",
] as const satisfies readonly AppEnvironment[];

export type PublicAppConfig = Readonly<{
  appName: string;
  environment: AppEnvironment;
}>;

function isAppEnvironment(value: string): value is AppEnvironment {
  return APP_ENVIRONMENTS.some((environment) => environment === value);
}

export function obterConfiguracaoPublica(
  appName: string | undefined,
  environment: string | undefined,
): PublicAppConfig {
  const normalizedAppName = appName?.trim() || DEFAULT_APP_NAME;
  const normalizedEnvironment = environment ?? DEFAULT_APP_ENVIRONMENT;

  if (!isAppEnvironment(normalizedEnvironment)) {
    throw new Error(
      "NEXT_PUBLIC_APP_ENV deve ser development, staging, production ou test.",
    );
  }

  return Object.freeze({
    appName: normalizedAppName,
    environment: normalizedEnvironment,
  });
}

export const publicAppConfig = obterConfiguracaoPublica(
  process.env.NEXT_PUBLIC_APP_NAME,
  process.env.NEXT_PUBLIC_APP_ENV,
);
