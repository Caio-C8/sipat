import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/shared/page-header";

export default function BaixasLoading() {
  return (
    <main className="grid gap-5 p-4 sm:p-7" aria-label="Carregando baixas">
      <PageHeader
        title="Baixa"
        description="Consulte as baixas patrimoniais registradas."
      />
      <Skeleton className="h-64 w-full" />
      <Skeleton className="h-80 w-full" />
    </main>
  );
}
