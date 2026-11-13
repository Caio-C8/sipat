import type { Metadata } from "next";
import { ReavaliacaoDetalheServer } from "@/features/reavaliacoes/components/reavaliacao-detalhe-server";
import ReavaliacoesPage from "../page";

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
  const filtros = Object.fromEntries(
    new URL(retorno, "http://sipat.local").searchParams,
  );
  return (
    <>
      <ReavaliacoesPage searchParams={Promise.resolve(filtros)} />
      <ReavaliacaoDetalheServer
        reavaliacaoId={reavaliacaoId}
        interceptado={false}
        retorno={retorno}
      />
    </>
  );
}
