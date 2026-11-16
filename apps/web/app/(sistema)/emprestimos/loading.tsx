import { PageHeader } from "@/components/shared/page-header";

export default function LoadingEmprestimos() {
  return (
    <main className="grid gap-5 p-4 sm:p-7">
      <PageHeader
        title="Empréstimos"
        description="Consulte saídas temporárias, prazos e devoluções."
      />
      <p role="status">Carregando empréstimos...</p>
    </main>
  );
}
