import type { Metadata } from "next";
import { NovoFornecedorPage } from "../../_cadastros-principais-page";

export const metadata: Metadata = { title: "Cadastrar fornecedor" };

export default function Page() {
  return <NovoFornecedorPage />;
}
