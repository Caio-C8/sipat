import { Skeleton } from "@/components/ui/skeleton";

export default function BaixasLoading() {
  return (
    <main className="grid gap-5 p-4 sm:p-7" aria-label="Carregando baixas">
      <Skeleton className="h-14 w-72" />
      <Skeleton className="h-64 w-full" />
      <Skeleton className="h-80 w-full" />
    </main>
  );
}
