import type { Metadata } from "next";
import { HomeDashboard } from "@/app/_home/home-dashboard";
import { obterIdentidadeAtual } from "@/lib/auth/server-session";

export const metadata: Metadata = {
  title: "Visão geral",
  description: "Visão geral autenticada da gestão patrimonial do SIPAT.",
};

export default async function DashboardPage() {
  const identidade = await obterIdentidadeAtual();

  if (!identidade) {
    return null;
  }

  return <HomeDashboard identidade={identidade} />;
}
