import type { Metadata } from "next";
import { CadastrosPage, type SearchCadastros } from "../_cadastros-page";
export const metadata: Metadata = {
  title: "Espécies",
  description: "Consulta e gestão de espécies do SIPAT.",
};
export default function EspeciesPage({
  searchParams,
}: {
  searchParams: SearchCadastros;
}) {
  return <CadastrosPage secao="especies" searchParams={searchParams} />;
}
