"use client";
import { useCallback, useRef, useState } from "react";
import type {
  CriarEmprestimoBodyInput,
  RegistrarDevolucaoEmprestimoBodyInput,
  ListarOpcoesPatrimoniosEmprestimoQueryInput,
  ListarOpcoesComissoesEmprestimoQueryInput,
} from "@repo/contracts";
import { browserApiClient } from "@/lib/api/browser-api-client";
import { criarOperacoesEmprestimos } from "./emprestimo-operations";

const operacoes = criarOperacoesEmprestimos(browserApiClient);

function useLeitura<TQuery, TResposta>(
  operacao: (query: TQuery) => Promise<TResposta>,
) {
  const [dados, setDados] = useState<TResposta | null>(null);
  const [erro, setErro] = useState<unknown>(null);
  const [loading, setLoading] = useState(false);
  const atual = useRef(0);
  const carregar = useCallback(
    async (query: TQuery) => {
      const id = ++atual.current;
      setLoading(true);
      setErro(null);
      setDados(null);
      try {
        const resposta = await operacao(query);
        if (id === atual.current) setDados(resposta);
      } catch (e) {
        if (id === atual.current) setErro(e);
      } finally {
        if (id === atual.current) setLoading(false);
      }
    },
    [operacao],
  );
  return { dados, erro, loading, carregar };
}
const buscarPatrimonios = (
  query: ListarOpcoesPatrimoniosEmprestimoQueryInput,
) => operacoes.patrimonios(query);
const buscarComissoes = (query: ListarOpcoesComissoesEmprestimoQueryInput) =>
  operacoes.comissoes(query);
export function usePatrimoniosEmprestimo() {
  return useLeitura(buscarPatrimonios);
}
export function useComissoesEmprestimo() {
  return useLeitura(buscarComissoes);
}

function useMutacao<TInput, TResposta>(
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
const criarEmprestimo = (body: CriarEmprestimoBodyInput) =>
  operacoes.criar(body);
export function useCriarEmprestimo() {
  return useMutacao(criarEmprestimo);
}
export function useDevolverEmprestimo(id: string) {
  const operacao = useCallback(
    (body: RegistrarDevolucaoEmprestimoBodyInput) =>
      operacoes.devolver(id, body),
    [id],
  );
  return useMutacao(operacao);
}
