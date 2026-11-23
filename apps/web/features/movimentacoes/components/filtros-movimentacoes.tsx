"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ComboboxField, TextField } from "@/components/shared/form-fields";
import { ErroMovimentacao } from "./erro-movimentacao";
import { useComissoesMovimentacao, useSetoresMovimentacao } from "../api/hooks";

export function FiltrosMovimentacoes({
  valores,
}: {
  valores: Record<string, string>;
}) {
  const [setorOrigemId, setSetorOrigemId] = useState(
    valores.setorOrigemId ?? "",
  );
  const [setorDestinoId, setSetorDestinoId] = useState(
    valores.setorDestinoId ?? "",
  );
  const [comissaoId, setComissaoId] = useState(valores.comissaoId ?? "");
  const [buscaSetor, setBuscaSetor] = useState("");
  const [buscaComissao, setBuscaComissao] = useState("");
  const setores = useSetoresMovimentacao();
  const comissoes = useComissoesMovimentacao();
  const carregarSetores = setores.carregar;
  const carregarComissoes = comissoes.carregar;

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void carregarSetores({
        contexto: "FILTRO",
        pagina: "1",
        limite: "50",
        ...(buscaSetor.trim() ? { busca: buscaSetor.trim() } : {}),
      });
    }, 250);
    return () => window.clearTimeout(timer);
  }, [buscaSetor, carregarSetores]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void carregarComissoes({
        contexto: "FILTRO",
        pagina: "1",
        limite: "50",
        ...(buscaComissao.trim() ? { busca: buscaComissao.trim() } : {}),
      });
    }, 250);
    return () => window.clearTimeout(timer);
  }, [buscaComissao, carregarComissoes]);

  const opcoesSetores =
    setores.dados?.dados.map((setor) => ({
      value: setor.id,
      label: `${setor.nome}${setor.ativo ? "" : " (inativo)"}`,
    })) ?? [];
  const opcoesComissoes =
    comissoes.dados?.dados.map((comissao) => ({
      value: comissao.id,
      label: `${comissao.nome} (${comissao.dataVigenciaInicio} a ${comissao.dataVigenciaFim})`,
    })) ?? [];

  return (
    <form
      action="/movimentacoes"
      className="grid gap-4"
      aria-label="Filtrar movimentações"
    >
      <input
        type="hidden"
        name="patrimonioId"
        value={valores.patrimonioId ?? ""}
      />
      <div className="grid min-w-0 gap-4 md:grid-cols-2 xl:grid-cols-3">
        <TextField
          id="filtro-movimentacoes-busca"
          label="Número patrimonial ou descrição"
          type="search"
          name="busca"
          maxLength={200}
          defaultValue={valores.busca}
          placeholder="Busque pelo número ou descrição"
        />
        <ComboboxField
          id="filtro-movimentacoes-setor-origem"
          name="setorOrigemId"
          label="Setor de origem"
          value={setorOrigemId}
          onValueChange={setSetorOrigemId}
          onSearchChange={setBuscaSetor}
          options={[
            { value: "", label: "Todos os setores" },
            ...(setorOrigemId &&
            !opcoesSetores.some((item) => item.value === setorOrigemId)
              ? [{ value: setorOrigemId, label: "Setor selecionado" }]
              : []),
            ...opcoesSetores,
          ]}
          loading={setores.loading}
          placeholder="Todos os setores"
          searchPlaceholder="Buscar setor…"
          emptyText="Nenhum setor encontrado."
        />
        <ComboboxField
          id="filtro-movimentacoes-setor-destino"
          name="setorDestinoId"
          label="Setor de destino"
          value={setorDestinoId}
          onValueChange={setSetorDestinoId}
          onSearchChange={setBuscaSetor}
          options={[
            { value: "", label: "Todos os setores" },
            ...(setorDestinoId &&
            !opcoesSetores.some((item) => item.value === setorDestinoId)
              ? [{ value: setorDestinoId, label: "Setor selecionado" }]
              : []),
            ...opcoesSetores,
          ]}
          loading={setores.loading}
          placeholder="Todos os setores"
          searchPlaceholder="Buscar setor…"
          emptyText="Nenhum setor encontrado."
        />
        <TextField
          id="filtro-movimentacoes-data-inicio"
          label="Data inicial"
          type="date"
          name="dataInicio"
          defaultValue={valores.dataInicio}
        />
        <TextField
          id="filtro-movimentacoes-data-fim"
          label="Data final"
          type="date"
          name="dataFim"
          defaultValue={valores.dataFim}
        />
        <ComboboxField
          id="filtro-movimentacoes-comissao"
          name="comissaoId"
          label="Comissão"
          value={comissaoId}
          onValueChange={setComissaoId}
          onSearchChange={setBuscaComissao}
          options={[
            { value: "", label: "Todas as comissões" },
            ...(comissaoId &&
            !opcoesComissoes.some((item) => item.value === comissaoId)
              ? [{ value: comissaoId, label: "Comissão selecionada" }]
              : []),
            ...opcoesComissoes,
          ]}
          loading={comissoes.loading}
          placeholder="Todas as comissões"
          searchPlaceholder="Buscar comissão…"
          emptyText="Nenhuma comissão encontrada."
        />
      </div>
      {setores.erro ? <ErroMovimentacao erro={setores.erro} /> : null}
      {comissoes.erro ? <ErroMovimentacao erro={comissoes.erro} /> : null}
      <div className="flex flex-wrap justify-end gap-2">
        <Button asChild variant="outline">
          <Link prefetch={false} href="/movimentacoes">
            Limpar filtros
          </Link>
        </Button>
        <Button type="submit">
          <Search aria-hidden="true" /> Pesquisar
        </Button>
      </div>
    </form>
  );
}
