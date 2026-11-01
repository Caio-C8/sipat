"use client";
import { useCallback, useRef, useState } from "react";
import type {
  CriarEmprestimoBodyInput,
  RegistrarDevolucaoEmprestimoBodyInput,
  ListarOpcoesPatrimoniosEmprestimoQueryInput,
  ListarOpcoesComissoesEmprestimoQueryInput,
} from "@repo/contracts";
import { browserApiClient } from "@/lib/api/browser-api-client";
import { useMutacaoSemRepeticao } from "@/lib/api/client/use-mutacao-sem-repeticao";
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

export function useConsultarEmprestimo(id: string) {
  const consultar = useCallback(
    async () => (await operacoes.consultar(id)).dados,
    [id],
  );
  return { consultar };
}

const criarEmprestimo = (body: CriarEmprestimoBodyInput) =>
  operacoes.criar(body);
export function useCriarEmprestimo() {
  return useMutacaoSemRepeticao(criarEmprestimo);
}
export function useDevolverEmprestimo(id: string) {
  const operacao = useCallback(
    (body: RegistrarDevolucaoEmprestimoBodyInput) =>
      operacoes.devolver(id, body),
    [id],
  );
  return useMutacaoSemRepeticao(operacao);
}
