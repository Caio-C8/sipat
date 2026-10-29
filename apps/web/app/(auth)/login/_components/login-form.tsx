"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LoginBodySchema } from "@repo/contracts";
import { ArrowRight, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { browserAuth } from "@/lib/auth/browser-auth";
import {
  mapearErrosApi,
  mapearErrosZod,
  mensagemGeralAuth,
  type ErrosFormulario,
} from "@/lib/auth/form-errors";
import { PasswordInput } from "../../_components/password-input";

export function LoginForm() {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [erros, setErros] = useState<ErrosFormulario>({});
  const [erroGeral, setErroGeral] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const form = new FormData(event.currentTarget);
    const resultado = LoginBodySchema.safeParse({
      email: form.get("email"),
      senha: form.get("senha"),
    });

    if (!resultado.success) {
      setErros(mapearErrosZod(resultado.error));
      setErroGeral("Revise os campos destacados.");
      return;
    }

    setPending(true);
    setErros({});
    setErroGeral(null);

    try {
      const identidade = await browserAuth.login(resultado.data);
      const destino = identidade.trocaSenhaObrigatoria
        ? "/redefinir-senha"
        : "/dashboard";

      router.replace(destino);
      router.refresh();
    } catch (error: unknown) {
      setErros(mapearErrosApi(error));
      setErroGeral(mensagemGeralAuth(error));
      setPending(false);
    }
  }

  return (
    <form
      className="mt-[clamp(0.7rem,1vw,1.25rem)] grid gap-[clamp(0.65rem,0.95vw,1.2rem)]"
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
          htmlFor="login-email"
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
            id="login-email"
            name="email"
            type="email"
            autoComplete="username"
            placeholder="email@exemplo.com"
            required
            maxLength={150}
            className="h-[clamp(2.4rem,2.9vw,3.5rem)] rounded-lg border-[#cbd8e8] bg-white pr-4 pl-11 text-sm text-[#294665] placeholder:text-[#8a9bb2]"
            aria-invalid={Boolean(erros.email)}
            aria-describedby={erros.email ? "login-email-error" : undefined}
          />
        </div>
        {erros.email ? (
          <p
            className="-mt-1 text-xs leading-5 text-[#9b2727]"
            id="login-email-error"
          >
            {erros.email}
          </p>
        ) : null}
      </div>
      <div className="grid gap-2">
        <div className="flex items-center justify-between gap-4">
          <label
            className="text-xs font-bold text-[#244163]"
            htmlFor="login-senha"
          >
            Senha
          </label>
        </div>
        <PasswordInput
          id="login-senha"
          name="senha"
          autoComplete="current-password"
          placeholder="••••••••••••"
          aria-invalid={Boolean(erros.senha)}
          aria-describedby={erros.senha ? "login-senha-error" : undefined}
        />
        {erros.senha ? (
          <p
            className="-mt-1 text-xs leading-5 text-[#9b2727]"
            id="login-senha-error"
          >
            {erros.senha}
          </p>
        ) : null}
      </div>
      <div className="flex items-center justify-between">
        <p className="mt-1 text-xs leading-6 text-[#596b84]">
          A mesma conta e os mesmos dados do SIPAT.
        </p>
        <Link
          className="text-xs font-semibold text-[#26588d] underline-offset-4 hover:underline focus-visible:rounded-sm focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-[#8dbbf0]"
          href="/esqueci-senha"
        >
          Esqueci minha senha
        </Link>
      </div>
      <Button
        className="h-[clamp(2rem,2.25vw,2.75rem)] w-full justify-start gap-3 rounded-md bg-[#223d64] px-5 text-xs font-bold text-white hover:bg-[#2b507e] focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-[#8dbbf0]"
        type="submit"
        disabled={pending}
      >
        <ArrowRight size={17} aria-hidden="true" />
        {pending ? "Entrando..." : "Entrar"}
      </Button>
    </form>
  );
}
