"use client";

import { useCallback, useEffect, useRef, useState } from "react";
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

export function useResumoPendenciasDepreciacao() {
  const [dados, setDados] = useState<
    | Awaited<ReturnType<typeof operacoes.consultarResumoPendencias>>["dados"]
    | null
  >(null);
  const [erro, setErro] = useState<unknown>(null);
  const [loading, setLoading] = useState(false);
  const controller = useRef<AbortController | null>(null);

  const carregar = useCallback(async () => {
    if (controller.current) return;
    const atual = new AbortController();
    controller.current = atual;
    setLoading(true);
    setErro(null);
    try {
      const resposta = await operacoes.consultarResumoPendencias({
        signal: atual.signal,
      });
      setDados(resposta.dados);
    } catch (falha) {
      if (!atual.signal.aborted) setErro(falha);
    } finally {
      if (controller.current === atual) controller.current = null;
      if (!atual.signal.aborted) setLoading(false);
    }
  }, []);

  useEffect(() => () => controller.current?.abort(), []);
  return { dados, erro, loading, carregar };
}
