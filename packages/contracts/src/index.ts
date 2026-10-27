export * from "./common";
export * from "./auth";
export * from "./usuario";
export * from "./patrimonio";
export * from "./responsavel";
export * from "./natureza";
export * from "./especie";
export * from "./setor";
export * from "./fornecedor";
export * from "./processo-compra";
export * from "./nota-fiscal";
export * from "./comissao";
export * from "./inventario";
export * from "./baixa-patrimonio";

export type AppEnvironment = "development" | "staging" | "production" | "test";

export interface HealthResponse {
  status: "ok";
  service: string;
  environment: AppEnvironment;
  version: string;
  timestamp: string;
}
