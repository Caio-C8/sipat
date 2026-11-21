import type { Metadata } from "next";
import type { SearchCadastros } from "../_cadastros-page";
import { ResponsaveisPage } from "../_cadastros-principais-page";
export const metadata: Metadata = {
  title: "Responsáveis",
  description: "Consulta e gestão de responsáveis do SIPAT.",
};
export default function Page({
  searchParams,
}: {
  searchParams: SearchCadastros;
}) {
  return <ResponsaveisPage searchParams={searchParams} />;
}
