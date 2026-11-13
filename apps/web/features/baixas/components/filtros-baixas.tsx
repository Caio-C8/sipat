"use client";

import { useState } from "react";
import Link from "next/link";
import { Filter, Search } from "lucide-react";
import { TIPOS_BAIXA_PATRIMONIO } from "@repo/contracts";
import { Button } from "@/components/ui/button";
import { SeletorRelatorio } from "@/features/relatorios/components/seletor";
import { rotulosTipoBaixa } from "../apresentacao";

const campo =
  "mt-1 min-h-10 w-full rounded-md border border-[#dce5f0] bg-white px-3 py-2 text-sm";

export function FiltrosBaixas({
  valores,
}: {
  valores: Record<string, string>;
}) {
  const [patrimonioId, setPatrimonioId] = useState(valores.patrimonioId ?? "");
  const [comissaoId, setComissaoId] = useState(valores.comissaoId ?? "");
  return (
    <form
      action="/baixas"
      className="rounded-lg border border-[#dfe7f1] bg-white p-4 sm:p-5"
    >
      <div className="mb-4 flex items-center gap-2">
        <Filter aria-hidden="true" className="size-5 text-[#2863ec]" />
        <h2 className="font-bold">Filtros de consulta</h2>
      </div>
      <div className="grid gap-4 lg:grid-cols-4">
        <label className="text-sm font-medium">
          Data inicial
          <input
            className={campo}
            type="date"
            name="inicio"
            defaultValue={valores.inicio}
          />
        </label>
        <label className="text-sm font-medium">
          Data final
          <input
            className={campo}
            type="date"
            name="fim"
            defaultValue={valores.fim}
          />
        </label>
        <label className="text-sm font-medium">
          Tipo
          <select
            className={campo}
            name="tipo"
            defaultValue={valores.tipo ?? ""}
          >
            <option value="">Todos</option>
            {TIPOS_BAIXA_PATRIMONIO.map((tipo) => (
              <option key={tipo} value={tipo}>
                {rotulosTipoBaixa[tipo]}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm font-medium">
          Registros por página
          <select
            className={campo}
            name="limite"
            defaultValue={valores.limite ?? "20"}
          >
            <option value="10">10</option>
            <option value="20">20</option>
            <option value="50">50</option>
          </select>
        </label>
        <div className="lg:col-span-2">
          <SeletorRelatorio
            nome="patrimonioId"
            label="patrimônio"
            catalogo="patrimonios"
            tipo="baixas"
            valor={patrimonioId}
            onChange={setPatrimonioId}
          />
        </div>
        <div className="lg:col-span-2">
          <SeletorRelatorio
            nome="comissaoId"
            label="comissão"
            catalogo="comissoes"
            tipo="baixas"
            valor={comissaoId}
            onChange={setComissaoId}
          />
        </div>
      </div>
      <div className="mt-4 flex flex-wrap justify-end gap-3">
        <Button asChild variant="outline">
          <Link href="/baixas">Limpar filtros</Link>
        </Button>
        <Button type="submit">
          <Search aria-hidden="true" /> Consultar
        </Button>
      </div>
    </form>
  );
}
