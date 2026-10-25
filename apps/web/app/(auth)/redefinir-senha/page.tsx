import type { Metadata } from "next";
import Link from "next/link";
import { LockKeyhole } from "lucide-react";
import { RedefinirForm } from "./_components/redefinir-form";
import styles from "../auth.module.css";

export const metadata: Metadata = {
  title: "Criar nova senha",
  description: "Crie sua nova senha para o SIPAT.",
};

export default function RedefinirSenhaPage() {
  return (
    <div className={`${styles.card} ${styles.cardTall}`}>
      <span className={styles.eyebrow}>Primeiro acesso</span>
      <h1 className={styles.title}>Crie sua nova senha</h1>
      <p className={styles.description}>
        Olá, Paulo. Defina sua senha para continuar no SIPAT.
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
        <Link className={styles.backLink} href="/login">
          Sair e voltar ao login
        </Link>
      </p>
      <p className={styles.formFoot}>
        A nova senha vale no computador e no celular.
      </p>
    </div>
  );
}
