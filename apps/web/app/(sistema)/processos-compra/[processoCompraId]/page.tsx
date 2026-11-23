import type { Metadata } from "next";
import { CatalogDetailPage } from "@/app/(sistema)/_cadastros/_cadastros-page";
export const metadata: Metadata = { title: "Detalhes do processo de compra" };
export default async function Page({
  params,
}: {
  params: Promise<{ processoCompraId: string }>;
}) {
  const { processoCompraId } = await params;
  return <CatalogDetailPage section="processos" id={processoCompraId} />;
}
