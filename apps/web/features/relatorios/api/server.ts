import "server-only";
import { serverApiClient } from "@/lib/api/server-api-client";
import { criarOperacoesRelatorios } from "./operations";
export const serverRelatorios = criarOperacoesRelatorios(serverApiClient);
