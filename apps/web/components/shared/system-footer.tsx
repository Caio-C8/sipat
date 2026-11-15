"use client";

import { usePathname } from "next/navigation";
import { encontrarTelaPorCaminho } from "@/lib/navigation/system-navigation";

export function SystemFooter() {
  const pathname = usePathname();
  const nomeTela = encontrarTelaPorCaminho(pathname)?.label ?? "Página atual";

  return (
    <footer className="mt-auto border-t border-[#dfe7f1] px-4 py-3 text-[11px] text-[#60728a] min-[701px]:px-5 min-[1500px]:px-[30px]">
      SIPAT · {nomeTela}
    </footer>
  );
}
