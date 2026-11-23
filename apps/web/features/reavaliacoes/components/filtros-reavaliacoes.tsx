"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ComboboxField, TextField } from "@/components/shared/form-fields";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useComissoesReavaliacao } from "../api/hooks";

export function FiltrosReavaliacoes({
  valores,
}: {
  valores: Record<string, string>;
}) {
  const comissoes = useComissoesReavaliacao();
  const [comissaoId, setComissaoId] = useState(valores.comissaoId ?? "");
  const [buscaComissao, setBuscaComissao] = useState("");
  const carregar = comissoes.carregar;
  useEffect(() => {
    const temporizador = window.setTimeout(() => {
      void carregar({
        contexto: "FILTRO",
        pagina: "1",
        limite: "50",
        ...(buscaComissao.trim() ? { busca: buscaComissao.trim() } : {}),
      });
    }, 250);
    return () => window.clearTimeout(temporizador);
  }, [buscaComissao, carregar]);
  return (
    <form
      action="/reavaliacoes"
      className="grid gap-4"
      aria-label="Filtrar reavaliações"
    >
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <TextField
          id="filtro-reavaliacoes-busca"
          label="Pesquisar por número ou descrição"
          type="search"
          name="busca"
          maxLength={200}
          defaultValue={valores.busca}
        />
        <ComboboxField
          id="filtro-reavaliacoes-comissao"
          name="comissaoId"
          label="Comissão"
          value={comissaoId}
          onValueChange={setComissaoId}
          onSearchChange={setBuscaComissao}
          options={[
            { value: "", label: "Todas as comissões" },
            ...(comissaoId &&
            !comissoes.dados?.dados.some((item) => item.id === comissaoId)
              ? [{ value: comissaoId, label: "Comissão selecionada" }]
              : []),
            ...(comissoes.dados?.dados.map((item) => ({
              value: item.id,
              label: item.nome,
            })) ?? []),
          ]}
          loading={comissoes.loading}
          placeholder="Todas as comissões"
          searchPlaceholder="Buscar comissão…"
        />
        <TextField
          id="filtro-reavaliacoes-data-inicial"
          label="Data inicial"
          type="date"
          name="dataInicio"
          defaultValue={valores.dataInicio}
        />
        <TextField
          id="filtro-reavaliacoes-data-final"
          label="Data final"
          type="date"
          name="dataFim"
          defaultValue={valores.dataFim}
        />
      </div>
      <input
        type="hidden"
        name="patrimonioId"
        value={valores.patrimonioId ?? ""}
      />
      {comissoes.erro ? (
        <Alert variant="destructive">
          <AlertDescription>
            Não foi possível carregar as comissões. Tente novamente antes de
            filtrar por comissão.
          </AlertDescription>
        </Alert>
      ) : null}
      <div className="flex flex-wrap justify-end gap-2">
        <Button asChild variant="outline">
          <Link href="/reavaliacoes">Limpar filtros</Link>
        </Button>
        <Button type="submit" className="gap-2 px-5">
          <Search aria-hidden="true" className="size-4" /> Pesquisar
        </Button>
      </div>
    </form>
  );
}
