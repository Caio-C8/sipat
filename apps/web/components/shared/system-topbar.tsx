import { Search } from "lucide-react";
import type { IdentidadeAutenticada } from "@repo/contracts";
import { CurrentBreadcrumb } from "./current-breadcrumb";
import { NotificationsMenu } from "./notifications-menu";
import { UserMenu } from "./user-menu";
import styles from "./system-shell.module.css";

export function SystemTopbar({
  identidade,
}: Readonly<{ identidade: IdentidadeAutenticada }>) {
  return (
    <header className={styles.topbar}>
      <CurrentBreadcrumb />
      <div className={styles.topActions}>
        <label
          className={styles.searchBox}
          title="Pesquisa ainda não implementada"
        >
          <Search size={15} aria-hidden="true" />
          <span className={styles.srOnly}>Pesquisa ainda não implementada</span>
          <input
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
