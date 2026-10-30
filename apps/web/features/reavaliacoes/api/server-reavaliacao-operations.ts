import "server-only";
import { serverApiClient } from "@/lib/api/server-api-client";
import { criarOperacoesReavaliacoes } from "./reavaliacao-operations";

export const serverReavaliacaoOperations =
  criarOperacoesReavaliacoes(serverApiClient);
