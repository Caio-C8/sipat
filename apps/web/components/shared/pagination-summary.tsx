import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

type PaginationSummaryProps = {
  meta: { pagina: number; ultimaPagina: number; total: number };
  href: (page: number) => string;
  showPageCount?: boolean;
};

function PaginationSummary({
  meta,
  href,
  showPageCount = true,
}: PaginationSummaryProps) {
  const lastPage = Math.max(1, meta.ultimaPagina);

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
      <p aria-live="polite">
        {meta.total} registros
        {showPageCount ? ` · Página ${meta.pagina} de ${lastPage}` : null}
      </p>
      <Pagination className="mx-0 w-auto">
        <PaginationContent>
          {meta.pagina > 1 ? (
            <PaginationItem>
              <PaginationPrevious href={href(meta.pagina - 1)} />
            </PaginationItem>
          ) : null}
          {meta.pagina < lastPage ? (
            <PaginationItem>
              <PaginationNext href={href(meta.pagina + 1)} />
            </PaginationItem>
          ) : null}
        </PaginationContent>
      </Pagination>
    </div>
  );
}

export { PaginationSummary };
