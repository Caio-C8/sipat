"use client";
import { useCallback, useRef, useState } from "react";
import type {
  CriarMovimentacaoBodyInput,
  ListarOpcoesMovimentacaoQueryInput,
  ListarPatrimoniosQueryInput,
} from "@repo/contracts";
import { browserApiClient } from "@/lib/api/browser-api-client";
import { useMutacaoSemRepeticao } from "@/lib/api/client/use-mutacao-sem-repeticao";
import { criarOperacoesMovimentacoes } from "./movimentacao-operations";
const operacoes = criarOperacoesMovimentacoes(browserApiClient);
export function usePatrimoniosMovimentacao() {
  const [dados, setDados] = useState<Awaited<
    ReturnType<typeof operacoes.patrimonios>
  > | null>(null);
  const [erro, setErro] = useState<unknown>(null);
  const [loading, setLoading] = useState(true);
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
export function useSetoresMovimentacao() {
  const [dados, setDados] = useState<Awaited<
    ReturnType<typeof operacoes.setores>
  > | null>(null);
  const [erro, setErro] = useState<unknown>(null);
  const [loading, setLoading] = useState(true);
  const atual = useRef(0);
  const carregar = useCallback(
    async (query: ListarOpcoesMovimentacaoQueryInput) => {
      const id = ++atual.current;
      setLoading(true);
      setErro(null);
      try {
        const resposta = await operacoes.setores(query);
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
export function useComissoesMovimentacao() {
  const [dados, setDados] = useState<Awaited<
    ReturnType<typeof operacoes.comissoes>
  > | null>(null);
  const [erro, setErro] = useState<unknown>(null);
  const [loading, setLoading] = useState(true);
  const atual = useRef(0);
  const carregar = useCallback(
    async (query: ListarOpcoesMovimentacaoQueryInput) => {
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
export function useAtualizarPatrimonioMovimentacao() {
  const [pending, setPending] = useState(false);
  const atualizar = useCallback(async (id: string) => {
    setPending(true);
    try {
      return (await operacoes.patrimonio(id)).dados;
    } finally {
      setPending(false);
    }
  }, []);
  return { pending, atualizar };
}
export function useCriarMovimentacao() {
  return useMutacaoSemRepeticao((body: CriarMovimentacaoBodyInput) =>
    operacoes.criar(body),
  );
}
