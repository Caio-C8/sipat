import "server-only";
import { createApiClient } from "./core/create-api-client";
import { instrumentarApiClient } from "@/lib/observability/api-operations";

const apiInternalUrl = process.env.API_INTERNAL_URL ?? "http://localhost:3001";

const serverApiClientBase = createApiClient({
  baseUrl: `${apiInternalUrl}/api`,
});

export const serverApiClient = instrumentarApiClient(serverApiClientBase, {
  origem: "servidor",
});
