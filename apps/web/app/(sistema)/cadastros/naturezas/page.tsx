import type { Metadata } from "next";
import { CadastrosPage, type SearchCadastros } from "../_cadastros-page";
export const metadata: Metadata = {
  title: "Naturezas",
  description: "Consulta e gestão de naturezas do SIPAT.",
};
export default function NaturezasPage({
  searchParams,
}: {
  searchParams: SearchCadastros;
}) {
  return <CadastrosPage secao="naturezas" searchParams={searchParams} />;
}
