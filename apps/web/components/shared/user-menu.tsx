"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import type { IdentidadeAutenticada } from "@repo/contracts";
import { LogoutButton } from "@/components/auth/logout-button";
import { nomesPerfis } from "@/lib/navigation/system-navigation";
import styles from "./system-shell.module.css";

function obterIniciais(nome: string): string {
  return nome
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((parte) => parte[0]?.toLocaleUpperCase("pt-BR") ?? "")
    .join("");
}

export function UserMenu({
  identidade,
}: Readonly<{ identidade: IdentidadeAutenticada }>) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const perfil = nomesPerfis[identidade.perfil];
  const iniciais = obterIniciais(identidade.nome);

  useEffect(() => {
    if (!open) {
      return;
    }

    function fechar(event: KeyboardEvent | MouseEvent) {
      if (event instanceof KeyboardEvent && event.key !== "Escape") {
        return;
      }

      if (
        event instanceof MouseEvent &&
        event.target instanceof Node &&
        containerRef.current?.contains(event.target)
      ) {
        return;
      }

      setOpen(false);
      if (event instanceof KeyboardEvent) {
        triggerRef.current?.focus();
      }
    }

    document.addEventListener("keydown", fechar);
    document.addEventListener("mousedown", fechar);
    return () => {
      document.removeEventListener("keydown", fechar);
      document.removeEventListener("mousedown", fechar);
    };
  }, [open]);

  return (
    <div className={styles.menuContainer} ref={containerRef}>
      <button
        ref={triggerRef}
        type="button"
        className={styles.profileTrigger}
        aria-controls="user-menu"
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={() => setOpen((value) => !value)}
      >
        <span className={styles.avatar}>{iniciais}</span>
        <span className={styles.profileText}>
          <strong>{identidade.nome}</strong>
          <small>{perfil}</small>
        </span>
        <ChevronDown size={14} aria-hidden="true" />
        <span className={styles.srOnly}>Menu do usuário</span>
      </button>
      {open ? (
        <div
          id="user-menu"
          className={`${styles.popover} ${styles.userMenu}`}
          role="menu"
        >
          <div className={styles.userMenuIdentity}>
            <strong>{identidade.nome}</strong>
            <span>{perfil}</span>
          </div>
          <LogoutButton
            className={styles.logoutButton}
            wrapperClassName={styles.logoutWrapper}
            errorClassName={styles.logoutError}
            menuItem
          />
        </div>
      ) : null}
    </div>
  );
}
