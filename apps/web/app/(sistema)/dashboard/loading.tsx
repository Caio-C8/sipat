export default function DashboardLoading() {
  return (
    <main
      className="mx-auto grid w-full max-w-[1900px] gap-3 px-4 py-4 min-[651px]:px-5 min-[651px]:pt-[15px] min-[651px]:pb-[17px] min-[1500px]:gap-[17px] min-[1500px]:px-[30px] min-[1500px]:pt-[22px] min-[1500px]:pb-[26px]"
      aria-busy="true"
      aria-label="Carregando visão geral"
    >
      <div className="h-12 w-full max-w-[360px] animate-pulse rounded-lg bg-muted motion-reduce:animate-none" />
      <div className="grid grid-cols-1 gap-2 min-[361px]:grid-cols-2 min-[421px]:gap-3.5 min-[801px]:grid-cols-4 min-[1500px]:gap-[18px]">
        {Array.from({ length: 4 }, (_, index) => (
          <div
            className="min-h-[70px] animate-pulse rounded-lg bg-muted motion-reduce:animate-none min-[1500px]:min-h-[93px]"
            key={index}
          />
        ))}
      </div>
      <div className="min-h-[250px] animate-pulse rounded-lg bg-muted motion-reduce:animate-none" />
      <span className="sr-only">Carregando dados patrimoniais…</span>
    </main>
  );
}
