import type { Metadata } from "next";
import { CadastrosPage } from "../_cadastros-page";

export const metadata: Metadata = {
  title: "Responsáveis",
  description: "Prévia visual do cadastro de responsáveis do SIPAT.",
};
export default function ResponsaveisPage() {
  return <CadastrosPage secao="responsaveis" />;
}
