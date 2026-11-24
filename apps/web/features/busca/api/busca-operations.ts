import {
  BuscaGlobalQuerySchema,
  BuscaGlobalResponseSchema,
  type BuscaGlobalQueryInput,
} from "@repo/contracts";
import type { ApiClient } from "@/lib/api/core/types";

export function criarOperacoesBusca(client: ApiClient) {
  return {
    buscar(query: BuscaGlobalQueryInput, signal?: AbortSignal) {
      return client.request({
        path: "/busca",
        query: BuscaGlobalQuerySchema.parse(query),
        responseSchema: BuscaGlobalResponseSchema,
        cache: "no-store",
        signal,
      });
    },
  };
}
