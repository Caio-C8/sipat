import type { Metadata } from "next";
import { CadastrosPage, type SearchCadastros } from "./_cadastros-page";
export const metadata: Metadata = {
  title: "Processos de compra",
  description: "Consulta e gestão de processos de compra do SIPAT.",
};
export default function ProcessosCompraPage({
  searchParams,
}: {
  searchParams: SearchCadastros;
}) {
  return <CadastrosPage secao="processos" searchParams={searchParams} />;
}
