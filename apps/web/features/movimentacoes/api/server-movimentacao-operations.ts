import "server-only";
import { serverApiClient } from "@/lib/api/server-api-client";
import { criarOperacoesMovimentacoes } from "./movimentacao-operations";
export const serverMovimentacaoOperations =
  criarOperacoesMovimentacoes(serverApiClient);
