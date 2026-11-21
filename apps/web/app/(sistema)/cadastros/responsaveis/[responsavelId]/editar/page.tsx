import type { Metadata } from "next";
import { EditarResponsavelPage } from "../../../_cadastros-principais-page";

export const metadata: Metadata = { title: "Editar responsável" };

export default function Page({
  params,
}: {
  params: Promise<{ responsavelId: string }>;
}) {
  return <EditarResponsavelPage params={params} />;
}
