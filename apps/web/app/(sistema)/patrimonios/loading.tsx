import { PageHeader } from "@/components/shared/page-header";

export default function PatrimoniosLoading() {
  return (
    <main
      className="grid gap-4 p-4 sm:p-7"
      aria-busy="true"
      aria-label="Carregando patrimônios"
    >
      <PageHeader
        title="Consultar patrimônio"
        description="Pesquise os bens e consulte sua situação atual."
      />
      <div className="h-36 animate-pulse rounded-lg bg-white" />
      <div className="h-80 animate-pulse rounded-lg bg-white" />
      <span className="sr-only">Carregando patrimônios…</span>
    </main>
  );
}
