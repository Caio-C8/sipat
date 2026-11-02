export default function PatrimoniosLoading() {
  return (
    <main
      className="grid gap-4 p-4 sm:p-7"
      aria-busy="true"
      aria-label="Carregando patrimônios"
    >
      <div className="h-10 w-72 animate-pulse rounded bg-slate-200" />
      <div className="h-36 animate-pulse rounded-lg bg-white" />
      <div className="h-80 animate-pulse rounded-lg bg-white" />
      <span className="sr-only">Carregando patrimônios…</span>
    </main>
  );
}
