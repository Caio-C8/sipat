import { PageHeader } from "@/components/shared/page-header";

export default function InventariosLoading() {
  return (
    <main
      className="grid gap-5 p-4 sm:p-7"
      aria-busy="true"
      aria-label="Carregando inventários"
    >
      <PageHeader
        title="Inventários"
        description="Acompanhe as conferências e correções patrimoniais."
      />
      <div className="h-24 animate-pulse rounded-xl bg-slate-100" />
      <div className="h-96 animate-pulse rounded-xl bg-slate-100" />
    </main>
  );
}
