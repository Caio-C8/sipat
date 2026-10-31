import type { Metadata } from "next";
import { CadastrosPage } from "../_cadastros-page";

export const metadata: Metadata = {
  title: "Comissões",
  description: "Prévia visual do cadastro de comissões do SIPAT.",
};
export default function ComissoesPage() {
  return <CadastrosPage secao="comissoes" />;
}
