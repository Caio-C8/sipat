"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { SelectField, TextField } from "@/components/shared/form-fields";
import { rotulosEvento } from "../apresentacao";

export function PatrimonioHistoricoFiltros({
  patrimonioId,
  valores,
}: {
  patrimonioId: string;
  valores: Record<string, string>;
}) {
  const router = useRouter();
  const [evento, setEvento] = useState(valores.evento ?? "");
  const [busca, setBusca] = useState(valores.busca ?? "");
  const [dataInicial, setDataInicial] = useState(valores.dataInicial ?? "");
  const [dataFinal, setDataFinal] = useState(valores.dataFinal ?? "");

  function navegar(limpar = false) {
    const parametros = new URLSearchParams({ aba: "historico" });
    if (!limpar) {
      if (evento) parametros.set("evento", evento);
      if (busca.trim()) parametros.set("busca", busca.trim());
      if (dataInicial) parametros.set("dataInicial", dataInicial);
      if (dataFinal) parametros.set("dataFinal", dataFinal);
    }
    router.push(`/patrimonios/${patrimonioId}?${parametros.toString()}`);
  }

  return (
    <Card asChild className="mt-4 gap-0 bg-background shadow-none">
      <form
        onSubmit={(eventoSubmit) => {
          eventoSubmit.preventDefault();
          navegar();
        }}
      >
        <CardContent className="grid gap-4">
          <div className="grid items-end gap-4 md:grid-cols-2 xl:grid-cols-[220px_minmax(260px,1fr)_170px_170px]">
            <SelectField
              id="historico-evento"
              label="Tipo de evento"
              value={evento || undefined}
              onValueChange={(valor) =>
                setEvento(valor === "TODOS" ? "" : valor)
              }
              options={[
                { value: "TODOS", label: "Todos os eventos" },
                ...Object.entries(rotulosEvento).map(([value, label]) => ({
                  value,
                  label,
                })),
              ]}
            />
            <TextField
              id="historico-busca"
              label="Pesquisar no histórico"
              value={busca}
              maxLength={200}
              placeholder="Descrição, autor, comissão ou valor"
              onChange={(eventoBusca) => setBusca(eventoBusca.target.value)}
            />
            <TextField
              id="historico-data-inicial"
              label="Data inicial"
              type="date"
              value={dataInicial}
              onChange={(eventoData) => setDataInicial(eventoData.target.value)}
            />
            <TextField
              id="historico-data-final"
              label="Data final"
              type="date"
              value={dataFinal}
              onChange={(eventoData) => setDataFinal(eventoData.target.value)}
            />
          </div>
          <div className="mt-4 flex flex-wrap justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setEvento("");
                setBusca("");
                setDataInicial("");
                setDataFinal("");
                navegar(true);
              }}
            >
              <X aria-hidden="true" /> Limpar filtros
            </Button>
            <Button type="submit">
              <Search aria-hidden="true" /> Filtrar histórico
            </Button>
          </div>
        </CardContent>
      </form>
    </Card>
  );
}
