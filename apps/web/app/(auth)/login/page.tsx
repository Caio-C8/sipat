import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { obterIdentidadeAtual } from "@/lib/auth/server-session";
import { LoginForm } from "./_components/login-form";
import styles from "../auth.module.css";

export const metadata: Metadata = {
  title: "Login",
  description: "Acesse o SIPAT.",
};

export default async function LoginPage() {
  const identidade = await obterIdentidadeAtual();

  if (identidade) {
    redirect(
      identidade.trocaSenhaObrigatoria ? "/redefinir-senha" : "/dashboard",
    );
  }

  return (
    <div className={`${styles.card} ${styles.loginCard}`}>
      <h1 className={styles.title}>Acesse sua conta</h1>
      <p className={styles.description}>
        Informe suas credenciais para entrar no SIPAT.
      </p>
      <LoginForm />
      <p className={styles.formFoot}>
        Acesso destinado aos usuários autorizados da Câmara.
      </p>
    </div>
  );
}
