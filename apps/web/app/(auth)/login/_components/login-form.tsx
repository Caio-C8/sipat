"use client";

import { useState, type FormEvent } from "react";
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
import styles from "../../auth.module.css";

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
    <form className={styles.form} onSubmit={handleSubmit} noValidate>
      {erroGeral ? (
        <p className={styles.formError} role="alert">
          {erroGeral}
        </p>
      ) : null}
      <div className={styles.field}>
        <label className={styles.label} htmlFor="login-email">
          E-mail institucional
        </label>
        <div className={styles.inputWrap}>
          <Mail className={styles.fieldIcon} size={17} aria-hidden="true" />
          <Input
            id="login-email"
            name="email"
            type="email"
            autoComplete="username"
            placeholder="paulo.caixeta@exemplo.invalid"
            required
            maxLength={150}
            className={styles.input}
            aria-invalid={Boolean(erros.email)}
            aria-describedby={erros.email ? "login-email-error" : undefined}
          />
        </div>
        {erros.email ? (
          <p className={styles.fieldError} id="login-email-error">
            {erros.email}
          </p>
        ) : null}
      </div>
      <div className={styles.field}>
        <label className={styles.label} htmlFor="login-senha">
          Senha
        </label>
        <PasswordInput
          id="login-senha"
          name="senha"
          autoComplete="current-password"
          placeholder="••••••••••••"
          aria-invalid={Boolean(erros.senha)}
          aria-describedby={erros.senha ? "login-senha-error" : undefined}
        />
        {erros.senha ? (
          <p className={styles.fieldError} id="login-senha-error">
            {erros.senha}
          </p>
        ) : null}
      </div>
      <p className={styles.smallNote}>
        A mesma conta e os mesmos dados do SIPAT.
      </p>
      <Button className={styles.submit} type="submit" disabled={pending}>
        <ArrowRight size={17} aria-hidden="true" />
        {pending ? "Entrando..." : "Entrar"}
      </Button>
    </form>
  );
}
