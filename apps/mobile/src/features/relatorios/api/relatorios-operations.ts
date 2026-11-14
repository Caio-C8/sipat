import {
  CatalogoRelatoriosResponseSchema,
  type CatalogoRelatoriosResponse,
} from "@repo/contracts";
import { apiRequest } from "../../../lib/api/api-client";

type RequestOptions = Readonly<{
  accessToken: string;
  signal?: AbortSignal;
}>;

export function createRelatoriosOperations(baseUrl: string) {
  return {
    async catalogo(
      options: RequestOptions,
    ): Promise<CatalogoRelatoriosResponse> {
      return apiRequest({
        baseUrl,
        path: "/relatorios",
        method: "GET",
        token: options.accessToken,
        responseSchema: CatalogoRelatoriosResponseSchema,
        signal: options.signal,
      });
    },
  };
}

export type RelatoriosOperations = ReturnType<
  typeof createRelatoriosOperations
>;
