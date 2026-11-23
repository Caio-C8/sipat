"use client";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { ZodError } from "zod";
import { Button } from "@/components/ui/button";
import { isApiError } from "@/lib/api/core/api-error";
import { decidirAposFalha } from "@/lib/api/core/idempotencia";
import { cartao, mensagemErro } from "./cadastro-ui";
import { CadastroFieldErrorsProvider } from "./cadastro-field-errors";

export type ContextoFormularioCadastro =
  "legado" | "pagina-criacao" | "pagina-edicao" | "modal";

export function FormularioCadastro({
  titulo,
  children,
  salvar,
  idempotente = false,
  destino,
  rotaDetalhe = false,
  rotulo = "Salvar",
  onSucesso,
  contexto = "legado",
  onCancelar,
  onRestaurar,
  destinoSucesso,
  mensagemSucesso,
  navegarAposSucesso = true,
}: {
  titulo: string;
  children: ReactNode;
  salvar: (dados: FormData, chave: string) => Promise<{ id: string } | null>;
  idempotente?: boolean;
  destino: string;
  rotaDetalhe?: boolean;
  rotulo?: string;
  onSucesso?: (id: string) => void;
  contexto?: ContextoFormularioCadastro;
  onCancelar?: () => void;
  onRestaurar?: () => void;
  destinoSucesso?: (id: string) => string;
  mensagemSucesso?: string;
  navegarAposSucesso?: boolean;
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
  const [errosCampos, setErrosCampos] = useState<Record<string, string>>({});
  const erroRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const [concluida, setConcluida] = useState(false);
  const [incerta, setIncerta] = useState(false);
  useEffect(() => {
    if (!erro) return;
    const primeiroCampo = Object.keys(errosCampos)[0];
    if (primeiroCampo) {
      const controleVisual = Array.from(
        formRef.current?.querySelectorAll<HTMLElement>("[data-field-name]") ??
          [],
      ).find((element) => element.dataset.fieldName === primeiroCampo);
      const controle =
        controleVisual ?? formRef.current?.elements.namedItem(primeiroCampo);
      if (controle instanceof HTMLElement) {
        controle.focus();
        controle.scrollIntoView?.({ block: "nearest" });
        return;
      }
    }
    erroRef.current?.focus();
    erroRef.current?.scrollIntoView?.({ block: "nearest" });
  }, [erro, errosCampos]);
  return (
    <form
      ref={formRef}
      className={contexto === "modal" ? "grid gap-5" : cartao + " grid gap-5"}
      aria-label={titulo}
      aria-busy={pending}
      onSubmit={async (e) => {
        e.preventDefault();
        if (emCurso.current || concluida) return;
        emCurso.current = true;
        setPending(true);
        setErro(null);
        setErrosCampos({});
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
          if (mensagemSucesso) toast.success(mensagemSucesso);
          onSucesso?.(resposta.id);
          if (!navegarAposSucesso) return;
          const proximaRota = destinoSucesso
            ? destinoSucesso(resposta.id)
            : rotaDetalhe
              ? destino + "/" + encodeURIComponent(resposta.id) + "?salvo=1"
              : destino.includes("?")
                ? destino
                : destino +
                  "?id=" +
                  encodeURIComponent(resposta.id) +
                  "&salvo=1";
          if (proximaRota === window.location.pathname + window.location.search)
            router.refresh();
          else router.replace(proximaRota);
        } catch (error) {
          setErro(mensagemErro(error));
          if (error instanceof ZodError) {
            setErrosCampos(
              Object.fromEntries(
                error.issues
                  .filter((issue) => typeof issue.path[0] === "string")
                  .map((issue) => [String(issue.path[0]), issue.message]),
              ),
            );
          } else if (isApiError(error)) {
            setErrosCampos(
              Object.fromEntries(
                error.erros.map((fieldError) => [
                  fieldError.campo,
                  fieldError.mensagem,
                ]),
              ),
            );
          }
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
      {contexto === "modal" ? null : (
        <h2 className="text-base font-bold">{titulo}</h2>
      )}
      {erro && (
        <div
          ref={erroRef}
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
      <CadastroFieldErrorsProvider errors={errosCampos}>
        <fieldset
          disabled={pending || incerta || concluida}
          className="grid min-w-0 gap-5 disabled:opacity-75"
        >
          {children}
        </fieldset>
      </CadastroFieldErrorsProvider>
      <div className="flex flex-wrap justify-end gap-3 border-t border-[#dfe7f1] pt-4">
        {contexto === "legado" ? (
          <Button asChild type="button" variant="outline" size="lg">
            <Link href={destino.split("?")[0]!}>Voltar à consulta</Link>
          </Button>
        ) : contexto === "modal" ? (
          <Button
            type="button"
            variant="outline"
            size="lg"
            disabled={pending}
            onClick={onCancelar}
          >
            Cancelar
          </Button>
        ) : (
          <Button
            type="reset"
            variant="outline"
            size="lg"
            disabled={pending}
            onClick={onRestaurar}
          >
            {contexto === "pagina-criacao" ? "Limpar" : "Restaurar alterações"}
          </Button>
        )}
        <Button type="submit" size="lg" disabled={pending || concluida}>
          {pending ? "Salvando…" : incerta ? "Confirmar novamente" : rotulo}
        </Button>
      </div>
    </form>
  );
}
