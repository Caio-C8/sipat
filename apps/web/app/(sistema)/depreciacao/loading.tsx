import { PageHeader } from "@/components/shared/page-header";

export default function DepreciacaoLoading() {
  return (
    <main className="grid gap-5 p-4 sm:p-7">
      <PageHeader
        title="Depreciação"
        description="Consulte e processe as competências patrimoniais pendentes."
      />
      <p role="status">Carregando a consulta de depreciações…</p>
    </main>
  );
}
