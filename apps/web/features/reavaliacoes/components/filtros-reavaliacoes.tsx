"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useComissoesReavaliacao } from "../api/hooks";
import { campoReavaliacao } from "../presentation";

export function FiltrosReavaliacoes({
  valores,
}: {
  valores: Record<string, string>;
}) {
  const comissoes = useComissoesReavaliacao();
  const [comissaoId, setComissaoId] = useState(valores.comissaoId ?? "");
  const carregar = comissoes.carregar;
  useEffect(() => {
    void carregar({ contexto: "FILTRO" });
  }, [carregar]);
  return (
    <form
      action="/reavaliacoes"
      className="grid gap-4"
      aria-label="Filtrar reavaliações"
    >
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <label className="grid gap-2 text-sm">
          Pesquisar por número ou descrição
          <input
            className={campoReavaliacao}
            type="search"
            name="busca"
            maxLength={200}
            defaultValue={valores.busca}
          />
        </label>
        <label className="grid gap-2 text-sm">
          Comissão
          <select
            className={campoReavaliacao}
            name="comissaoId"
            value={comissaoId}
            onChange={(e) => setComissaoId(e.target.value)}
          >
            <option value="">Todas</option>
            {comissaoId &&
            !comissoes.dados?.dados.some((item) => item.id === comissaoId) ? (
              <option value={comissaoId}>Comissão selecionada</option>
            ) : null}
            {comissoes.dados?.dados.map((item) => (
              <option key={item.id} value={item.id}>
                {item.nome}
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-2 text-sm">
          Data inicial
          <input
            className={campoReavaliacao}
            type="date"
            name="dataInicio"
            defaultValue={valores.dataInicio}
          />
        </label>
        <label className="grid gap-2 text-sm">
          Data final
          <input
            className={campoReavaliacao}
            type="date"
            name="dataFim"
            defaultValue={valores.dataFim}
          />
        </label>
      </div>
      <input
        type="hidden"
        name="patrimonioId"
        value={valores.patrimonioId ?? ""}
      />
      {comissoes.erro ? (
        <p role="alert" className="text-sm text-red-700">
          Não foi possível carregar as comissões.
        </p>
      ) : null}
      <div className="flex gap-3">
        <Button type="submit">Filtrar</Button>
        <Button asChild variant="outline">
          <Link href="/reavaliacoes">Limpar</Link>
        </Button>
      </div>
    </form>
  );
}
