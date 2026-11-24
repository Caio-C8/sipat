"use client";

import type { AlterarSenhaBodyInput } from "@repo/contracts";
import { useMutacaoSemRepeticao } from "@/lib/api/client/use-mutacao-sem-repeticao";
import { browserAuth } from "@/lib/auth/browser-auth";

const alterarSenha = (body: AlterarSenhaBodyInput) =>
  browserAuth.alterarSenha(body);

export function useAlterarSenha() {
  return useMutacaoSemRepeticao(alterarSenha);
}
