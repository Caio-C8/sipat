"use client";
import { useCallback, useMemo, useSyncExternalStore } from "react";
import {
  CriarMovimentacaoBodySchema,
  type CriarMovimentacaoBodyData,
} from "@repo/contracts";
const evento = "sipat:movimentacao-pendente";
function assinar(callback: () => void) {
  window.addEventListener("storage", callback);
  window.addEventListener(evento, callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener(evento, callback);
  };
}
export function useConfirmacaoPendente(chave: string) {
  const obter = useCallback(() => {
    try {
      return sessionStorage.getItem(chave);
    } catch {
      return null;
    }
  }, [chave]);
  const texto = useSyncExternalStore(assinar, obter, () => null);
  const pedido = useMemo(() => {
    try {
      const parsed = CriarMovimentacaoBodySchema.safeParse(
        texto ? JSON.parse(texto) : null,
      );
      return parsed.success ? parsed.data : null;
    } catch {
      return null;
    }
  }, [texto]);
  const salvar = useCallback(
    (dados: CriarMovimentacaoBodyData | null) => {
      try {
        if (dados) sessionStorage.setItem(chave, JSON.stringify(dados));
        else sessionStorage.removeItem(chave);
        window.dispatchEvent(new Event(evento));
      } catch {
        /* O pedido permanece no estado local quando o navegador bloqueia armazenamento. */
      }
    },
    [chave],
  );
  return { pedido, salvar };
}
