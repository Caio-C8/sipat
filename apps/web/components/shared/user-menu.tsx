"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import type { IdentidadeAutenticada } from "@repo/contracts";
import { LogoutButton } from "@/components/auth/logout-button";
import { nomesPerfis } from "@/lib/navigation/system-navigation";

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
    <div className="relative" ref={containerRef}>
      <button
        ref={triggerRef}
        type="button"
        className="group flex cursor-pointer items-center gap-2 border-0 border-l border-[#dfe7f1] bg-transparent py-0.5 pr-1 pl-1.5 text-left text-[#627a9a] hover:text-[#285080] focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[#8dbbf0] min-[701px]:pl-3"
        aria-controls="user-menu"
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={() => setOpen((value) => !value)}
      >
        <span className="grid size-[30px] shrink-0 place-items-center rounded-full bg-[#e9f0fa] text-[9px] font-extrabold text-[#285080] transition-[background-color,color,box-shadow] duration-150 group-hover:bg-[#dce8f6] group-hover:text-[#17385f] group-hover:ring-2 group-hover:ring-[#c7d8eb] motion-reduce:transition-none min-[1500px]:size-9 min-[1500px]:text-[11px]">
          {iniciais}
        </span>
        <span className="hidden min-w-[87px] max-w-[180px] gap-0.5 min-[701px]:grid">
          <strong className="truncate text-[10px] text-[#162744] transition-colors duration-150 group-hover:text-[#285080] motion-reduce:transition-none min-[1500px]:text-xs">
            {identidade.nome}
          </strong>
          <small className="truncate text-[9px] text-[#62748e] min-[1500px]:text-xs">
            {perfil}
          </small>
        </span>
        <ChevronDown
          className="hidden transition-transform duration-200 group-hover:text-[#285080] group-aria-expanded:rotate-180 motion-reduce:transition-none min-[701px]:block"
          size={14}
          aria-hidden="true"
        />
        <span className="sr-only">Menu do usuário</span>
      </button>
      {open ? (
        <div
          id="user-menu"
          className="absolute top-[calc(100%+8px)] right-0 w-[min(270px,calc(100vw-32px))] rounded-lg border border-[#dfe7f1] bg-white p-3.5 text-[#17253d] shadow-[0_14px_36px_rgb(16_40_71/16%)]"
          role="menu"
        >
          <div className="grid gap-1 border-b border-[#dfe7f1] pb-3">
            <strong className="wrap-anywhere text-xs">{identidade.nome}</strong>
            <span className="text-[10px] text-[#62748e]">{perfil}</span>
          </div>
          <LogoutButton
            className="flex min-h-[34px] w-full cursor-pointer items-center gap-2 rounded-md border-0 bg-transparent px-2 py-[7px] text-[11px] font-bold text-[#9b2c2c] hover:bg-[#fff4f4] disabled:cursor-wait disabled:opacity-65 focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[#8dbbf0]"
            wrapperClassName="grid gap-2 pt-2"
            errorClassName="text-[10px] leading-5 text-[#9b2c2c]"
            menuItem
          />
        </div>
      ) : null}
    </div>
  );
}
