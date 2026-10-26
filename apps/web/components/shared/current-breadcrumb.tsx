"use client";

import { ChevronRight, Package } from "lucide-react";
import { usePathname } from "next/navigation";
import { encontrarNavegacaoPorCaminho } from "@/lib/navigation/system-navigation";
import styles from "./system-shell.module.css";

export function CurrentBreadcrumb() {
  const pathname = usePathname();
  const breadcrumb = encontrarNavegacaoPorCaminho(pathname)?.breadcrumb ?? [
    "SIPAT",
  ];

  return (
    <nav className={styles.breadcrumb} aria-label="Localização atual">
      <Package size={15} aria-hidden="true" />
      <ol>
        {breadcrumb.map((label, index) => {
          const atual = index === breadcrumb.length - 1;

          return (
            <li key={label} aria-current={atual ? "page" : undefined}>
              {index > 0 ? <ChevronRight size={13} aria-hidden="true" /> : null}
              {atual ? <strong>{label}</strong> : <span>{label}</span>}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
