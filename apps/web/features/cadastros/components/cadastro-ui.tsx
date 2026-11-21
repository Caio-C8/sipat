import { useId, type InputHTMLAttributes } from "react";
import Link from "next/link";
import { ZodError } from "zod";
import { isApiError } from "@/lib/api/core/api-error";
import { mensagemConflitoIdempotencia } from "@/lib/api/core/idempotencia";
import { PaginationSummary } from "@/components/shared/pagination-summary";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useCadastroFieldError } from "./cadastro-field-errors";

export const pagina =
  "mx-auto grid w-full min-w-0 max-w-[1900px] gap-4 px-4 py-5 text-[#17253d] min-[651px]:px-6 min-[1500px]:px-8";
export const cartao =
  "min-w-0 rounded-lg border border-[#dfe7f1] bg-white p-4 min-[1500px]:p-5";
export const campo =
  "mt-1 min-h-10 w-full rounded-md border border-[#dfe7f1] bg-white px-3 py-2 text-sm text-[#19355d] outline-none focus-visible:ring-2 focus-visible:ring-[#2860eb]";
const estiloBotao =
  "inline-flex min-h-10 items-center justify-center gap-2 rounded-md border border-[#dfe7f1] px-4 py-2 text-sm font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2860eb] disabled:opacity-50 disabled:cursor-not-allowed";
export const botao =
  estiloBotao + " bg-white text-[#19355d] hover:bg-[#f7f9fc]";
export const principal =
  estiloBotao + " bg-[#19355d] text-white hover:bg-[#2b4c79]";
export function Campo({
  rotulo,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { rotulo: string }) {
  const generatedId = useId();
  const id = props.id ?? generatedId;
  const error = useCadastroFieldError(props.name ?? "");
  return (
    <div className="grid min-w-0 gap-1 text-sm text-[#29456d]">
      <label htmlFor={id}>
        {rotulo}
        {props.required ? " *" : ""}
      </label>
      <Input
        {...props}
        id={id}
        aria-invalid={Boolean(error) || undefined}
        aria-describedby={error ? `${id}-error` : props["aria-describedby"]}
        className="min-h-10"
      />
      {error ? (
        <p id={`${id}-error`} className="text-sm text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  );
}
export function Descricao({ valor }: { valor?: string | null }) {
  const id = useId();
  const error = useCadastroFieldError("descricao");
  return (
    <div className="text-sm">
      <label htmlFor={id}>Descrição</label>
      <Textarea
        id={id}
        name="descricao"
        defaultValue={valor ?? ""}
        maxLength={2000}
        className="mt-1 min-h-28"
        aria-invalid={Boolean(error) || undefined}
        aria-describedby={error ? `${id}-error` : undefined}
      />
      {error ? (
        <p id={`${id}-error`} className="text-sm text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  );
}
export function mensagemErro(error: unknown) {
  if (error instanceof ZodError)
    return error.issues.map((i) => i.message).join(" ");
  if (isApiError(error)) {
    if (error.status === 401)
      return "Sua sessão expirou. Entre novamente para continuar.";
    if (error.status === 403)
      return "Seu perfil não tem permissão para esta operação.";
    return mensagemConflitoIdempotencia(error) ?? error.message;
  }
  return error instanceof Error &&
    error.message === "Selecione um PDF de até 10 MiB."
    ? error.message
    : "Não foi possível concluir a operação. Tente novamente.";
}
export function ErroCadastro({ mensagem }: { mensagem: string }) {
  return (
    <div
      role="alert"
      className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-900"
    >
      <p>{mensagem}</p>
      <Link className="mt-2 inline-block underline" href="/login">
        Ir para o login
      </Link>
    </div>
  );
}
export function Paginacao({
  meta,
  href,
}: {
  meta: { pagina: number; ultimaPagina: number; total: number };
  href: (pagina: number) => string;
}) {
  return <PaginationSummary meta={meta} href={href} />;
}
export const texto = (dados: FormData, nome: string) =>
  String(dados.get(nome) ?? "").trim();
export const opcional = (dados: FormData, nome: string) =>
  texto(dados, nome) || undefined;
