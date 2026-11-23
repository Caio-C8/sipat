import type { Metadata } from "next";
import { CatalogEditPage } from "@/app/(sistema)/_cadastros/_cadastros-page";
export const metadata: Metadata = { title: "Editar comissão" };
export default async function Page({
  params,
}: {
  params: Promise<{ comissaoId: string }>;
}) {
  const { comissaoId } = await params;
  return <CatalogEditPage section="comissoes" id={comissaoId} />;
}
