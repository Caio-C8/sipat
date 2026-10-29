"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { SolicitarRedefinicaoSenhaBodySchema } from "@repo/contracts";
import { ArrowLeft, ArrowRight, Check, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { browserAuth } from "@/lib/auth/browser-auth";
import {
  mapearErrosApi,
  mapearErrosZod,
  mensagemGeralAuth,
  type ErrosFormulario,
} from "@/lib/auth/form-errors";

export function SolicitarRecuperacaoForm() {
  const [pending, setPending] = useState(false);
  const [erros, setErros] = useState<ErrosFormulario>({});
  const [erroGeral, setErroGeral] = useState<string | null>(null);
  const [mensagemSucesso, setMensagemSucesso] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const resultado = SolicitarRedefinicaoSenhaBodySchema.safeParse({
      email: form.get("email"),
    });

    if (!resultado.success) {
      setErros(mapearErrosZod(resultado.error));
      setErroGeral("Revise o e-mail informado.");
      return;
    }

    setPending(true);
    setErros({});
    setErroGeral(null);

    try {
      const resposta = await browserAuth.solicitarRedefinicaoSenha(
        resultado.data,
      );
      formElement.reset();
      setMensagemSucesso(resposta.mensagem);
    } catch (error: unknown) {
      setErros(mapearErrosApi(error));
      setErroGeral(mensagemGeralAuth(error));
      setPending(false);
    }
  }

  if (mensagemSucesso) {
    return (
      <div className="mt-6" role="status" aria-live="polite">
        <span className="mb-5 grid size-12 place-items-center rounded-xl bg-[#e9fbf3] text-[#00896b]">
          <Check size={24} aria-hidden="true" />
        </span>
        <h2 className="text-lg font-bold text-[#1d3c67]">
          Verifique seu e-mail
        </h2>
        <p className="mt-3 text-sm leading-7 text-[#52647f]">
          {mensagemSucesso}
        </p>
        <p className="mt-2 text-xs leading-6 text-[#7285a0]">
          A mensagem é sempre a mesma e não confirma se uma conta existe ou está
          ativa.
        </p>
        <Button
          asChild
          className="mt-6 h-[clamp(2rem,2.25vw,2.75rem)] w-full justify-start gap-3 rounded-md bg-[#223d64] px-5 text-xs font-bold text-white hover:bg-[#2b507e] focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-[#8dbbf0]"
        >
          <Link href="/login">
            <ArrowLeft size={17} aria-hidden="true" />
            Voltar ao login
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <form
      className="mt-[clamp(0.9rem,1.2vw,1.5rem)] grid gap-[clamp(0.75rem,1vw,1.25rem)]"
      onSubmit={handleSubmit}
      noValidate
    >
      {erroGeral ? (
        <p
          className="rounded-lg border border-[#efb7b7] bg-[#fff4f4] px-3 py-2.5 text-xs leading-5 text-[#8f2525]"
          role="alert"
        >
          {erroGeral}
        </p>
      ) : null}
      <div className="grid gap-2">
        <label
          className="text-xs font-bold text-[#244163]"
          htmlFor="recuperacao-email"
        >
          E-mail institucional
        </label>
        <div className="relative">
          <Mail
            className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-[#6b809c]"
            size={17}
            aria-hidden="true"
          />
          <Input
            id="recuperacao-email"
            name="email"
            type="email"
            autoComplete="email"
            autoFocus
            required
            maxLength={150}
            placeholder="nome@camara.gov.br"
            className="h-[clamp(2.4rem,2.9vw,3.5rem)] rounded-lg border-[#cbd8e8] bg-white pr-4 pl-11 text-sm text-[#294665] placeholder:text-[#8a9bb2]"
            aria-invalid={Boolean(erros.email)}
            aria-describedby={
              erros.email ? "recuperacao-email-error" : undefined
            }
          />
        </div>
        {erros.email ? (
          <p
            className="-mt-1 text-xs leading-5 text-[#9b2727]"
            id="recuperacao-email-error"
          >
            {erros.email}
          </p>
        ) : null}
      </div>
      <p className="text-xs leading-6 text-[#596b84]">
        Se a conta estiver elegível, o link será enviado ao e-mail cadastrado.
      </p>
      <Button
        className="h-[clamp(2rem,2.25vw,2.75rem)] w-full justify-start gap-3 rounded-md bg-[#223d64] px-5 text-xs font-bold text-white hover:bg-[#2b507e] focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-[#8dbbf0]"
        type="submit"
        disabled={pending}
      >
        <ArrowRight size={17} aria-hidden="true" />
        {pending ? "Enviando..." : "Enviar instruções"}
      </Button>
      <Link
        className="w-fit text-xs font-semibold text-[#26588d] underline-offset-4 hover:underline focus-visible:rounded-sm focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-[#8dbbf0]"
        href="/login"
      >
        Voltar ao login
      </Link>
    </form>
  );
}
