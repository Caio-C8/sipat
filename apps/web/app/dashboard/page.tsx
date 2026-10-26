import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { HomeDashboard } from "../_home/home-dashboard";
import { obterIdentidadeAtual } from "@/lib/auth/server-session";

export const metadata: Metadata = {
  title: "Visão geral",
  description: "Visão geral autenticada da gestão patrimonial do SIPAT.",
};

export default async function DashboardPage() {
  const identidade = await obterIdentidadeAtual();

  if (!identidade) {
    redirect("/login");
  }

  if (identidade.trocaSenhaObrigatoria) {
    redirect("/redefinir-senha");
  }

  return <HomeDashboard identidade={identidade} />;
}
