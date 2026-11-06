import "server-only";
import { serverApiClient } from "@/lib/api/server-api-client";
import { criarOperacoesCadastros } from "./cadastro-operations";
export const serverCadastros = criarOperacoesCadastros(serverApiClient);
