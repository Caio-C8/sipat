import { EditarFornecedorPage } from "@/app/(sistema)/_cadastros/_cadastros-principais-page";

export default function Page({
  params,
}: {
  params: Promise<{ fornecedorId: string }>;
}) {
  return <EditarFornecedorPage params={params} modal />;
}
