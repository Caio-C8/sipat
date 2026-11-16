import { PageHeader } from "@/components/shared/page-header";

export default function Loading() {
  return (
    <main className="grid gap-5 p-6">
      <PageHeader
        title="Relatórios"
        description="Consulte dados do patrimônio e emita relatórios."
      />
      <p role="status">Carregando relatórios…</p>
    </main>
  );
}
