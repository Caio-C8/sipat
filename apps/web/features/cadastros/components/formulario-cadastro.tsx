"use client";
import { useRef, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ZodError } from "zod";
import { decidirAposFalha } from "@/lib/api/core/idempotencia";
import { cartao, botao, principal, mensagemErro } from "./cadastro-ui";
export function FormularioCadastro({
  titulo,
  children,
  salvar,
  idempotente = false,
  destino,
  rotaDetalhe = false,
  rotulo = "Salvar",
  onSucesso,
}: {
  titulo: string;
  children: ReactNode;
  salvar: (dados: FormData, chave: string) => Promise<{ id: string } | null>;
  idempotente?: boolean;
  destino: string;
  rotaDetalhe?: boolean;
  rotulo?: string;
  onSucesso?: () => void;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const emCurso = useRef(false);
  const tentativa = useRef<{
    chave: string;
    dados: FormData;
    incerta: boolean;
  } | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [concluida, setConcluida] = useState(false);
  const [incerta, setIncerta] = useState(false);
  return (
    <form
      className={cartao + " grid gap-5"}
      aria-label={titulo}
      aria-busy={pending}
      onSubmit={async (e) => {
        e.preventDefault();
        if (emCurso.current || concluida) return;
        emCurso.current = true;
        setPending(true);
        setErro(null);
        const atual = tentativa.current ?? {
          chave: crypto.randomUUID(),
          dados: new FormData(e.currentTarget),
          incerta: false,
        };
        if (idempotente) tentativa.current = atual;
        try {
          const resposta = await salvar(atual.dados, atual.chave);
          if (!resposta) return;
          tentativa.current = null;
          setIncerta(false);
          setConcluida(true);
          onSucesso?.();
          const proximaRota = rotaDetalhe
            ? destino + "/" + encodeURIComponent(resposta.id) + "?salvo=1"
            : destino.includes("?")
              ? destino
              : destino + "?id=" + encodeURIComponent(resposta.id) + "&salvo=1";
          if (proximaRota === window.location.pathname + window.location.search)
            router.refresh();
          else router.replace(proximaRota);
        } catch (error) {
          setErro(mensagemErro(error));
          if (
            idempotente &&
            !(error instanceof ZodError) &&
            !(error instanceof RangeError)
          ) {
            const decisao = decidirAposFalha(error);
            const manter =
              decisao.manterChave ||
              (atual.incerta && decisao.tipo === "falha_conclusiva");
            if (manter) {
              atual.incerta = true;
              setIncerta(true);
            } else {
              tentativa.current = null;
              setIncerta(false);
            }
            if (decisao.atualizarConsultas) {
              setConcluida(true);
              router.refresh();
            }
          } else tentativa.current = null;
        } finally {
          setPending(false);
          emCurso.current = false;
        }
      }}
    >
      <h2 className="text-base font-bold">{titulo}</h2>
      {erro && (
        <div
          tabIndex={-1}
          role="alert"
          className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-900"
        >
          {erro}
        </div>
      )}
      {incerta && (
        <p
          role="status"
          className="rounded-md bg-amber-50 p-3 text-sm text-amber-950"
        >
          O resultado ainda não foi confirmado. Os dados foram preservados.
          Confirme novamente para consultar a mesma tentativa.
        </p>
      )}
      {concluida && !erro && (
        <p role="status">Operação concluída. Consulte a lista atualizada.</p>
      )}
      <fieldset
        disabled={pending || incerta || concluida}
        className="grid min-w-0 gap-5 disabled:opacity-75"
      >
        {children}
      </fieldset>
      <div className="flex flex-wrap justify-end gap-3 border-t border-[#dfe7f1] pt-4">
        <Link className={botao} href={destino.split("?")[0]!}>
          Voltar à consulta
        </Link>
        <button
          type="submit"
          className={principal}
          disabled={pending || concluida}
        >
          {pending ? "Salvando…" : incerta ? "Confirmar novamente" : rotulo}
        </button>
      </div>
    </form>
  );
}
