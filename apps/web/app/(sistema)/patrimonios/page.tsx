import type { Metadata } from "next";
import { PatrimonioTelas } from "@/features/patrimonios/components/patrimonio-telas";
import { obterIdentidadeAtual } from "@/lib/auth/server-session";

export const metadata: Metadata = {
  title: "Consultar patrimônio",
  description: "Prévia visual da consulta e da ficha patrimonial do SIPAT.",
};

export default async function PatrimoniosPage() {
  const identidade = await obterIdentidadeAtual();
  if (!identidade) return null;
  return (
    <PatrimonioTelas
      podeCadastrar={identidade.perfil === "DIRETOR_PATRIMONIO"}
    />
  );
}
