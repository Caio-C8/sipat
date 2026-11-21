import { EditarResponsavelPage } from "@/app/(sistema)/cadastros/_cadastros-principais-page";

export default function Page({
  params,
}: {
  params: Promise<{ responsavelId: string }>;
}) {
  return <EditarResponsavelPage params={params} modal />;
}
