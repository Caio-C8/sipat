"use client";
import { useState, type ReactNode } from "react";
import {
  TipoEventoRelatorioSchema,
  type CatalogoRelatoriosResponse,
  type TipoRelatorio,
  type CatalogoOpcaoRelatorio,
} from "@repo/contracts";
import { Button } from "@/components/ui/button";
import { campo, painel, rotulo } from "../apresentacao";
import { SeletorRelatorio } from "./seletor";
type Seletor = {
  nome: string;
  label: string;
  catalogo: CatalogoOpcaoRelatorio;
  obrigatorio?: boolean;
};
const patrimonio: Seletor = {
  nome: "patrimonioId",
  label: "Patrimônio",
  catalogo: "patrimonios",
};
const comissao: Seletor = {
  nome: "comissaoId",
  label: "Comissão",
  catalogo: "comissoes",
};
const seletores: Record<TipoRelatorio, Seletor[]> = {
  patrimonios: [
    patrimonio,
    { nome: "setorId", label: "Setor atual", catalogo: "setores" },
    {
      nome: "responsavelId",
      label: "Responsável atual",
      catalogo: "responsaveis",
    },
    { nome: "naturezaId", label: "Natureza", catalogo: "naturezas" },
    { nome: "especieId", label: "Espécie", catalogo: "especies" },
  ],
  "ficha-bem": [{ ...patrimonio, obrigatorio: true }],
  movimentacoes: [
    patrimonio,
    { nome: "setorOrigemId", label: "Setor de origem", catalogo: "setores" },
    { nome: "setorDestinoId", label: "Setor de destino", catalogo: "setores" },
    comissao,
  ],
  manutencoes: [
    patrimonio,
    {
      nome: "fornecedorId",
      label: "Fornecedor do item",
      catalogo: "fornecedores",
    },
  ],
  depreciacoes: [patrimonio, comissao],
  reavaliacoes: [patrimonio, comissao],
  inventarios: [
    {
      nome: "inventarioId",
      label: "Inventário",
      catalogo: "inventarios",
      obrigatorio: true,
    },
    patrimonio,
    { nome: "setorEsperadoId", label: "Setor esperado", catalogo: "setores" },
    {
      nome: "setorEncontradoId",
      label: "Setor encontrado",
      catalogo: "setores",
    },
  ],
  emprestimos: [patrimonio],
  baixas: [patrimonio, comissao],
};
const escolhas: Record<TipoRelatorio, Record<string, string[]>> = {
  patrimonios: {
    status: ["ATIVO", "BAIXADO", "EMPRESTADO", "EM_MANUTENCAO"],
    tipoNumero: ["OFICIAL", "SEM_NUMERO_OFICIAL"],
    ordenacao: ["NUMERO", "TOMBAMENTO"],
  },
  "ficha-bem": { evento: [...TipoEventoRelatorioSchema.options] },
  movimentacoes: { origem: ["COMUM", "CORRECAO_INVENTARIO"] },
  manutencoes: {
    base: ["ENVIO", "RETORNO"],
    tipo: ["PREVENTIVA", "CORRETIVA"],
    situacao: ["PENDENTE", "RETORNADO"],
  },
  depreciacoes: {},
  reavaliacoes: { base: ["REGISTRO", "REFERENCIA"] },
  inventarios: {
    verificacao: ["VERIFICADO", "PENDENTE"],
    situacao: ["CORRETO", "DIVERGENCIA", "NAO_LOCALIZADO"],
    correcao: ["CORRIGIDO", "PENDENTE"],
    correcaoPosterior: ["CORRIGIDO", "PENDENTE"],
  },
  emprestimos: {
    base: ["SAIDA", "PREVISAO", "DEVOLUCAO"],
    situacao: ["PENDENTE", "DEVOLVIDO"],
    emAtraso: ["true", "false"],
  },
  baixas: {
    tipo: [
      "ALIENACAO",
      "INUTILIZACAO",
      "SINISTRO",
      "FURTO",
      "EXTRAVIO",
      "TRANSFERENCIA",
      "RECLASSIFICACAO",
      "ABANDONO",
      "ERRO_REGISTRO",
      "OUTRO",
    ],
  },
};
export function FormularioRelatorios({
  catalogo,
  tipoInicial,
  valores,
  diaAtual,
  children,
}: {
  catalogo: CatalogoRelatoriosResponse;
  tipoInicial: TipoRelatorio;
  valores: Record<string, string>;
  diaAtual: string;
  children: ReactNode;
}) {
  const [tipo, setTipo] = useState(tipoInicial);
  const [q, setQ] = useState(valores);
  const [dirty, setDirty] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const padrao = (nome: string) =>
    nome === "inicio"
      ? `${diaAtual.slice(0, 7)}-01`
      : nome === "fim"
        ? diaAtual
        : nome.startsWith("competencia")
          ? diaAtual.slice(0, 7)
          : nome === "base"
            ? (escolhas[tipo].base?.[0] ?? "")
            : nome === "ordenacao"
              ? "NUMERO"
              : "";
  const mudar = (nome: string, v: string) => {
    setQ({ ...q, [nome]: v });
    setDirty(true);
  };
  const opcionalPeriodo = tipo === "patrimonios" || tipo === "ficha-bem";
  const extraTexto =
    tipo === "patrimonios"
      ? ["busca"]
      : tipo === "manutencoes"
        ? ["pedidoId"]
        : tipo === "emprestimos"
          ? ["grupoId", "destinatario"]
          : [];
  const atual = catalogo.dados.tipos.find((t) => t.tipo === tipo)!;
  return (
    <>
      <form
        action="/relatorios"
        method="get"
        className={painel}
        aria-label="Filtros do relatório"
        onSubmit={() => setSubmitting(true)}
      >
        <input type="hidden" name="consultar" value="1" />
        <label className="block text-sm font-semibold">
          Tipo de relatório
          <select
            className={campo}
            name="tipo"
            value={tipo}
            onChange={(e) => {
              setTipo(e.target.value as TipoRelatorio);
              setQ({});
              setDirty(true);
            }}
          >
            {catalogo.dados.tipos.map((t) => (
              <option key={t.tipo} value={t.tipo} disabled={!t.disponivel}>
                {t.titulo}
                {t.disponivel ? "" : " — indisponível"}
              </option>
            ))}
          </select>
        </label>
        {atual.motivo && <p className="mt-2 text-sm">{atual.motivo}</p>}
        <p className="my-4 text-sm text-slate-600">
          {tipo === "patrimonios"
            ? "Cadastro e valores atuais, incluindo bens baixados. Tombamento não reconstrói posição em data passada."
            : tipo === "inventarios"
              ? "Escolha o inventário. Conferência incompleta não significa ausência de inconsistências."
              : "Nomes sem snapshot são cadastrais atuais; lacunas históricas permanecem identificadas."}
        </p>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {tipo !== "inventarios" &&
            (tipo === "depreciacoes"
              ? ["competenciaInicio", "competenciaFim"]
              : ["inicio", "fim"]
            ).map((nome) => (
              <label key={nome} className="text-sm">
                {rotulo(nome)}
                {opcionalPeriodo
                  ? " (opcional, informe ambos)"
                  : " (obrigatório)"}
                <input
                  className={campo}
                  name={nome}
                  type={tipo === "depreciacoes" ? "month" : "date"}
                  required={!opcionalPeriodo}
                  value={q[nome] ?? (opcionalPeriodo ? "" : padrao(nome))}
                  onChange={(e) => mudar(nome, e.target.value)}
                />
              </label>
            ))}
          {Object.entries(escolhas[tipo]).map(([nome, opcoes]) => (
            <label className="text-sm" key={nome}>
              {rotulo(nome)}
              <select
                className={campo}
                name={nome}
                value={q[nome] ?? padrao(nome)}
                required={nome === "base" || nome === "ordenacao"}
                onChange={(e) => mudar(nome, e.target.value)}
              >
                {nome !== "base" && nome !== "ordenacao" && (
                  <option value="">Todos</option>
                )}
                {opcoes.map((v) => (
                  <option key={v} value={v}>
                    {v === "OFICIAL"
                      ? "Com número oficial"
                      : v === "SEM_NUMERO_OFICIAL"
                        ? "Sem número oficial (SP-n)"
                        : v === "true"
                          ? "Sim"
                          : v === "false"
                            ? "Não"
                            : v.replaceAll("_", " ")}
                  </option>
                ))}
              </select>
            </label>
          ))}
          {extraTexto.map((nome) => (
            <label className="text-sm" key={nome}>
              {rotulo(nome)} (opcional)
              <input
                className={campo}
                name={nome}
                value={q[nome] ?? ""}
                maxLength={nome.endsWith("Id") ? 36 : 200}
                onChange={(e) => mudar(nome, e.target.value)}
              />
            </label>
          ))}
        </div>
        <details
          className="my-4 rounded-md border border-slate-200 p-3"
          open={tipo === "ficha-bem" || tipo === "inventarios"}
        >
          <summary className="cursor-pointer font-semibold">
            Seleção por cadastro{" "}
            {tipo === "ficha-bem" || tipo === "inventarios"
              ? "(obrigatória)"
              : "e filtros opcionais"}
          </summary>
          <div className="mt-3 grid gap-3 lg:grid-cols-2">
            {seletores[tipo].map((s) => (
              <SeletorRelatorio
                key={`${tipo}-${s.nome}`}
                {...s}
                tipo={tipo}
                valor={q[s.nome] ?? ""}
                onChange={(v) => mudar(s.nome, v)}
              />
            ))}
          </div>
        </details>
        <Button type="submit" disabled={submitting || !atual.disponivel}>
          {submitting ? "Consultando…" : "Consultar prévia"}
        </Button>
      </form>
      {dirty ? (
        <p role="status" className={painel}>
          Filtros alterados. Consulte uma nova prévia antes de exportar.
        </p>
      ) : (
        children
      )}
    </>
  );
}
