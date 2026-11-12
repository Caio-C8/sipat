"use client";
import type * as z from "zod";
import { browserApiClient } from "@/lib/api/browser-api-client";
import { useMutacaoSemRepeticao } from "@/lib/api/client/use-mutacao-sem-repeticao";
import { criarOperacoesCadastros } from "./cadastro-operations";
export const browserCadastros = criarOperacoesCadastros(browserApiClient);

import { useCallback, useEffect, useRef, useState } from "react";
import { criarOperacoesComplementares } from "./complementos";
const complementos = criarOperacoesComplementares(browserApiClient);
export function useCriarProcessoCompra() {
  return useMutacaoSemRepeticao(complementos.criarProcesso);
}
export function useCriarNotaFiscal() {
  return useMutacaoSemRepeticao(complementos.criarNota);
}
export function useSubstituirAnexoNotaFiscal() {
  return useMutacaoSemRepeticao(complementos.substituirAnexo);
}
export function useRemoverAnexoNotaFiscal() {
  return useMutacaoSemRepeticao(complementos.removerAnexo);
}
export function useAdicionarMembroComissao() {
  return useMutacaoSemRepeticao(complementos.adicionarMembro);
}
export function useAlterarMembroComissao() {
  return useMutacaoSemRepeticao(complementos.alterarMembro);
}
export function useRemoverMembroComissao() {
  return useMutacaoSemRepeticao(complementos.removerMembro);
}
export type OpcaoCadastro = { id: string; rotulo: string };
type QueryOpcoes = { busca?: string; pagina?: string; limite?: string };
type ResultadoOpcoes = {
  dados: OpcaoCadastro[];
  meta: { pagina: number; ultimaPagina: number; total: number };
};
function useConsultaOpcoes(
  operacao: (
    query: QueryOpcoes,
    signal: AbortSignal,
  ) => Promise<ResultadoOpcoes>,
) {
  const [dados, setDados] = useState<ResultadoOpcoes | null>(null);
  const [erro, setErro] = useState<unknown>(null);
  const [loading, setLoading] = useState(false);
  const controller = useRef<AbortController | null>(null);
  useEffect(() => () => controller.current?.abort(), []);
  const carregar = useCallback(
    async (query: QueryOpcoes) => {
      controller.current?.abort();
      const atual = new AbortController();
      controller.current = atual;
      setLoading(true);
      setErro(null);
      try {
        const resultado = await operacao(query, atual.signal);
        if (!atual.signal.aborted) setDados(resultado);
      } catch (e) {
        if (!atual.signal.aborted) setErro(e);
      } finally {
        if (!atual.signal.aborted) setLoading(false);
      }
    },
    [operacao],
  );
  return { dados, erro, loading, carregar };
}
const naturezasOpcoes = async (query: QueryOpcoes, signal: AbortSignal) => {
  const r = await browserCadastros.naturezas.listar(query, { signal });
  return { ...r, dados: r.dados.map((x) => ({ id: x.id, rotulo: x.nome })) };
};
const responsaveisOpcoes = async (query: QueryOpcoes, signal: AbortSignal) => {
  const r = await browserCadastros.responsaveis.listar(
    { ...query, ativo: "true" },
    { signal },
  );
  return {
    ...r,
    dados: r.dados.map((x) => ({
      id: x.id,
      rotulo: x.nome + " · " + x.matricula,
    })),
  };
};
const fornecedoresOpcoes = async (query: QueryOpcoes, signal: AbortSignal) => {
  const r = await complementos.fornecedores(
    { ...query, ativo: "true" },
    { signal },
  );
  return {
    ...r,
    dados: r.dados.map((x) => ({ id: x.id, rotulo: x.razaoSocial })),
  };
};
export function useListarNaturezas() {
  return useConsultaOpcoes(naturezasOpcoes);
}
export function useListarResponsaveisAtivos() {
  return useConsultaOpcoes(responsaveisOpcoes);
}
export function useListarFornecedoresAtivos() {
  return useConsultaOpcoes(fornecedoresOpcoes);
}

export function useCriarNatureza() {
  return useMutacaoSemRepeticao(browserCadastros.naturezas.criar);
}
export function useAlterarNatureza() {
  return useMutacaoSemRepeticao(
    (input: {
      id: string;
      body: z.input<typeof import("@repo/contracts").AlterarNaturezaSchema>;
    }) => browserCadastros.naturezas.alterar(input.id, input.body),
  );
}
export function useCriarEspecie() {
  return useMutacaoSemRepeticao(browserCadastros.especies.criar);
}
export function useAlterarEspecie() {
  return useMutacaoSemRepeticao(
    (input: {
      id: string;
      body: z.input<typeof import("@repo/contracts").AlterarEspecieSchema>;
    }) => browserCadastros.especies.alterar(input.id, input.body),
  );
}
export function useCriarResponsavel() {
  return useMutacaoSemRepeticao(browserCadastros.responsaveis.criar);
}
export function useAlterarResponsavel() {
  return useMutacaoSemRepeticao(
    (input: {
      id: string;
      body: z.input<typeof import("@repo/contracts").AlterarResponsavelSchema>;
    }) => browserCadastros.responsaveis.alterar(input.id, input.body),
  );
}
export function useAlterarSituacaoResponsavel() {
  return useMutacaoSemRepeticao((input: { id: string; ativo: boolean }) =>
    browserCadastros.responsaveis.situacao(input.id, input.ativo),
  );
}
export function useCriarSetor() {
  return useMutacaoSemRepeticao(browserCadastros.setores.criar);
}
export function useAlterarSetor() {
  return useMutacaoSemRepeticao(
    (input: {
      id: string;
      body: z.input<typeof import("@repo/contracts").AlterarSetorSchema>;
    }) => browserCadastros.setores.alterar(input.id, input.body),
  );
}
export function useAlterarSituacaoSetor() {
  return useMutacaoSemRepeticao((input: { id: string; ativo: boolean }) =>
    browserCadastros.setores.situacao(input.id, input.ativo),
  );
}
export function useCriarFornecedor() {
  return useMutacaoSemRepeticao(browserCadastros.fornecedores.criar);
}
export function useAlterarFornecedor() {
  return useMutacaoSemRepeticao(
    (input: {
      id: string;
      body: z.input<typeof import("@repo/contracts").AlterarFornecedorSchema>;
    }) => browserCadastros.fornecedores.alterar(input.id, input.body),
  );
}
export function useAlterarSituacaoFornecedor() {
  return useMutacaoSemRepeticao((input: { id: string; ativo: boolean }) =>
    browserCadastros.fornecedores.situacao(input.id, input.ativo),
  );
}
export function useCriarComissao() {
  return useMutacaoSemRepeticao(browserCadastros.comissoes.criar);
}
export function useAlterarComissao() {
  return useMutacaoSemRepeticao(
    (input: {
      id: string;
      body: z.input<typeof import("@repo/contracts").AlterarComissaoBodySchema>;
    }) => browserCadastros.comissoes.alterar(input.id, input.body),
  );
}
export function useAlterarProcessoCompra() {
  return useMutacaoSemRepeticao(
    (input: {
      id: string;
      body: z.input<
        typeof import("@repo/contracts").AlterarProcessoCompraBodySchema
      >;
    }) => browserCadastros.processos.alterar(input.id, input.body),
  );
}
export function useAlterarNotaFiscal() {
  return useMutacaoSemRepeticao(
    (input: {
      id: string;
      body: z.input<
        typeof import("@repo/contracts").AlterarNotaFiscalBodySchema
      >;
    }) => browserCadastros.notas.alterar(input.id, input.body),
  );
}
