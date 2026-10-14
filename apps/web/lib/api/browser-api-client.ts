import "client-only";
import { createApiClient } from "./core/create-api-client";
import { instrumentarApiClient } from "@/lib/observability/api-operations";

const browserApiClientBase = createApiClient({
  baseUrl: "/api/backend",
});

export const browserApiClient = instrumentarApiClient(browserApiClientBase, {
  origem: "navegador",
});
