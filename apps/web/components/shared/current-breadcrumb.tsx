"use client";

import { ChevronRight, Package } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { encontrarTelaPorCaminho } from "@/lib/navigation/system-navigation";

export function CurrentBreadcrumb() {
  const pathname = usePathname();
  const breadcrumb = encontrarTelaPorCaminho(pathname)?.breadcrumb ?? [
    { label: "SIPAT" },
  ];

  return (
    <nav
      className="flex min-w-0 items-center gap-1 pt-2 text-[10px] text-[#62748e] min-[481px]:gap-2.5 min-[701px]:pt-0 min-[1500px]:text-xs"
      aria-label="Localização atual"
    >
      <Package className="shrink-0" size={15} aria-hidden="true" />
      <ol className="flex min-w-0 list-none items-center gap-1 p-0 min-[481px]:gap-2">
        {breadcrumb.map((item, index) => {
          const atual = index === breadcrumb.length - 1;

          return (
            <li
              className={`${atual ? "flex" : "hidden min-[481px]:flex"} min-w-0 items-center gap-1 min-[481px]:gap-2`}
              key={`${item.label}-${index}`}
              aria-current={atual ? "page" : undefined}
            >
              {index > 0 ? <ChevronRight size={13} aria-hidden="true" /> : null}
              {atual ? (
                <strong className="truncate text-[#19355d]">
                  {item.label}
                </strong>
              ) : item.href ? (
                <Link
                  className="rounded-sm text-[#526984] underline-offset-4 hover:text-[#19355d] hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2860eb]"
                  href={item.href}
                >
                  {item.label}
                </Link>
              ) : (
                <span>{item.label}</span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
