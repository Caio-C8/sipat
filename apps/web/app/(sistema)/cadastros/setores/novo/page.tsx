import type { Metadata } from "next";
import { NovoSetor } from "@/features/cadastros/components/setores-telas";

export const metadata: Metadata = {
  title: "Cadastrar setor",
  description: "Prévia visual do cadastro de setores do SIPAT.",
};
export default function NovoSetorPage() {
  return <NovoSetor />;
}
