import type { Metadata } from "next";
import { ReavaliacaoDetalheServer } from "@/features/reavaliacoes/components/reavaliacao-detalhe-server";

export const metadata: Metadata = { title: "Detalhes da reavaliação" };

export default async function ReavaliacaoDetalhePage({
  params,
  searchParams,
}: {
  params: Promise<{ reavaliacaoId: string }>;
  searchParams: Promise<{ retorno?: string }>;
}) {
  const { reavaliacaoId } = await params;
  const retornoInformado = (await searchParams).retorno;
  const retorno =
    typeof retornoInformado === "string" &&
    (retornoInformado === "/reavaliacoes" ||
      retornoInformado.startsWith("/reavaliacoes?"))
      ? retornoInformado
      : "/reavaliacoes";
  return (
    <ReavaliacaoDetalheServer reavaliacaoId={reavaliacaoId} retorno={retorno} />
  );
}
