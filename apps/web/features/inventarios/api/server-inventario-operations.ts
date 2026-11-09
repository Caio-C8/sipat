import "server-only";
import { serverApiClient } from "@/lib/api/server-api-client";
import { criarOperacoesInventarios } from "./inventario-operations";

export const serverInventarioOperations =
  criarOperacoesInventarios(serverApiClient);
