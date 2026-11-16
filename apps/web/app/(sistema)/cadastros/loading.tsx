import { PageHeader } from "@/components/shared/page-header";

export default function Loading() {
  return (
    <main className="grid gap-5 p-6">
      <PageHeader
        title="Cadastros"
        description="Consulte e gerencie os cadastros administrativos."
      />
      <p role="status" className="text-sm">
        Carregando cadastros…
      </p>
    </main>
  );
}
