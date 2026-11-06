import "server-only";
import { serverApiClient } from "@/lib/api/server-api-client";
import { criarOperacoesDepreciacoes } from "./depreciacao-operations";

export const serverDepreciacaoOperations =
  criarOperacoesDepreciacoes(serverApiClient);
