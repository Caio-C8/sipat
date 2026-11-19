import "server-only";

import { serverApiClient } from "@/lib/api/server-api-client";
import { criarOperacoesDashboard } from "./dashboard-operations";

export const serverDashboardOperations =
  criarOperacoesDashboard(serverApiClient);
