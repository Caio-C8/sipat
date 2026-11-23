"use client";

import Link from "next/link";
import { useState } from "react";
import { Search } from "lucide-react";
import { SelectField, TextField } from "@/components/shared/form-fields";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { painelEmprestimo } from "../apresentacao";

function FiltrosEmprestimos({ filtros }: { filtros: Record<string, string> }) {
  const [situacao, setSituacao] = useState(filtros.situacao || "TODOS");
  const [somenteAtrasados, setSomenteAtrasados] = useState(
    filtros.somenteAtrasados === "true",
  );

  return (
    <form
      action="/emprestimos"
      method="get"
      className={painelEmprestimo}
      aria-label="Filtros de empréstimos"
    >
      <input
        type="hidden"
        name="situacao"
        value={situacao === "TODOS" ? "" : situacao}
      />
      {situacao !== "CONCLUIDO" ? (
        <input
          type="hidden"
          name="somenteAtrasados"
          value={somenteAtrasados ? "true" : ""}
        />
      ) : null}
      <div className="grid min-w-0 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <TextField
          id="filtro-emprestimos-busca"
          name="busca"
          label="Destinatário, patrimônio ou empréstimo"
          defaultValue={filtros.busca ?? ""}
          placeholder="Buscar empréstimo"
        />
        <SelectField
          id="filtro-emprestimos-situacao"
          label="Situação"
          value={situacao}
          onValueChange={setSituacao}
          options={[
            { value: "TODOS", label: "Todos" },
            { value: "EM_ANDAMENTO", label: "Em andamento" },
            { value: "CONCLUIDO", label: "Finalizados" },
          ]}
        />
        <TextField
          id="filtro-emprestimos-data-inicio"
          type="date"
          name="dataInicio"
          label="Saída desde"
          defaultValue={filtros.dataInicio ?? ""}
        />
        <TextField
          id="filtro-emprestimos-data-fim"
          type="date"
          name="dataFim"
          label="Saída até"
          defaultValue={filtros.dataFim ?? ""}
        />
      </div>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-4 text-sm">
        {situacao !== "CONCLUIDO" ? (
          <div className="flex items-center gap-2">
            <Checkbox
              id="filtro-emprestimos-atrasados"
              checked={somenteAtrasados}
              onCheckedChange={(checked) =>
                setSomenteAtrasados(checked === true)
              }
            />
            <Label htmlFor="filtro-emprestimos-atrasados">
              Somente atrasados
            </Label>
          </div>
        ) : null}
        <div className="ml-auto flex flex-wrap gap-2">
          <Button asChild type="button" variant="outline">
            <Link href="/emprestimos">Limpar filtros</Link>
          </Button>
          <Button type="submit">
            <Search aria-hidden="true" /> Consultar
          </Button>
        </div>
      </div>
    </form>
  );
}

export { FiltrosEmprestimos };
