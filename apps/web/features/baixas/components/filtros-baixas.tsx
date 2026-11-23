"use client";

import { useState } from "react";
import Link from "next/link";
import { Filter, Search } from "lucide-react";
import { TIPOS_BAIXA_PATRIMONIO } from "@repo/contracts";
import { Button } from "@/components/ui/button";
import { SelectField, TextField } from "@/components/shared/form-fields";
import { SeletorFiltroRelatorio } from "@/features/relatorios/components/seletor-filtro-relatorio";
import { rotulosTipoBaixa } from "../apresentacao";

export function FiltrosBaixas({
  valores,
}: {
  valores: Record<string, string>;
}) {
  const [patrimonioId, setPatrimonioId] = useState(valores.patrimonioId ?? "");
  const [comissaoId, setComissaoId] = useState(valores.comissaoId ?? "");
  const [tipo, setTipo] = useState(valores.tipo || "__todos__");
  const [limite, setLimite] = useState(valores.limite || "20");
  return (
    <form
      action="/baixas"
      className="rounded-lg border border-border bg-card p-4 sm:p-5"
    >
      <div className="mb-4 flex items-center gap-2">
        <Filter aria-hidden="true" className="size-5 text-interactive" />
        <h2 className="font-bold">Filtros de consulta</h2>
      </div>
      <div className="grid gap-4 lg:grid-cols-4">
        <TextField
          id="filtro-baixas-inicio"
          label="Data inicial"
          type="date"
          name="inicio"
          defaultValue={valores.inicio}
        />
        <TextField
          id="filtro-baixas-fim"
          label="Data final"
          type="date"
          name="fim"
          defaultValue={valores.fim}
        />
        <SelectField
          id="filtro-baixas-tipo"
          label="Tipo"
          value={tipo}
          onValueChange={setTipo}
          options={[
            { value: "__todos__", label: "Todos" },
            ...TIPOS_BAIXA_PATRIMONIO.map((item) => ({
              value: item,
              label: rotulosTipoBaixa[item] ?? item,
            })),
          ]}
        />
        <input
          type="hidden"
          name="tipo"
          value={tipo === "__todos__" ? "" : tipo}
        />
        <SelectField
          id="filtro-baixas-limite"
          name="limite"
          label="Registros por página"
          value={limite}
          onValueChange={setLimite}
          options={[
            { value: "10", label: "10" },
            { value: "20", label: "20" },
            { value: "50", label: "50" },
          ]}
        />
        <div className="lg:col-span-2">
          <SeletorFiltroRelatorio
            nome="patrimonioId"
            label="Patrimônio"
            catalogo="patrimonios"
            tipo="baixas"
            valor={patrimonioId}
            onChange={setPatrimonioId}
          />
        </div>
        <div className="lg:col-span-2">
          <SeletorFiltroRelatorio
            nome="comissaoId"
            label="Comissão"
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
