"use client";

import type { FormEvent } from "react";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PasswordInput } from "../../_components/password-input";
import styles from "../../auth.module.css";

export function RedefinirForm() {
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <div className={styles.field}>
        <label className={styles.label} htmlFor="nova-senha">
          Nova senha *
        </label>
        <PasswordInput
          id="nova-senha"
          name="novaSenha"
          autoComplete="new-password"
          placeholder="Digite a senha"
        />
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
        />
      </div>
      <p className={styles.helpText}>
        Use uma senha diferente da senha inicial.
        <br />A confirmação deve ser igual à nova senha.
      </p>
      <Button className={styles.submit} type="submit">
        <ArrowRight size={17} aria-hidden="true" />
        Salvar nova senha e continuar
      </Button>
    </form>
  );
}
