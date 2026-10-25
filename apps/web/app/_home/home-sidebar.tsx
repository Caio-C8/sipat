"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Archive,
  ArrowLeftRight,
  BarChart3,
  Boxes,
  ChevronDown,
  ClipboardList,
  Landmark,
  LayoutDashboard,
  Menu,
  Package,
  Settings2,
  TrendingDown,
  TrendingUp,
  UsersRound,
  Wrench,
  X,
} from "lucide-react";
import styles from "./home.module.css";

const mainItems = [
  { label: "Movimentações", icon: ArrowLeftRight },
  { label: "Inventário", icon: ClipboardList },
  { label: "Empréstimos", icon: Landmark },
  { label: "Manutenção", icon: Wrench },
  { label: "Reavaliação", icon: TrendingUp },
  { label: "Depreciação", icon: TrendingDown },
  { label: "Baixa e estorno", icon: Archive },
  { label: "Relatórios", icon: BarChart3 },
];

const adminItems = [
  "Processos de compra",
  "Espécies",
  "Naturezas",
  "Comissões",
  "Responsáveis",
  "Setores",
];

export function HomeSidebar() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <aside className={styles.sidebar}>
      <div className={styles.sidebarHead}>
        <div className={styles.sidebarBrand}>
          <Link href="/" className={styles.brandLink}>
            <span className={styles.brandMark}>
              <Package size={17} aria-hidden="true" />
            </span>
            <span>SIPAT</span>
          </Link>
          <p>Gestão patrimonial</p>
        </div>
        <button
          type="button"
          className={styles.menuToggle}
          aria-controls="home-navigation"
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
        id="home-navigation"
        className={`${styles.sidebarNav} ${menuOpen ? styles.sidebarNavOpen : ""}`}
        aria-label="Navegação principal"
      >
        <div className={styles.navGroup}>
          <p className={styles.groupLabel}>Principal</p>
          <Link href="/" aria-current="page" className={styles.activeNavItem}>
            <LayoutDashboard size={15} aria-hidden="true" />
            <span>Início</span>
          </Link>
          <div className={styles.navItem}>
            <Boxes size={15} aria-hidden="true" />
            <span>Patrimônio</span>
            <ChevronDown
              size={13}
              aria-hidden="true"
              className={styles.navChevron}
            />
          </div>
          <div className={styles.subNav}>
            <span>Pesquisar patrimônio</span>
            <span>Cadastrar patrimônio</span>
          </div>
          {mainItems.map(({ label, icon: Icon }) => (
            <div className={styles.navItem} key={label}>
              <Icon size={15} aria-hidden="true" />
              <span>{label}</span>
            </div>
          ))}
        </div>

        <div className={styles.navGroup}>
          <p className={styles.groupLabel}>Administração</p>
          <div className={styles.navItem}>
            <UsersRound size={15} aria-hidden="true" />
            <strong>Cadastros</strong>
            <ChevronDown
              size={13}
              aria-hidden="true"
              className={styles.navChevron}
            />
          </div>
          <div className={styles.subNav}>
            {adminItems.map((label) => (
              <span key={label}>{label}</span>
            ))}
          </div>
          <div className={styles.navItem}>
            <Settings2 size={15} aria-hidden="true" />
            <span>Configurações</span>
          </div>
        </div>
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
