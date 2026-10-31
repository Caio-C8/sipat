import "server-only";
import { serverApiClient } from "@/lib/api/server-api-client";
import { criarOperacoesEmprestimos } from "./emprestimo-operations";
export const serverEmprestimoOperations =
  criarOperacoesEmprestimos(serverApiClient);
