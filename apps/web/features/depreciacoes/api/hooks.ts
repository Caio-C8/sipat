"use client";

import { useCallback, useRef, useState } from "react";
import type {
  ExecutarDepreciacaoPatrimonioResponse,
  ExecutarDepreciacoesEmMassaResponse,
} from "@repo/contracts";
import { browserApiClient } from "@/lib/api/browser-api-client";
import { criarOperacoesDepreciacoes } from "./depreciacao-operations";

const operacoes = criarOperacoesDepreciacoes(browserApiClient);

export function useExecutarDepreciacoesEmMassa() {
  const [pending, setPending] = useState(false);
  const executando = useRef(false);
  const executar = useCallback(
    async (body: {
      competencia: string;
      comissaoId: string;
      confirmarIgnorarValorResidual: boolean;
    }): Promise<ExecutarDepreciacoesEmMassaResponse> => {
      if (executando.current)
        throw new Error("A operação já está em andamento.");
      executando.current = true;
      setPending(true);
      try {
        return await operacoes.executarEmMassa(body);
      } finally {
        executando.current = false;
        setPending(false);
      }
    },
    [],
  );
  return { pending, executar };
}

export function useExecutarDepreciacaoIndividual() {
  const [pendingId, setPendingId] = useState<string | null>(null);
  const executando = useRef(false);
  const executar = useCallback(
    async (
      patrimonioId: string,
      body: {
        competencia: string;
        comissaoId: string;
        confirmarIgnorarValorResidual: boolean;
      },
    ): Promise<ExecutarDepreciacaoPatrimonioResponse> => {
      if (executando.current)
        throw new Error("A operação já está em andamento.");
      executando.current = true;
      setPendingId(patrimonioId);
      try {
        return await operacoes.executarIndividual(patrimonioId, body);
      } finally {
        executando.current = false;
        setPendingId(null);
      }
    },
    [],
  );
  return { pendingId, executar };
}
