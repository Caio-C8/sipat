import type { Metadata } from "next";
import { EditarSetorPage } from "../../_setores-page";

export const metadata: Metadata = { title: "Editar setor" };

export default function Page({
  params,
}: {
  params: Promise<{ setorId: string }>;
}) {
  return <EditarSetorPage params={params} />;
}
