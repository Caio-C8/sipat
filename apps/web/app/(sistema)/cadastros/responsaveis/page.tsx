import type { Metadata } from "next";
import { CadastrosPage, type SearchCadastros } from "../_cadastros-page";
export const metadata: Metadata = {
  title: "Responsáveis",
  description: "Consulta e gestão de responsáveis do SIPAT.",
};
export default function ResponsaveisPage({
  searchParams,
}: {
  searchParams: SearchCadastros;
}) {
  return <CadastrosPage secao="responsaveis" searchParams={searchParams} />;
}
