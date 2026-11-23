import { CatalogEditPage } from "@/app/(sistema)/_cadastros/_cadastros-page";
export default async function Page({
  params,
}: {
  params: Promise<{ comissaoId: string }>;
}) {
  const { comissaoId } = await params;
  return <CatalogEditPage section="comissoes" id={comissaoId} modal />;
}
