import type { IdentidadeAutenticada } from "@repo/contracts";
import { BuscaGlobal } from "@/features/busca/components/busca-global";
import { CurrentBreadcrumb } from "./current-breadcrumb";
import { UserMenu } from "./user-menu";

export function SystemTopbar({
  identidade,
}: Readonly<{ identidade: IdentidadeAutenticada }>) {
  return (
    <header className="relative z-10 flex min-h-[49px] items-start justify-between gap-4 border-b border-[#dfe7f1] bg-white px-4 py-2 min-[701px]:items-center min-[701px]:px-5 min-[701px]:py-[7px] min-[1500px]:min-h-[62px] min-[1500px]:px-[30px] min-[1500px]:py-2.5">
      <CurrentBreadcrumb />
      <div className="flex items-center gap-1 min-[701px]:gap-3">
        <BuscaGlobal />
        <UserMenu identidade={identidade} />
      </div>
    </header>
  );
}
