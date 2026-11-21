import { EditarSetorPage } from "@/app/(sistema)/cadastros/setores/_setores-page";

export default function Page({
  params,
}: {
  params: Promise<{ setorId: string }>;
}) {
  return <EditarSetorPage params={params} modal />;
}
