import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { SessionUnavailable } from "@/components/auth/session-unavailable";
import { AuthenticatedShell } from "@/components/shared/authenticated-shell";
import { obterEstadoSessaoAtual } from "@/lib/auth/server-session";

export default async function SistemaLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  const estado = await obterEstadoSessaoAtual();

  if (estado.status === "indisponivel") {
    return <SessionUnavailable />;
  }

  if (estado.status === "ausente") {
    redirect("/login");
  }

  if (estado.identidade.trocaSenhaObrigatoria) {
    redirect("/redefinir-senha");
  }

  return (
    <AuthenticatedShell identidade={estado.identidade}>
      {children}
    </AuthenticatedShell>
  );
}
