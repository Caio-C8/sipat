import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { AuthenticatedShell } from "@/components/shared/authenticated-shell";
import { obterIdentidadeAtual } from "@/lib/auth/server-session";

export default async function SistemaLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  const identidade = await obterIdentidadeAtual();

  if (!identidade) {
    redirect("/login");
  }

  if (identidade.trocaSenhaObrigatoria) {
    redirect("/redefinir-senha");
  }

  return (
    <AuthenticatedShell identidade={identidade}>{children}</AuthenticatedShell>
  );
}
