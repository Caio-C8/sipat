import "server-only";
import { serverApiClient } from "@/lib/api/server-api-client";
import { criarOperacoesManutencoes } from "./manutencao-operations";
export const serverManutencaoOperations =
  criarOperacoesManutencoes(serverApiClient);
