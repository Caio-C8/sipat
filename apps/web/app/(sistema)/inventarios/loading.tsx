export default function InventariosLoading() {
  return (
    <main
      className="grid gap-5 p-4 sm:p-7"
      aria-busy="true"
      aria-label="Carregando inventários"
    >
      <div className="h-9 w-64 animate-pulse rounded bg-slate-200" />
      <div className="h-24 animate-pulse rounded-xl bg-slate-100" />
      <div className="h-96 animate-pulse rounded-xl bg-slate-100" />
    </main>
  );
}
