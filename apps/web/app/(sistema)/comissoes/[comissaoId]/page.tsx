import type { Metadata } from "next";
import { CatalogDetailPage } from "@/app/(sistema)/_cadastros/_cadastros-page";
export const metadata: Metadata = { title: "Detalhes da comissão" };
export default async function Page({
  params,
}: {
  params: Promise<{ comissaoId: string }>;
}) {
  const { comissaoId } = await params;
  return <CatalogDetailPage section="comissoes" id={comissaoId} />;
}
