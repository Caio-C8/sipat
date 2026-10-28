import type { AppEnvironment } from "@repo/contracts";
import { appRoutes } from "./routes";

export function isCheckRouteAvailable(environment: AppEnvironment): boolean {
  return environment === "development";
}

export function shouldBypassSessionGate(
  pathname: string,
  environment: AppEnvironment,
): boolean {
  return isCheckRouteAvailable(environment) && pathname === appRoutes.check;
}
