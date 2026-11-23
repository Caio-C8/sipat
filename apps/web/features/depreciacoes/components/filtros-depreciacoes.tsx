"use client";

import Link from "next/link";
import { useState } from "react";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TextField } from "@/components/shared/form-fields";
import { SeletorFiltroRelatorio } from "@/features/relatorios/components/seletor-filtro-relatorio";

export function FiltrosDepreciacoes({
  valores,
}: {
  valores: Record<string, string>;
}) {
  const [patrimonioId, setPatrimonioId] = useState(valores.patrimonioId ?? "");
  const [comissaoId, setComissaoId] = useState(valores.comissaoId ?? "");
  return (
    <form
      action="/depreciacoes"
      method="get"
      className="grid gap-4 rounded-lg border border-border bg-card p-4 sm:grid-cols-2 xl:grid-cols-3"
      aria-label="Filtros das depreciações"
    >
      <TextField
        id="competencia-depreciacoes"
        name="competencia"
        label="Competência (opcional)"
        type="month"
        defaultValue={valores.competencia}
      />
      <SeletorFiltroRelatorio
        nome="patrimonioId"
        label="Patrimônio"
        catalogo="patrimonios"
        tipo="depreciacoes"
        valor={patrimonioId}
        onChange={setPatrimonioId}
      />
      <SeletorFiltroRelatorio
        nome="comissaoId"
        label="Comissão"
        catalogo="comissoes"
        tipo="depreciacoes"
        valor={comissaoId}
        onChange={setComissaoId}
      />
      <div className="flex flex-wrap justify-end gap-3 sm:col-span-2 xl:col-span-3">
        <Button asChild type="button" variant="outline">
          <Link href="/depreciacoes">Limpar filtros</Link>
        </Button>
        <Button type="submit">
          <Search aria-hidden="true" /> Consultar
        </Button>
      </div>
    </form>
  );
}
