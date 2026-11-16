import { PageHeader } from "@/components/shared/page-header";

export default function PatrimonioDetalheLoading() {
  return (
    <main
      className="grid gap-4 p-4 sm:p-7"
      aria-busy="true"
      aria-label="Carregando patrimônio"
    >
      <PageHeader
        title="Detalhes do patrimônio"
        description="Consulte os dados cadastrais e o histórico do bem."
      />
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="h-24 animate-pulse rounded bg-white" />
        <div className="h-24 animate-pulse rounded bg-white" />
        <div className="h-24 animate-pulse rounded bg-white" />
      </div>
      <div className="h-96 animate-pulse rounded bg-white" />
      <span className="sr-only">Carregando detalhes do patrimônio…</span>
    </main>
  );
}
