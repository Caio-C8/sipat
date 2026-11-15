import type { Metadata } from "next";
import { MinhaConta } from "@/features/configuracoes/components/minha-conta";
import { exigirIdentidadeAtual } from "@/lib/auth/server-session";

export const metadata: Metadata = {
  title: "Minha conta",
  description: "Consulte sua identificação e gerencie sua conta SIPAT.",
};

export default async function MinhaContaPage() {
  const identidade = await exigirIdentidadeAtual();

  return <MinhaConta identidade={identidade} />;
}
