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
import styles from "../../auth.module.css";

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
    <form className={styles.form} onSubmit={handleSubmit} noValidate>
      {erroGeral ? (
        <p className={styles.formError} role="alert">
          {erroGeral}
        </p>
      ) : null}
      <div className={styles.field}>
        <label className={styles.label} htmlFor="nova-senha">
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
          <p className={styles.fieldError} id="nova-senha-error">
            {erros.novaSenha}
          </p>
        ) : null}
      </div>
      <div className={styles.field}>
        <label className={styles.label} htmlFor="confirmacao-senha">
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
          <p className={styles.fieldError} id="confirmacao-senha-error">
            {erros.confirmacaoNovaSenha}
          </p>
        ) : null}
      </div>
      <p className={styles.helpText}>
        Use uma senha diferente da senha inicial.
        <br />A confirmação deve ser igual à nova senha.
      </p>
      <Button className={styles.submit} type="submit" disabled={pending}>
        <ArrowRight size={17} aria-hidden="true" />
        {pending ? "Salvando..." : "Salvar nova senha e continuar"}
      </Button>
    </form>
  );
}
