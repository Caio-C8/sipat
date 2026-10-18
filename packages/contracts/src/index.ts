export * from "./common";
export * from "./auth";
export * from "./usuario";

export type AppEnvironment = "development" | "staging" | "production" | "test";

export interface HealthResponse {
  status: "ok";
  service: string;
  environment: AppEnvironment;
  version: string;
  timestamp: string;
}
