import { PageHeader } from "@/components/shared/page-header";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <main className="mx-auto grid w-full min-w-0 max-w-[1900px] gap-5 px-4 py-4 sm:px-7 sm:py-6">
      <PageHeader
        title="Relatórios"
        description="Consulte dados do patrimônio e emita relatórios."
      />
      <p role="status" className="sr-only">
        Carregando relatórios…
      </p>
      <div
        className="grid gap-4 md:grid-cols-2 xl:grid-cols-3"
        aria-hidden="true"
      >
        {Array.from({ length: 6 }, (_, indice) => (
          <Card key={indice} className="gap-3">
            <Skeleton className="size-9" />
            <Skeleton className="h-5 w-3/5" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-10 w-full" />
          </Card>
        ))}
      </div>
    </main>
  );
}
