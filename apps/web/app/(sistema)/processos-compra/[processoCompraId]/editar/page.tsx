import type { Metadata } from "next";
import { CatalogEditPage } from "@/app/(sistema)/_cadastros/_cadastros-page";
export const metadata: Metadata = { title: "Editar processo de compra" };
export default async function Page({
  params,
}: {
  params: Promise<{ processoCompraId: string }>;
}) {
  const { processoCompraId } = await params;
  return <CatalogEditPage section="processos" id={processoCompraId} />;
}
