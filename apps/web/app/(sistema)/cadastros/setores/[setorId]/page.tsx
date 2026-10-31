import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { DetalheSetor } from "@/features/cadastros/components/setores-telas";
import { setoresExemplo } from "@/features/cadastros/components/setores-exemplo";

export const metadata: Metadata = {
  title: "Consultar setor",
  description: "Prévia visual da ficha de um setor do SIPAT.",
};
export default async function SetorPage({
  params,
}: {
  params: Promise<{ setorId: string }>;
}) {
  const { setorId } = await params;
  const setor = setoresExemplo.find((item) => item.id === setorId);
  if (!setor) notFound();
  return <DetalheSetor setor={setor} />;
}
