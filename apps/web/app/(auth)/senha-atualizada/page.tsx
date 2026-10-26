import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { obterIdentidadeAtual } from "@/lib/auth/server-session";
import styles from "../auth.module.css";

export const metadata: Metadata = {
  title: "Senha atualizada",
  description: "Confirmação de atualização de senha do SIPAT.",
};

export default async function SenhaAtualizadaPage() {
  const identidade = await obterIdentidadeAtual();

  if (!identidade) {
    redirect("/login");
  }

  if (identidade.trocaSenhaObrigatoria) {
    redirect("/redefinir-senha");
  }

  return (
    <div className={`${styles.card} ${styles.cardSuccess}`}>
      <span className={styles.successIcon}>
        <Check size={30} aria-hidden="true" />
      </span>
      <h1 className={styles.title}>Senha atualizada</h1>
      <p className={styles.successLead}>Seu primeiro acesso foi concluído.</p>
      <p className={styles.successCopy}>
        Utilize sua nova senha nos próximos acessos.
        <br />
        Ela vale para o computador e para o celular.
      </p>
      <div className={`${styles.notice} ${styles.successNotice}`}>
        <div>
          <strong>Sua conta e seu perfil permanecem os mesmos.</strong>
          <span>A interface escolhida no login será mantida.</span>
        </div>
      </div>
      <Button asChild className={`${styles.submit} ${styles.successButton}`}>
        <Link href="/dashboard">
          <ArrowRight size={17} aria-hidden="true" />
          Continuar para o SIPAT
        </Link>
      </Button>
    </div>
  );
}
