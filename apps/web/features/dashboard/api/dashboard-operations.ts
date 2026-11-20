import {
  DashboardOperacionalResponseSchema,
  type DashboardOperacional,
} from "@repo/contracts";
import type { ApiClient } from "@/lib/api/core/types";

export type { DashboardOperacional } from "@repo/contracts";

export function criarOperacoesDashboard(apiClient: ApiClient) {
  return {
    async consultar(cookie: string): Promise<DashboardOperacional> {
      const resposta = await apiClient.request({
        path: "/dashboard",
        method: "GET",
        headers: { Cookie: cookie },
        cache: "no-store",
        responseSchema: DashboardOperacionalResponseSchema,
      });
      return resposta.dados;
    },
  };
}
