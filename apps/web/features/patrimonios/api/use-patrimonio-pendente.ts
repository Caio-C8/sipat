"use client";

import { useCallback, useMemo, useSyncExternalStore } from "react";
import {
  CriarPatrimonioBodySchema,
  type CriarPatrimonioBodyData,
} from "@repo/contracts";

const evento = "sipat:patrimonio-pendente";

function assinar(callback: () => void) {
  window.addEventListener("storage", callback);
  window.addEventListener(evento, callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener(evento, callback);
  };
}

export function usePatrimonioPendente(usuarioId: string) {
  const chave = `sipat.patrimonio.pendente.${usuarioId}`;
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
      const validacao = CriarPatrimonioBodySchema.safeParse(
        texto ? JSON.parse(texto) : null,
      );
      return validacao.success ? validacao.data : null;
    } catch {
      return null;
    }
  }, [texto]);
  const salvar = useCallback(
    (dados: CriarPatrimonioBodyData | null) => {
      try {
        if (dados) sessionStorage.setItem(chave, JSON.stringify(dados));
        else sessionStorage.removeItem(chave);
        window.dispatchEvent(new Event(evento));
      } catch {
        return;
      }
    },
    [chave],
  );

  return { pedido, salvar };
}