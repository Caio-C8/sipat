import { CatalogEditPage } from "@/app/(sistema)/_cadastros/_cadastros-page";
export default async function Page({
  params,
}: {
  params: Promise<{ processoCompraId: string }>;
}) {
  const { processoCompraId } = await params;
  return <CatalogEditPage section="processos" id={processoCompraId} modal />;
}
