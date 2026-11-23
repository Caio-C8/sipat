import type { Metadata } from "next";
import { EditarFornecedorPage } from "@/app/(sistema)/_cadastros/_cadastros-principais-page";

export const metadata: Metadata = { title: "Editar fornecedor" };

export default function Page({
  params,
}: {
  params: Promise<{ fornecedorId: string }>;
}) {
  return <EditarFornecedorPage params={params} />;
}
