"use client";
import { useRef, useState, useCallback, useEffect } from "react";
import type { ApiQuery } from "@/lib/api/core/types";
import { browserApiClient } from "@/lib/api/browser-api-client";
import { criarOperacoesRelatorios } from "./operations";
import type { CatalogoOpcaoRelatorio, TipoRelatorio } from "@repo/contracts";
const operacoes = criarOperacoesRelatorios(browserApiClient);
function usePdf(
  operacao: (q: ApiQuery, opcoes?: { signal?: AbortSignal }) => Promise<Blob>,
) {
  const [pending, setPending] = useState(false);
  const [erro, setErro] = useState<unknown>(null);
  const ocupado = useRef(false);
  const controle = useRef<AbortController | null>(null);
  useEffect(() => () => controle.current?.abort(), []);
  const baixar = async (q: ApiQuery, nome: string) => {
    if (ocupado.current) return;
    ocupado.current = true;
    setPending(true);
    setErro(null);
    const abort = new AbortController();
    controle.current = abort;
    try {
      const blob = await operacao(q, { signal: abort.signal });
      if (abort.signal.aborted) return;
      const url = URL.createObjectURL(blob);
      try {
        const a = document.createElement("a");
        a.href = url;
        a.download = nome;
        a.click();
      } finally {
        setTimeout(() => URL.revokeObjectURL(url), 1000);
      }
    } catch (e) {
      if (!abort.signal.aborted) setErro(e);
    } finally {
      ocupado.current = false;
      setPending(false);
    }
  };
  return { pending, erro, baixar };
}
export function usePdfPatrimonios() {
  return usePdf(operacoes.pdf.patrimonios);
}
export function usePdfMovimentacoes() {
  return usePdf(operacoes.pdf.movimentacoes);
}
export function usePdfManutencoes() {
  return usePdf(operacoes.pdf.manutencoes);
}
export function usePdfDepreciacoes() {
  return usePdf(operacoes.pdf.depreciacoes);
}
export function usePdfReavaliacoes() {
  return usePdf(operacoes.pdf.reavaliacoes);
}
export function usePdfInventarios() {
  return usePdf(operacoes.pdf.inventarios);
}
export function usePdfEmprestimos() {
  return usePdf(operacoes.pdf.emprestimos);
}
export function usePdfBaixas() {
  return usePdf(operacoes.pdf.baixas);
}
export function usePdfFicha(id: string) {
  const op = useCallback(
    (q: ApiQuery, o?: { signal?: AbortSignal }) => operacoes.pdfFicha(id, q, o),
    [id],
  );
  return usePdf(op);
}
export function useOpcoesRelatorio(
  catalogo: CatalogoOpcaoRelatorio,
  tipo: TipoRelatorio,
) {
  return useCallback(
    (busca: string, pagina: number, signal?: AbortSignal) =>
      operacoes.opcoes(catalogo, tipo, busca, pagina, signal),
    [catalogo, tipo],
  );
}
