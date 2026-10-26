import type { ReactNode } from "react";
import type { IdentidadeAutenticada } from "@repo/contracts";
import { SystemSidebar } from "./system-sidebar";
import { SystemTopbar } from "./system-topbar";
import styles from "./system-shell.module.css";

export function AuthenticatedShell({
  children,
  identidade,
}: Readonly<{
  children: ReactNode;
  identidade: IdentidadeAutenticada;
}>) {
  return (
    <div className={styles.shell}>
      <SystemSidebar perfil={identidade.perfil} />
      <div className={styles.workspace}>
        <SystemTopbar identidade={identidade} />
        {children}
      </div>
    </div>
  );
}
