export default function PatrimonioDetalheLoading() {
  return (
    <main
      className="grid gap-4 p-4 sm:p-7"
      aria-busy="true"
      aria-label="Carregando patrimônio"
    >
      <div className="h-12 w-96 max-w-full animate-pulse rounded bg-slate-200" />
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="h-24 animate-pulse rounded bg-white" />
        <div className="h-24 animate-pulse rounded bg-white" />
        <div className="h-24 animate-pulse rounded bg-white" />
      </div>
      <div className="h-96 animate-pulse rounded bg-white" />
      <span className="sr-only">Carregando detalhes do patrimônio…</span>
    </main>
  );
}
