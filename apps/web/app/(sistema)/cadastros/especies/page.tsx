import type { Metadata } from "next";
import { CadastrosPage } from "../_cadastros-page";

export const metadata: Metadata = {
  title: "Espécies",
  description: "Prévia visual do cadastro de espécies do SIPAT.",
};
export default function EspeciesPage() {
  return <CadastrosPage secao="especies" />;
}
