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
    <aside className="relative flex min-w-0 flex-col bg-[#102847] px-4 py-2.5 text-[#c4d2e5] min-[1101px]:sticky min-[1101px]:top-0 min-[1101px]:h-svh min-[1101px]:px-2.5 min-[1101px]:pt-3.5 min-[1101px]:pb-5 min-[1500px]:px-3.5 min-[1500px]:pt-5 min-[1500px]:pb-[26px]">
      <div className="flex shrink-0 items-center justify-between gap-4 min-[1101px]:block">
        <div className="min-[1101px]:border-b min-[1101px]:border-[#2d4361] min-[1101px]:px-1 min-[1101px]:pb-3">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 text-[17px] font-bold text-white no-underline focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[#8dbbf0] min-[1500px]:text-[21px]"
          >
            <span className="grid size-[26px] place-items-center rounded-lg bg-[#214166] text-[#e7b800] min-[1500px]:size-[34px]">
              <Package size={17} aria-hidden="true" />
            </span>
            <span>SIPAT</span>
          </Link>
          <p className="mt-2 hidden text-[10px] text-[#96acc8] min-[1101px]:block min-[1500px]:text-xs">
            Gestão patrimonial
          </p>
        </div>
        <button
          ref={triggerRef}
          type="button"
          className="inline-flex min-h-[34px] cursor-pointer items-center justify-center gap-2 rounded-md border border-[#49617f] bg-transparent px-2.5 py-1 text-xs font-bold text-white focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[#8dbbf0] min-[1101px]:hidden"
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
        className={`${menuOpen ? "grid" : "hidden"} max-h-[70svh] flex-1 grid-cols-1 gap-4 overflow-y-auto pt-3 [scrollbar-width:thin] min-[481px]:grid-cols-2 min-[1101px]:block min-[1101px]:max-h-none min-[1101px]:pt-0`}
        aria-label="Navegação principal"
      >
        {grupos.map((grupo) => {
          const itensDoGrupo = itens.filter((item) => item.grupo === grupo.id);

          if (itensDoGrupo.length === 0) {
            return null;
          }

          return (
            <section
              className="min-[1101px]:border-b min-[1101px]:border-[#2b4260] min-[1101px]:py-2.5 min-[1101px]:last:border-b-0 min-[1500px]:py-3.5"
              key={grupo.id}
            >
              <h2 className="mb-1 px-2 text-[10px] font-bold text-[#96aaca] uppercase min-[1101px]:text-[9px] min-[1500px]:text-[11px]">
                {grupo.label}
              </h2>
              <ul className="grid list-none gap-0.5 p-0">
                {itensDoGrupo.map((item) => {
                  const Icon = item.icon;
                  const ativo =
                    item.href === pathname ||
                    (item.href === "/movimentacoes" &&
                      pathname.startsWith("/movimentacoes/"));

                  return (
                    <li key={item.id}>
                      {item.href ? (
                        <Link
                          href={item.href}
                          aria-current={ativo ? "page" : undefined}
                          className={`flex min-h-[34px] items-center gap-2 rounded-sm px-2 py-1 text-xs leading-tight no-underline focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[#8dbbf0] min-[1101px]:min-h-[27px] min-[1101px]:text-[10px] min-[1500px]:min-h-8 min-[1500px]:px-2.5 min-[1500px]:py-1.5 min-[1500px]:text-xs ${ativo ? "bg-[#2860eb] text-white" : "text-[#c8d7e8]"}`}
                        >
                          <Icon
                            className="shrink-0"
                            size={15}
                            aria-hidden="true"
                          />
                          <span className="min-w-0">
                            <span className="block">{item.label}</span>
                            {!item.implementado ? (
                              <span className="block text-[9px] font-semibold">
                                Em desenvolvimento
                              </span>
                            ) : null}
                          </span>
                        </Link>
                      ) : (
                        <span
                          className="flex min-h-[34px] cursor-not-allowed items-center gap-2 rounded-sm px-2 py-1 text-xs leading-tight text-[#9eb1c9] min-[1101px]:min-h-[27px] min-[1101px]:text-[10px] min-[1500px]:min-h-8 min-[1500px]:px-2.5 min-[1500px]:py-1.5 min-[1500px]:text-xs"
                          aria-disabled="true"
                        >
                          <Icon
                            className="shrink-0"
                            size={15}
                            aria-hidden="true"
                          />
                          <span>{item.label}</span>
                          <span className="sr-only">Não implementado</span>
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

      <div className="hidden items-center gap-2 border-t border-[#2d4361] px-1 pt-3 min-[1101px]:flex">
        <span className="grid size-11 shrink-0 place-items-center rounded-md bg-white">
          <Image
            className="size-9 object-contain"
            src="/images/brasao.png"
            alt=""
            width={89}
            height={90}
            unoptimized
          />
        </span>
        <span>
          <strong className="block text-xs leading-normal text-white">
            Câmara Municipal
          </strong>
          <small className="block text-[11px] leading-normal">
            Patos de Minas
          </small>
        </span>
      </div>
    </aside>
  );
}
