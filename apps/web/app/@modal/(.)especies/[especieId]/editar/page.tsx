import { CatalogEditPage } from "@/app/(sistema)/_cadastros/_cadastros-page";
export default async function Page({
  params,
}: {
  params: Promise<{ especieId: string }>;
}) {
  const { especieId } = await params;
  return <CatalogEditPage section="especies" id={especieId} modal />;
}
