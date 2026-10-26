"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Menu, Package, X } from "lucide-react";
import { usePathname } from "next/navigation";
import type { PerfilUsuario } from "@repo/contracts";
import {
  listarNavegacaoPorPerfil,
  type GrupoNavegacao,
} from "@/lib/navigation/system-navigation";
import styles from "./system-shell.module.css";

const grupos: ReadonlyArray<Readonly<{ id: GrupoNavegacao; label: string }>> = [
  { id: "principal", label: "Principal" },
  { id: "administracao", label: "Administração" },
];

export function SystemSidebar({ perfil }: Readonly<{ perfil: PerfilUsuario }>) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const itens = listarNavegacaoPorPerfil(perfil);

  useEffect(() => {
    if (!menuOpen) {
      return;
    }

    function fecharComEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setMenuOpen(false);
        triggerRef.current?.focus();
      }
    }

    document.addEventListener("keydown", fecharComEscape);
    return () => document.removeEventListener("keydown", fecharComEscape);
  }, [menuOpen]);

  return (
    <aside className={styles.sidebar}>
      <div className={styles.sidebarHead}>
        <div className={styles.sidebarBrand}>
          <Link href="/dashboard" className={styles.brandLink}>
            <span className={styles.brandMark}>
              <Package size={17} aria-hidden="true" />
            </span>
            <span>SIPAT</span>
          </Link>
          <p>Gestão patrimonial</p>
        </div>
        <button
          ref={triggerRef}
          type="button"
          className={styles.menuToggle}
          aria-controls="system-navigation"
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((open) => !open)}
        >
          {menuOpen ? (
            <X size={17} aria-hidden="true" />
          ) : (
            <Menu size={17} aria-hidden="true" />
          )}
          <span>{menuOpen ? "Fechar" : "Menu"}</span>
        </button>
      </div>

      <nav
        id="system-navigation"
        className={`${styles.sidebarNav} ${menuOpen ? styles.sidebarNavOpen : ""}`}
        aria-label="Navegação principal"
      >
        {grupos.map((grupo) => {
          const itensDoGrupo = itens.filter((item) => item.grupo === grupo.id);

          if (itensDoGrupo.length === 0) {
            return null;
          }

          return (
            <section className={styles.navGroup} key={grupo.id}>
              <h2 className={styles.groupLabel}>{grupo.label}</h2>
              <ul>
                {itensDoGrupo.map((item) => {
                  const Icon = item.icon;
                  const ativo = item.href === pathname;

                  return (
                    <li key={item.id}>
                      {item.href ? (
                        <Link
                          href={item.href}
                          aria-current={ativo ? "page" : undefined}
                          className={
                            ativo ? styles.activeNavItem : styles.navItem
                          }
                        >
                          <Icon size={15} aria-hidden="true" />
                          <span>{item.label}</span>
                        </Link>
                      ) : (
                        <span
                          className={`${styles.navItem} ${styles.navItemUnavailable}`}
                          aria-disabled="true"
                        >
                          <Icon size={15} aria-hidden="true" />
                          <span>{item.label}</span>
                          <span className={styles.srOnly}>
                            Não implementado
                          </span>
                        </span>
                      )}
                    </li>
                  );
                })}
              </ul>
            </section>
          );
        })}
      </nav>

      <div className={styles.sidebarFooter}>
        <span className={styles.cityMark}>
          <Image
            className={styles.cityLogo}
            src="/images/brasao.png"
            alt=""
            width={89}
            height={90}
            unoptimized
          />
        </span>
        <span>
          <strong>Câmara Municipal</strong>
          <small>Patos de Minas</small>
        </span>
      </div>
    </aside>
  );
}
