import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { SessionUnavailable } from "@/components/auth/session-unavailable";
import { obterEstadoSessaoAtual } from "@/lib/auth/server-session";
import { publicAppConfig } from "@/lib/config/public-app-config";

export const metadata: Metadata = {
  title: `Início | ${publicAppConfig.appName}`,
  description: "Entrada do Sistema de Gestão Patrimonial.",
};

export default async function Home() {
  const estado = await obterEstadoSessaoAtual();

  if (estado.status === "indisponivel") {
    return <SessionUnavailable />;
  }

  if (estado.status === "ausente") {
    redirect("/login");
  }

  redirect(
    estado.identidade.trocaSenhaObrigatoria ? "/redefinir-senha" : "/dashboard",
  );
}
