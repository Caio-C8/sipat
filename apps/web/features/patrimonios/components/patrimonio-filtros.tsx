"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  ComboboxField,
  SelectField,
  TextField,
} from "@/components/shared/form-fields";
import { browserApiClient } from "@/lib/api/browser-api-client";
import { criarOperacoesCadastros } from "@/features/cadastros/api/cadastro-operations";

export type OpcaoFiltroPatrimonio = { value: string; label: string };

const cadastros = criarOperacoesCadastros(browserApiClient);

function unirOpcoes(
  atuais: readonly OpcaoFiltroPatrimonio[],
  novas: readonly OpcaoFiltroPatrimonio[],
  selecionada?: string,
) {
  const selecionadaAtual = atuais.find((item) => item.value === selecionada);
  const opcaoVazia = atuais.find((item) => item.value === "");
  return Array.from(
    new Map(
      [
        ...(opcaoVazia ? [opcaoVazia] : []),
        ...(selecionadaAtual ? [selecionadaAtual] : []),
        ...novas,
      ].map((item) => [item.value, item]),
    ).values(),
  );
}

function useOpcoesRemotas(
  iniciais: readonly OpcaoFiltroPatrimonio[],
  selecionada: string,
  consulta: (
    busca: string,
    signal: AbortSignal,
  ) => Promise<readonly OpcaoFiltroPatrimonio[]>,
) {
  const [opcoes, setOpcoes] = useState(iniciais);
  const [busca, setBusca] = useState("");
  const [loading, setLoading] = useState(false);
  const primeiraRenderizacao = useRef(true);

  useEffect(() => {
    if (primeiraRenderizacao.current) {
      primeiraRenderizacao.current = false;
      return;
    }
    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      setLoading(true);
      void consulta(busca, controller.signal)
        .then((novas) =>
          setOpcoes((atuais) => unirOpcoes(atuais, novas, selecionada)),
        )
        .catch(() => undefined)
        .finally(() => {
          if (!controller.signal.aborted) setLoading(false);
        });
    }, 250);
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [busca, consulta, selecionada]);

  return { opcoes, loading, setBusca };
}

const consultarSetores = async (busca: string, signal: AbortSignal) =>
  (
    await cadastros.setores.listar(
      { pagina: "1", limite: "50", ...(busca.trim() ? { busca } : {}) },
      { signal },
    )
  ).dados.map((item) => ({ value: item.id, label: item.nome }));

const consultarEspecies = async (busca: string, signal: AbortSignal) =>
  (
    await cadastros.especies.listar(
      { pagina: "1", limite: "50", ...(busca.trim() ? { busca } : {}) },
      { signal },
    )
  ).dados.map((item) => ({ value: item.id, label: item.nome }));

const consultarNaturezas = async (busca: string, signal: AbortSignal) =>
  (
    await cadastros.naturezas.listar(
      { pagina: "1", limite: "50", ...(busca.trim() ? { busca } : {}) },
      { signal },
    )
  ).dados.map((item) => ({ value: item.id, label: item.nome }));

export function PatrimonioFiltros({
  valores,
  setoresIniciais,
  especiesIniciais,
  naturezasIniciais,
}: {
  valores: Record<string, string>;
  setoresIniciais: readonly OpcaoFiltroPatrimonio[];
  especiesIniciais: readonly OpcaoFiltroPatrimonio[];
  naturezasIniciais: readonly OpcaoFiltroPatrimonio[];
}) {
  const [setorId, setSetorId] = useState(valores.setorId ?? "");
  const [especieId, setEspecieId] = useState(valores.especieId ?? "");
  const [naturezaId, setNaturezaId] = useState(valores.naturezaId ?? "");
  const [status, setStatus] = useState(valores.status ?? "TODOS");
  const [tipoNumero, setTipoNumero] = useState(
    valores.tipoNumeroPatrimonial ?? "TODOS",
  );
  const setores = useOpcoesRemotas(setoresIniciais, setorId, consultarSetores);
  const especies = useOpcoesRemotas(
    especiesIniciais,
    especieId,
    consultarEspecies,
  );
  const naturezas = useOpcoesRemotas(
    naturezasIniciais,
    naturezaId,
    consultarNaturezas,
  );

  return (
    <form action="/patrimonios" className="grid gap-4">
      <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-6 xl:items-end">
        <TextField
          id="filtro-busca"
          name="busca"
          label="Número ou descrição"
          maxLength={200}
          defaultValue={valores.busca}
          placeholder="Busque pelo número, série ou descrição"
          className="font-normal"
          fieldClassName="md:col-span-2 xl:col-span-2"
        />
        <input
          type="hidden"
          name="status"
          value={status === "TODOS" ? "" : status}
        />
        <SelectField
          id="filtro-status"
          label="Situação"
          value={status}
          onValueChange={setStatus}
          options={[
            { value: "TODOS", label: "Todas" },
            { value: "ATIVO", label: "Ativo" },
            { value: "EMPRESTADO", label: "Emprestado" },
            { value: "EM_MANUTENCAO", label: "Em manutenção" },
            { value: "BAIXADO", label: "Baixado" },
          ]}
        />
        <input
          type="hidden"
          name="tipoNumeroPatrimonial"
          value={tipoNumero === "TODOS" ? "" : tipoNumero}
        />
        <SelectField
          id="filtro-tipo-numero"
          label="Numeração"
          value={tipoNumero}
          onValueChange={setTipoNumero}
          options={[
            { value: "TODOS", label: "Todas" },
            { value: "OFICIAL", label: "Número oficial" },
            { value: "SEM_NUMERO_OFICIAL", label: "Não oficial (S/P)" },
          ]}
        />
        <ComboboxField
          id="filtro-setor"
          name="setorId"
          label="Setor"
          value={setorId}
          onValueChange={setSetorId}
          onSearchChange={setores.setBusca}
          options={[
            { value: "", label: "Todos os setores" },
            ...setores.opcoes,
          ]}
          loading={setores.loading}
          placeholder="Todos os setores"
          searchPlaceholder="Buscar setor…"
        />
        <ComboboxField
          id="filtro-especie"
          name="especieId"
          label="Espécie"
          value={especieId}
          onValueChange={setEspecieId}
          onSearchChange={especies.setBusca}
          options={[
            { value: "", label: "Todas as espécies" },
            ...especies.opcoes,
          ]}
          loading={especies.loading}
          placeholder="Todas as espécies"
          searchPlaceholder="Buscar espécie…"
        />
        <ComboboxField
          id="filtro-natureza"
          name="naturezaId"
          label="Natureza"
          value={naturezaId}
          onValueChange={setNaturezaId}
          onSearchChange={naturezas.setBusca}
          options={[
            { value: "", label: "Todas as naturezas" },
            ...naturezas.opcoes,
          ]}
          loading={naturezas.loading}
          placeholder="Todas as naturezas"
          searchPlaceholder="Buscar natureza…"
        />
      </div>
      <div className="flex flex-wrap justify-end gap-2">
        <Button asChild variant="outline">
          <Link href="/patrimonios">Limpar filtros</Link>
        </Button>
        <Button type="submit">
          <Search aria-hidden="true" /> Pesquisar
        </Button>
      </div>
    </form>
  );
}
