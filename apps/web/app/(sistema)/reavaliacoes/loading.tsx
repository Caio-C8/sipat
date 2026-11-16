import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/shared/page-header";

export default function ReavaliacoesLoading() {
  return (
    <main className="grid gap-5 bg-[#f7f9fc] p-4 sm:p-7" aria-busy="true">
      <p role="status" className="sr-only">
        Carregando reavaliações…
      </p>
      <PageHeader
        title="Reavaliações"
        description="Consulte os registros e inicie uma nova reavaliação patrimonial."
      />
      <Skeleton className="h-48 w-full rounded-lg" />
      <Skeleton className="h-80 w-full rounded-lg" />
    </main>
  );
}
