import type { Metadata } from "next";
import type { SearchCadastros } from "@/app/(sistema)/_cadastros/_cadastros-page";
import { FornecedoresPage } from "@/app/(sistema)/_cadastros/_cadastros-principais-page";

export const metadata: Metadata = {
  title: "Fornecedores",
  description: "Consulta e gestão de fornecedores do SIPAT.",
};

export default function Page({
  searchParams,
}: {
  searchParams: SearchCadastros;
}) {
  return <FornecedoresPage searchParams={searchParams} />;
}
