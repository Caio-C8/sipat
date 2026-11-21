import type { Metadata } from "next";
import { NovoResponsavelPage } from "../../_cadastros-principais-page";

export const metadata: Metadata = { title: "Cadastrar responsável" };

export default function Page() {
  return <NovoResponsavelPage />;
}
