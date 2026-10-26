import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { LockKeyhole } from "lucide-react";
import { LogoutButton } from "@/components/auth/logout-button";
import { obterIdentidadeAtual } from "@/lib/auth/server-session";
import { RedefinirForm } from "./_components/redefinir-form";
import styles from "../auth.module.css";

export const metadata: Metadata = {
  title: "Criar nova senha",
  description: "Crie sua nova senha para o SIPAT.",
};

export default async function RedefinirSenhaPage() {
  const identidade = await obterIdentidadeAtual();

  if (!identidade) {
    redirect("/login");
  }

  if (!identidade.trocaSenhaObrigatoria) {
    redirect("/dashboard");
  }

  return (
    <div className={`${styles.card} ${styles.cardTall}`}>
      <span className={styles.eyebrow}>Primeiro acesso</span>
      <h1 className={styles.title}>Crie sua nova senha</h1>
      <p className={styles.description}>
        Olá, {identidade.nome}. Defina sua senha para continuar no SIPAT.
      </p>
      <div className={styles.notice}>
        <LockKeyhole
          className={styles.noticeIcon}
          size={17}
          aria-hidden="true"
        />
        <div>
          <strong>A troca da senha inicial é obrigatória.</strong>
          <span>Seu acesso será liberado após salvar a nova senha.</span>
        </div>
      </div>
      <RedefinirForm />
      <p className={styles.centerLink}>
        <LogoutButton className={styles.backLink}>
          Sair e voltar ao login
        </LogoutButton>
      </p>
      <p className={styles.formFoot}>
        A nova senha vale no computador e no celular.
      </p>
    </div>
  );
}
