import type { Metadata } from "next";
import { CatalogEditPage } from "@/app/(sistema)/_cadastros/_cadastros-page";
export const metadata: Metadata = { title: "Editar natureza" };
export default async function Page({
  params,
}: {
  params: Promise<{ naturezaId: string }>;
}) {
  const { naturezaId } = await params;
  return <CatalogEditPage section="naturezas" id={naturezaId} />;
}
