import type { Metadata } from "next";
import { headers } from "next/headers";
import { HomeDashboard } from "@/app/_home/home-dashboard";
import type { ResumoPatrimonialDashboard } from "@/features/patrimonios/api/patrimonio-operations";
import { serverPatrimonioOperations } from "@/features/patrimonios/api/server-patrimonio-operations";
import { exigirIdentidadeAtual } from "@/lib/auth/server-session";

export const metadata: Metadata = {
  title: "Visão geral",
  description: "Visão geral autenticada da gestão patrimonial do SIPAT.",
};

export default async function DashboardPage() {
  const identidade = await exigirIdentidadeAtual();

  const cookie = (await headers()).get("cookie");
  let resumoPatrimonial:
    | Readonly<{ status: "sucesso"; dados: ResumoPatrimonialDashboard }>
    | Readonly<{ status: "erro" }> = { status: "erro" };

  if (cookie) {
    try {
      const dados =
        await serverPatrimonioOperations.obterResumoDashboard(cookie);
      resumoPatrimonial = { status: "sucesso", dados };
    } catch {
      resumoPatrimonial = { status: "erro" };
    }
  }

  return (
    <HomeDashboard
      identidade={identidade}
      resumoPatrimonial={resumoPatrimonial}
    />
  );
}
