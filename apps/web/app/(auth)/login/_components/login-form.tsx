"use client";

import type { FormEvent } from "react";
import { ArrowRight, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "../../_components/password-input";
import styles from "../../auth.module.css";

export function LoginForm() {
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
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
          />
        </div>
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
        />
      </div>
      <div className={styles.actionRow}>
        <button className={styles.textAction} type="button">
          Esqueci minha senha
        </button>
      </div>
      <p className={styles.smallNote}>
        A mesma conta e os mesmos dados do SIPAT.
      </p>
      <Button className={styles.submit} type="submit">
        <ArrowRight size={17} aria-hidden="true" />
        Entrar
      </Button>
    </form>
  );
}
