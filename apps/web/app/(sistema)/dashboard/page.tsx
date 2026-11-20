import type { Metadata } from "next";
import { headers } from "next/headers";
import { HomeDashboard } from "@/app/_home/home-dashboard";
import type { DashboardOperacional } from "@/features/dashboard/api/dashboard-operations";
import { serverDashboardOperations } from "@/features/dashboard/api/server-dashboard-operations";
import { exigirIdentidadeAtual } from "@/lib/auth/server-session";

export const metadata: Metadata = {
  title: "Visão geral",
  description: "Visão geral autenticada da gestão patrimonial do SIPAT.",
};

export default async function DashboardPage() {
  const identidade = await exigirIdentidadeAtual();

  const cookie = (await headers()).get("cookie");
  let dashboard:
    | Readonly<{ status: "sucesso"; dados: DashboardOperacional }>
    | Readonly<{ status: "erro" }> = { status: "erro" };

  if (cookie) {
    try {
      const dados = await serverDashboardOperations.consultar(cookie);
      dashboard = { status: "sucesso", dados };
    } catch {
      dashboard = { status: "erro" };
    }
  }

  return <HomeDashboard identidade={identidade} dashboard={dashboard} />;
}
