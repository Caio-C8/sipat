import type { ReactNode } from "react";
import type { IdentidadeAutenticada } from "@repo/contracts";
import { SystemSidebar } from "./system-sidebar";
import { SystemTopbar } from "./system-topbar";

export function AuthenticatedShell({
  children,
  identidade,
}: Readonly<{
  children: ReactNode;
  identidade: IdentidadeAutenticada;
}>) {
  return (
    <div className="min-h-svh bg-[#f7f9fc] text-xs text-[#17253d] min-[1101px]:grid min-[1101px]:grid-cols-[clamp(184px,14vw,232px)_minmax(0,1fr)]">
      <SystemSidebar perfil={identidade.perfil} />
      <div className="min-w-0">
        <SystemTopbar identidade={identidade} />
        {children}
      </div>
    </div>
  );
}
