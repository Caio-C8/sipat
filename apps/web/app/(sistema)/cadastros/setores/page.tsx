import type { Metadata } from "next";
import { ListaSetores } from "@/features/cadastros/components/setores-telas";

export const metadata: Metadata = {
  title: "Setores",
  description: "Prévia visual da consulta de setores do SIPAT.",
};
export default function SetoresPage() {
  return <ListaSetores />;
}
