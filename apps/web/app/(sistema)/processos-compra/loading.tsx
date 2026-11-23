import { PageHeader } from "@/components/shared/page-header";

export default function Loading() {
  return (
    <main className="grid gap-5 p-6">
      <PageHeader
        title="Processos de compra"
        description="Consulte processos de compra e seus documentos fiscais."
      />
      <p role="status" className="text-sm">
        Carregando processos de compra…
      </p>
    </main>
  );
}
