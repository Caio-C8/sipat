import type { Metadata } from "next";
import { CadastrosPage, type SearchCadastros } from "../_cadastros-page";

export const metadata: Metadata = {
  title: "Fornecedores",
  description: "Consulta e gestão de fornecedores do SIPAT.",
};

export default function FornecedoresPage({
  searchParams,
}: {
  searchParams: SearchCadastros;
}) {
  return <CadastrosPage secao="fornecedores" searchParams={searchParams} />;
}
