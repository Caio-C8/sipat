import type { Metadata } from "next";
import { CadastrosPage } from "../_cadastros-page";

export const metadata: Metadata = {
  title: "Naturezas",
  description: "Prévia visual do cadastro de naturezas do SIPAT.",
};
export default function NaturezasPage() {
  return <CadastrosPage secao="naturezas" />;
}
