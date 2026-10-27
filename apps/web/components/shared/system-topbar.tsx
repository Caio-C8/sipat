import { Search } from "lucide-react";
import type { IdentidadeAutenticada } from "@repo/contracts";
import { CurrentBreadcrumb } from "./current-breadcrumb";
import { NotificationsMenu } from "./notifications-menu";
import { UserMenu } from "./user-menu";

export function SystemTopbar({
  identidade,
}: Readonly<{ identidade: IdentidadeAutenticada }>) {
  return (
    <header className="relative z-10 flex min-h-[49px] items-start justify-between gap-4 border-b border-[#dfe7f1] bg-white px-4 py-2 min-[701px]:items-center min-[701px]:px-5 min-[701px]:py-[7px] min-[1500px]:min-h-[62px] min-[1500px]:px-[30px] min-[1500px]:py-2.5">
      <CurrentBreadcrumb />
      <div className="flex items-center gap-1 min-[701px]:gap-3">
        <label
          className="flex size-[34px] items-center justify-center gap-2 rounded-md border border-[#dfe7f1] bg-[#f7f9fc] px-2 text-[#6f849e] opacity-80 min-[701px]:h-[30px] min-[701px]:w-[clamp(170px,20vw,260px)] min-[701px]:justify-start min-[1500px]:h-9 min-[1500px]:w-[310px]"
          title="Pesquisa ainda não implementada"
        >
          <Search size={15} aria-hidden="true" />
          <span className="sr-only">Pesquisa ainda não implementada</span>
          <input
            className="hidden w-full min-w-0 border-0 bg-transparent text-[10px] text-[#54708c] outline-0 min-[701px]:block min-[1500px]:text-xs"
            aria-label="Pesquisa ainda não implementada"
            placeholder="Buscar no SIPAT..."
            disabled
          />
        </label>
        <NotificationsMenu />
        <UserMenu identidade={identidade} />
      </div>
    </header>
  );
}
