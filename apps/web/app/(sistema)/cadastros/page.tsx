import type { Metadata } from "next";
import { CadastrosPage } from "./_cadastros-page";

export const metadata: Metadata = {
  title: "Processos de compra",
  description: "Prévia visual dos processos de compra do SIPAT.",
};
export default function ProcessosCompraPage() {
  return <CadastrosPage secao="processos" />;
}
