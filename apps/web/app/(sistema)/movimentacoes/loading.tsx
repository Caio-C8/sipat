import { PageHeader } from "@/components/shared/page-header";

export default function LoadingMovimentacoes() {
  return (
    <main
      className="grid gap-5 bg-[#f7f9fc] p-4 text-[#19355d] sm:p-6 lg:p-7"
      aria-busy="true"
    >
      <PageHeader
        title="Movimentações"
        description="Consulte as transferências registradas entre setores."
      />
      <div className="h-32 animate-pulse rounded-lg border border-[#dce4ef] bg-white motion-reduce:animate-none" />
      <div className="h-72 animate-pulse rounded-lg border border-[#dce4ef] bg-white motion-reduce:animate-none" />
      <p role="status" className="sr-only">
        Carregando movimentações…
      </p>
    </main>
  );
}
