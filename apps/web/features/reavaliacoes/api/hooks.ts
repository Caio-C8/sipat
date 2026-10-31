"use client";

import { useCallback, useRef, useState } from "react";
import type {
  CriarReavaliacaoBodyInput,
  ListarOpcoesComissaoReavaliacaoQueryInput,
  ListarPatrimoniosQueryInput,
  PreviaReavaliacaoBodyInput,
} from "@repo/contracts";
import { browserApiClient } from "@/lib/api/browser-api-client";
import { criarOperacoesReavaliacoes } from "./reavaliacao-operations";

const operacoes = criarOperacoesReavaliacoes(browserApiClient);

export function usePatrimoniosReavaliacao() {
  const [dados, setDados] = useState<Awaited<
    ReturnType<typeof operacoes.patrimonios>
  > | null>(null);
  const [erro, setErro] = useState<unknown>(null);
  const [loading, setLoading] = useState(false);
  const atual = useRef(0);
  const carregar = useCallback(async (query: ListarPatrimoniosQueryInput) => {
    const id = ++atual.current;
    setLoading(true);
    setErro(null);
    try {
      const resposta = await operacoes.patrimonios(query);
      if (id === atual.current) setDados(resposta);
    } catch (e) {
      if (id === atual.current) setErro(e);
    } finally {
      if (id === atual.current) setLoading(false);
    }
  }, []);
  return { dados, erro, loading, carregar };
}

export function usePatrimonioReavaliacao() {
  const [pending, setPending] = useState(false);
  const consultar = useCallback(async (id: string) => {
    setPending(true);
    try {
      return (await operacoes.patrimonio(id)).dados;
    } finally {
      setPending(false);
    }
  }, []);
  return { pending, consultar };
}

export function useComissoesReavaliacao() {
  const [dados, setDados] = useState<Awaited<
    ReturnType<typeof operacoes.comissoes>
  > | null>(null);
  const [erro, setErro] = useState<unknown>(null);
  const [loading, setLoading] = useState(false);
  const atual = useRef(0);
  const carregar = useCallback(
    async (query: ListarOpcoesComissaoReavaliacaoQueryInput) => {
      const id = ++atual.current;
      setLoading(true);
      setErro(null);
      try {
        const resposta = await operacoes.comissoes(query);
        if (id === atual.current) setDados(resposta);
      } catch (e) {
        if (id === atual.current) setErro(e);
      } finally {
        if (id === atual.current) setLoading(false);
      }
    },
    [],
  );
  return { dados, erro, loading, carregar };
}

export function usePreviaReavaliacao() {
  const [pending, setPending] = useState(false);
  const gerar = useCallback(async (body: PreviaReavaliacaoBodyInput) => {
    setPending(true);
    try {
      return await operacoes.previa(body);
    } finally {
      setPending(false);
    }
  }, []);
  return { pending, gerar };
}

export function useCriarReavaliacao() {
  const [pending, setPending] = useState(false);
  const emCurso = useRef(false);
  const confirmar = useCallback(async (body: CriarReavaliacaoBodyInput) => {
    if (emCurso.current) return null;
    emCurso.current = true;
    setPending(true);
    try {
      return await operacoes.criar(body);
    } finally {
      emCurso.current = false;
      setPending(false);
    }
  }, []);
  return { pending, confirmar };
}
