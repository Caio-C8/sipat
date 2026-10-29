"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { ConcluirPrimeiroAcessoBodySchema } from "@repo/contracts";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { browserAuth } from "@/lib/auth/browser-auth";
import {
  mapearErrosApi,
  mapearErrosZod,
  mensagemGeralAuth,
  type ErrosFormulario,
} from "@/lib/auth/form-errors";
import { PasswordInput } from "../../_components/password-input";

export function RedefinirForm() {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [erros, setErros] = useState<ErrosFormulario>({});
  const [erroGeral, setErroGeral] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const form = new FormData(event.currentTarget);
    const resultado = ConcluirPrimeiroAcessoBodySchema.safeParse({
      novaSenha: form.get("novaSenha"),
      confirmacaoNovaSenha: form.get("confirmacaoNovaSenha"),
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
      await browserAuth.concluirPrimeiroAcesso(resultado.data);
      router.replace("/senha-atualizada");
      router.refresh();
    } catch (error: unknown) {
      if (
        typeof error === "object" &&
        error !== null &&
        "status" in error &&
        error.status === 401
      ) {
        router.replace("/login");
        router.refresh();
        return;
      }

      setErros(mapearErrosApi(error));
      setErroGeral(mensagemGeralAuth(error));
      setPending(false);
    }
  }

  return (
    <form
      className="mt-1 grid gap-[clamp(0.65rem,0.95vw,1.2rem)]"
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
          htmlFor="nova-senha"
        >
          Nova senha *
        </label>
        <PasswordInput
          id="nova-senha"
          name="novaSenha"
          autoComplete="new-password"
          placeholder="Digite a senha"
          aria-invalid={Boolean(erros.novaSenha)}
          aria-describedby={erros.novaSenha ? "nova-senha-error" : undefined}
        />
        {erros.novaSenha ? (
          <p
            className="-mt-1 text-xs leading-5 text-[#9b2727]"
            id="nova-senha-error"
          >
            {erros.novaSenha}
          </p>
        ) : null}
      </div>
      <div className="grid gap-2">
        <label
          className="text-xs font-bold text-[#244163]"
          htmlFor="confirmacao-senha"
        >
          Confirmar nova senha *
        </label>
        <PasswordInput
          id="confirmacao-senha"
          name="confirmacaoNovaSenha"
          autoComplete="new-password"
          placeholder="Digite a senha novamente"
          aria-invalid={Boolean(erros.confirmacaoNovaSenha)}
          aria-describedby={
            erros.confirmacaoNovaSenha ? "confirmacao-senha-error" : undefined
          }
        />
        {erros.confirmacaoNovaSenha ? (
          <p
            className="-mt-1 text-xs leading-5 text-[#9b2727]"
            id="confirmacao-senha-error"
          >
            {erros.confirmacaoNovaSenha}
          </p>
        ) : null}
      </div>
      <p className="mt-0.5 text-xs leading-7 text-[#52647f]">
        Use no mínimo 8 caracteres, com uma letra, um número e um símbolo.
        <br />A senha deve ser diferente da senha inicial.
        <br />A confirmação deve ser igual à nova senha.
      </p>
      <Button
        className="h-[clamp(2rem,2.25vw,2.75rem)] w-full justify-start gap-3 rounded-md bg-[#223d64] px-5 text-xs font-bold text-white hover:bg-[#2b507e] focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-[#8dbbf0]"
        type="submit"
        disabled={pending}
      >
        <ArrowRight size={17} aria-hidden="true" />
        {pending ? "Salvando..." : "Salvar nova senha e continuar"}
      </Button>
    </form>
  );
}
