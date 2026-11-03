import type { Metadata } from "next";
import { CadastrosPage, type SearchCadastros } from "../_cadastros-page";
export const metadata: Metadata = {
  title: "Comissões",
  description: "Consulta e gestão de comissões do SIPAT.",
};
export default function ComissoesPage({
  searchParams,
}: {
  searchParams: SearchCadastros;
}) {
  return <CadastrosPage secao="comissoes" searchParams={searchParams} />;
}
