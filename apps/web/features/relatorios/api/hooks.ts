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
  const arquivo = useRef<{ chave: string; url: string } | null>(null);
  const janela = useRef<Window | null>(null);
  useEffect(
    () => () => {
      controle.current?.abort();
      const url = arquivo.current?.url;
      if (!url) return;
      if (!janela.current || janela.current.closed) URL.revokeObjectURL(url);
      else {
        const intervalo = window.setInterval(() => {
          if (janela.current?.closed) {
            URL.revokeObjectURL(url);
            window.clearInterval(intervalo);
          }
        }, 30000);
      }
    },
    [],
  );
  const executar = async (
    modo: "abrir" | "baixar",
    q: ApiQuery,
    nome: string,
  ) => {
    if (ocupado.current) return;
    const novaJanela = modo === "abrir" ? window.open("", "_blank") : null;
    if (modo === "abrir" && !novaJanela) {
      setErro(
        "O navegador bloqueou a nova janela. Use Baixar PDF para acessar o documento.",
      );
      return;
    }
    if (novaJanela) {
      janela.current = novaJanela;
      novaJanela.document.title = "Preparando documento SIPAT";
      novaJanela.document.body.textContent = "Preparando PDF…";
    }
    ocupado.current = true;
    setPending(true);
    setErro(null);
    const abort = new AbortController();
    controle.current = abort;
    try {
      const chave = JSON.stringify(q);
      if (arquivo.current?.chave !== chave) {
        if (arquivo.current && (!janela.current || janela.current.closed))
          URL.revokeObjectURL(arquivo.current.url);
        const blob = await operacao(q, { signal: abort.signal });
        arquivo.current = { chave, url: URL.createObjectURL(blob) };
      }
      if (abort.signal.aborted) return;
      const url = arquivo.current.url;
      if (modo === "abrir" && novaJanela) novaJanela.location.href = url;
      else {
        const a = document.createElement("a");
        a.href = url;
        a.download = nome;
        a.click();
      }
    } catch (e) {
      novaJanela?.close();
      if (!abort.signal.aborted) setErro(e);
    } finally {
      ocupado.current = false;
      setPending(false);
    }
  };
  return {
    pending,
    erro,
    baixar: (q: ApiQuery, nome: string) => executar("baixar", q, nome),
    abrir: (q: ApiQuery, nome: string) => executar("abrir", q, nome),
  };
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
export function usePdfPendenciasDepreciacao() {
  return usePdf(operacoes.pdf["pendencias-depreciacao"]);
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
