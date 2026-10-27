"use client";

import { ChevronRight, Package } from "lucide-react";
import { usePathname } from "next/navigation";
import { encontrarNavegacaoPorCaminho } from "@/lib/navigation/system-navigation";

export function CurrentBreadcrumb() {
  const pathname = usePathname();
  const breadcrumb = encontrarNavegacaoPorCaminho(pathname)?.breadcrumb ?? [
    "SIPAT",
  ];

  return (
    <nav
      className="flex min-w-0 items-center gap-1 pt-2 text-[10px] text-[#62748e] min-[481px]:gap-2.5 min-[701px]:pt-0 min-[1500px]:text-xs"
      aria-label="Localização atual"
    >
      <Package className="shrink-0" size={15} aria-hidden="true" />
      <ol className="flex min-w-0 list-none items-center gap-1 p-0 min-[481px]:gap-2">
        {breadcrumb.map((label, index) => {
          const atual = index === breadcrumb.length - 1;

          return (
            <li
              className={`${atual ? "flex" : "hidden min-[481px]:flex"} min-w-0 items-center gap-1 min-[481px]:gap-2`}
              key={label}
              aria-current={atual ? "page" : undefined}
            >
              {index > 0 ? <ChevronRight size={13} aria-hidden="true" /> : null}
              {atual ? (
                <strong className="truncate text-[#19355d]">{label}</strong>
              ) : (
                <span>{label}</span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
