import { EditarSetorPage } from "@/app/(sistema)/setores/_setores-page";

export default function Page({
  params,
}: {
  params: Promise<{ setorId: string }>;
}) {
  return <EditarSetorPage params={params} modal />;
}
