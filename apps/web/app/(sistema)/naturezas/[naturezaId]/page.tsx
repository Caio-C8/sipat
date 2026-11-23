import type { Metadata } from "next";
import { CatalogDetailPage } from "@/app/(sistema)/_cadastros/_cadastros-page";
export const metadata: Metadata = { title: "Detalhes da natureza" };
export default async function Page({
  params,
}: {
  params: Promise<{ naturezaId: string }>;
}) {
  const { naturezaId } = await params;
  return <CatalogDetailPage section="naturezas" id={naturezaId} />;
}
