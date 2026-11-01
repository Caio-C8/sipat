"use client";

import { useCallback, useRef, useState } from "react";

export function useMutacaoSemRepeticao<TInput, TResposta>(
  operacao: (input: TInput) => Promise<TResposta>,
) {
  const [pending, setPending] = useState(false);
  const emCurso = useRef(false);
  const confirmar = useCallback(
    async (input: TInput): Promise<TResposta | null> => {
      if (emCurso.current) return null;
      emCurso.current = true;
      setPending(true);
      try {
        return await operacao(input);
      } finally {
        emCurso.current = false;
        setPending(false);
      }
    },
    [operacao],
  );

  return { pending, confirmar };
}
