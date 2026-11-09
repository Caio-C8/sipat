import "server-only";
import { serverApiClient } from "@/lib/api/server-api-client";
import { criarOperacoesUsuarios } from "./usuario-operations";

export const serverUsuarioOperations = criarOperacoesUsuarios(serverApiClient);
