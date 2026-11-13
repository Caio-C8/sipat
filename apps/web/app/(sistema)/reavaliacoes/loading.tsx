import { Skeleton } from "@/components/ui/skeleton";

export default function ReavaliacoesLoading() {
  return (
    <main className="grid gap-5 bg-[#f7f9fc] p-4 sm:p-7" aria-busy="true">
      <p role="status" className="sr-only">
        Carregando reavaliações…
      </p>
      <div className="flex items-center justify-between gap-4">
        <div className="grid gap-2">
          <Skeleton className="h-7 w-44" />
          <Skeleton className="h-4 w-80 max-w-full" />
        </div>
        <Skeleton className="h-10 w-40" />
      </div>
      <Skeleton className="h-48 w-full rounded-lg" />
      <Skeleton className="h-80 w-full rounded-lg" />
    </main>
  );
}
