import type { Metadata } from "next";
import { CatalogCreatePage } from "@/app/(sistema)/_cadastros/_cadastros-page";
export const metadata: Metadata = { title: "Cadastrar natureza" };
export default function Page() {
  return <CatalogCreatePage section="naturezas" />;
}
