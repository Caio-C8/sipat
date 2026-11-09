"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Bell } from "lucide-react";
import type { PerfilUsuario } from "@repo/contracts";
import { rotuloCompetencia } from "@/features/depreciacoes/apresentacao";
import { useResumoPendenciasDepreciacao } from "@/features/depreciacoes/api/hooks";

export function NotificationsMenu({ perfil }: { perfil: PerfilUsuario }) {
  const [open, setOpen] = useState(false);
  const resumo = useResumoPendenciasDepreciacao();
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
    <div className="relative" ref={containerRef}>
      <button
        ref={triggerRef}
        type="button"
        className="grid size-8 cursor-pointer place-items-center rounded-md border-0 bg-transparent text-[#627a9a] hover:bg-[#f3f7fb] focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[#8dbbf0]"
        aria-label="Notificações"
        aria-controls="notifications-panel"
        aria-expanded={open}
        aria-haspopup="dialog"
        onClick={() =>
          setOpen((value) => {
            const proximo = !value;
            if (proximo && perfil === "DIRETOR_PATRIMONIO") {
              void resumo.carregar();
            }
            return proximo;
          })
        }
      >
        <Bell size={18} aria-hidden="true" />
      </button>
      {open ? (
        <section
          id="notifications-panel"
          className="absolute top-[calc(100%+8px)] right-0 w-[min(320px,calc(100vw-32px))] rounded-lg border border-[#dfe7f1] bg-white p-3.5 text-[#17253d] shadow-[0_14px_36px_rgb(16_40_71/16%)]"
          aria-label="Notificações"
        >
          <h2 className="mb-3.5 text-sm font-semibold">Notificações</h2>
          <section
            className="border-t border-[#dfe7f1] py-2.5"
            aria-labelledby="pending-notifications-title"
          >
            <h3 className="text-[11px]" id="pending-notifications-title">
              Pendências recentes
            </h3>
            {perfil !== "DIRETOR_PATRIMONIO" ? (
              <p className="mt-1 text-[11px] text-[#62748e]">
                Nenhum alerta disponível para este perfil.
              </p>
            ) : resumo.loading ? (
              <p role="status" className="mt-1 text-[11px] text-[#62748e]">
                Consultando pendências…
              </p>
            ) : resumo.erro ? (
              <p role="alert" className="mt-1 text-[11px] text-red-800">
                Não foi possível consultar as pendências. O restante da
                navegação continua disponível.
              </p>
            ) : resumo.dados?.totalPendencias ? (
              <div className="mt-2 grid gap-2 text-[11px] text-[#314d73]">
                <p>
                  {resumo.dados.totalPendencias} pendência(s) em{" "}
                  {resumo.dados.totalPatrimonios} patrimônio(s).
                  {resumo.dados.competenciaMaisAntiga
                    ? ` Mais antiga: ${rotuloCompetencia(resumo.dados.competenciaMaisAntiga)}.`
                    : ""}
                </p>
                <Link
                  className="font-semibold text-[#245bca] underline"
                  href={
                    resumo.dados.competenciaMaisAntiga
                      ? `/depreciacao?competencia=${resumo.dados.competenciaMaisAntiga}`
                      : "/depreciacao"
                  }
                  onClick={() => setOpen(false)}
                >
                  Consultar depreciações
                </Link>
              </div>
            ) : (
              <p role="status" className="mt-1 text-[11px] text-[#62748e]">
                Não há pendências de depreciação.
              </p>
            )}
          </section>
          <section
            className="border-t border-[#dfe7f1] py-2.5"
            aria-labelledby="operations-notifications-title"
          >
            <h3 className="text-[11px]" id="operations-notifications-title">
              Últimas operações
            </h3>
            <p className="mt-1 text-[11px] text-[#62748e]">Não implementado</p>
          </section>
        </section>
      ) : null}
    </div>
  );
}
