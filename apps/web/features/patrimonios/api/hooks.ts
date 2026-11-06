"use client";

import { useCallback, useRef, useState } from "react";
import type { CriarPatrimonioBodyInput } from "@repo/contracts";
import { browserApiClient } from "@/lib/api/browser-api-client";
import { useMutacaoSemRepeticao } from "@/lib/api/client/use-mutacao-sem-repeticao";
import { criarOperacoesPatrimonios } from "./patrimonio-operations";

const operacoes = criarOperacoesPatrimonios(browserApiClient);

async function todasAsPaginas<T>(
  consultar: (pagina: string) => Promise<{
    dados: T[];
    meta: { ultimaPagina: number };
  }>,
) {
  const primeira = await consultar("1");
  const demais = await Promise.all(
    Array.from({ length: primeira.meta.ultimaPagina - 1 }, (_, indice) =>
      consultar(String(indice + 2)),
    ),
  );
  return [...primeira.dados, ...demais.flatMap((pagina) => pagina.dados)];
}

const carregarEspecies = () =>
  todasAsPaginas((pagina) => operacoes.especies({ pagina, limite: "50" }));
const carregarSetores = () =>
  todasAsPaginas((pagina) =>
    operacoes.setores({ pagina, limite: "50", ativo: "true" }),
  );
const carregarProcessosCompra = () =>
  todasAsPaginas((pagina) =>
    operacoes.processosCompra({ pagina, limite: "50" }),
  );

function useConsultaOpcoes<T>(consultar: () => Promise<T[]>) {
  const [dados, setDados] = useState<T[] | null>(null);
  const [erro, setErro] = useState<unknown>(null);
  const [loading, setLoading] = useState(true);
  const atual = useRef(0);
  const carregar = useCallback(async () => {
    const id = ++atual.current;
    setLoading(true);
    setErro(null);
    try {
      const resultado = await consultar();
      if (id === atual.current) setDados(resultado);
    } catch (erroConsulta) {
      if (id === atual.current) setErro(erroConsulta);
    } finally {
      if (id === atual.current) setLoading(false);
    }
  }, [consultar]);

  return { dados, erro, loading, carregar };
}

export function useEspeciesPatrimonio() {
  return useConsultaOpcoes(carregarEspecies);
}

export function useSetoresPatrimonio() {
  return useConsultaOpcoes(carregarSetores);
}

export function useProcessosCompraPatrimonio() {
  return useConsultaOpcoes(carregarProcessosCompra);
}

const criarPatrimonio = (body: CriarPatrimonioBodyInput) =>
  operacoes.criar(body);

export function useCriarPatrimonio() {
  return useMutacaoSemRepeticao(criarPatrimonio);
}
