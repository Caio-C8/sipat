import type { Metadata } from "next";
import { CatalogDetailPage } from "@/app/(sistema)/_cadastros/_cadastros-page";
export const metadata: Metadata = { title: "Detalhes da espécie" };
export default async function Page({
  params,
}: {
  params: Promise<{ especieId: string }>;
}) {
  const { especieId } = await params;
  return <CatalogDetailPage section="especies" id={especieId} />;
}
