"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  ComboboxField,
  SelectField,
  TextField,
} from "@/components/shared/form-fields";
import { Button } from "@/components/ui/button";
import { criarOperacoesReavaliacoes } from "@/features/reavaliacoes/api/reavaliacao-operations";
import { browserApiClient } from "@/lib/api/browser-api-client";

const operacoes = criarOperacoesReavaliacoes(browserApiClient);

export function InventarioFilters({
  buscaInicial = "",
  statusInicial = "",
  comissaoInicial = "",
}: {
  buscaInicial?: string;
  statusInicial?: string;
  comissaoInicial?: string;
}) {
  const router = useRouter();
  const [busca, setBusca] = React.useState(buscaInicial);
  const [status, setStatus] = React.useState(statusInicial);
  const [comissaoId, setComissaoId] = React.useState(comissaoInicial);
  const [carregando, setCarregando] = React.useState(true);
  const [comissoes, setComissoes] = React.useState<
    { value: string; label: string }[]
  >([]);

  React.useEffect(() => {
    const controller = new AbortController();
    operacoes
      .comissoes(
        { contexto: "FILTRO", pagina: "1", limite: "50" },
        { signal: controller.signal },
      )
      .then((resposta) =>
        setComissoes(
          resposta.dados.map((item) => ({ value: item.id, label: item.nome })),
        ),
      )
      .catch(() => {
        if (!controller.signal.aborted) setComissoes([]);
      })
      .finally(() => !controller.signal.aborted && setCarregando(false));
    return () => controller.abort();
  }, []);

  function navegar(event: React.FormEvent) {
    event.preventDefault();
    const query = new URLSearchParams();
    if (busca.trim()) query.set("busca", busca.trim());
    if (status) query.set("status", status);
    if (comissaoId) query.set("comissaoId", comissaoId);
    router.push(`/inventarios${query.size ? `?${query}` : ""}`);
  }

  return (
    <form
      onSubmit={navegar}
      className="grid gap-4 lg:grid-cols-[minmax(14rem,1fr)_13rem_minmax(15rem,1fr)_auto] lg:items-end"
    >
      <TextField
        id="filtro-inventario-busca"
        label="Buscar inventário"
        value={busca}
        onChange={(evento) => setBusca(evento.target.value)}
        placeholder="Nome ou descrição"
        maxLength={200}
      />
      <SelectField
        id="filtro-inventario-status"
        label="Situação"
        value={status || "TODOS"}
        onValueChange={(valor) => setStatus(valor === "TODOS" ? "" : valor)}
        options={[
          { value: "TODOS", label: "Todas" },
          { value: "PENDENTE", label: "Pendente" },
          { value: "EM_ANDAMENTO", label: "Em andamento" },
          { value: "FINALIZADO", label: "Finalizado" },
        ]}
      />
      <ComboboxField
        id="filtro-inventario-comissao"
        label="Comissão"
        value={comissaoId}
        onValueChange={setComissaoId}
        options={comissoes}
        loading={carregando}
        placeholder="Todas as comissões"
        searchPlaceholder="Buscar comissão…"
        emptyText="Nenhuma comissão encontrada."
      />
      <div className="flex gap-2">
        <Button type="submit" variant="outline" className="h-10">
          Consultar
        </Button>
        {busca || status || comissaoId ? (
          <Button
            type="button"
            variant="ghost"
            className="h-10"
            onClick={() => router.push("/inventarios")}
          >
            Limpar
          </Button>
        ) : null}
      </div>
    </form>
  );
}
