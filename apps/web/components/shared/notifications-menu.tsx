"use client";

import { useEffect, useRef, useState } from "react";
import { Bell } from "lucide-react";
import styles from "./system-shell.module.css";

export function NotificationsMenu() {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

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
        className={styles.iconButton}
        aria-label="Notificações"
        aria-controls="notifications-panel"
        aria-expanded={open}
        aria-haspopup="dialog"
        onClick={() => setOpen((value) => !value)}
      >
        <Bell size={18} aria-hidden="true" />
      </button>
      {open ? (
        <section
          id="notifications-panel"
          className={`${styles.popover} ${styles.notificationsPanel}`}
          aria-label="Notificações"
        >
          <h2>Notificações</h2>
          <section aria-labelledby="pending-notifications-title">
            <h3 id="pending-notifications-title">Pendências recentes</h3>
            <p>Não implementado</p>
          </section>
          <section aria-labelledby="operations-notifications-title">
            <h3 id="operations-notifications-title">Últimas operações</h3>
            <p>Não implementado</p>
          </section>
        </section>
      ) : null}
    </div>
  );
}
