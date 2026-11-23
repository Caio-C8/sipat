import type { Metadata } from "next";
export const metadata: Metadata = {
  title: "Cadastrar setor",
  description: "Consulta e gestão de setores do SIPAT.",
};
import { NovoSetorPage } from "../_setores-page";

export default function Page() {
  return <NovoSetorPage />;
}
