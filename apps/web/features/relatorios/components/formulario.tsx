"use client";
import { useCallback, useState, type ReactNode } from "react";
import {
  TipoEventoRelatorioSchema,
  type CatalogoRelatoriosResponse,
  type TipoRelatorio,
  type CatalogoOpcaoRelatorio,
} from "@repo/contracts";
import { Button } from "@/components/ui/button";
import { campo, painel, rotulo, rotuloOpcao, valor } from "../apresentacao";
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
  "pendencias-depreciacao": [patrimonio],
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
  "pendencias-depreciacao": {},
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
  usuario,
  children,
}: {
  catalogo: CatalogoRelatoriosResponse;
  tipoInicial: TipoRelatorio;
  valores: Record<string, string>;
  diaAtual: string;
  usuario: string;
  children: ReactNode;
}) {
  const tipo = tipoInicial;
  const [q, setQ] = useState(valores);
  const [dirty, setDirty] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [nomes, setNomes] = useState<Record<string, string>>({});
  const registrarNome = useCallback(
    (nome: string, rotulo: string) =>
      setNomes((atual) =>
        atual[nome] === rotulo ? atual : { ...atual, [nome]: rotulo },
      ),
    [],
  );
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
  const opcionalPeriodo =
    tipo === "patrimonios" || tipo === "ficha-bem" || tipo === "baixas";
  const competenciaOpcional =
    tipo === "depreciacoes" || tipo === "pendencias-depreciacao";
  const camposTemporais = competenciaOpcional
    ? ["competencia"]
    : ["inicio", "fim"];
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
        className={`${painel} grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(18rem,1fr)]`}
        aria-label="Filtros do relatório"
        onSubmit={() => setSubmitting(true)}
      >
        <input type="hidden" name="consultar" value="1" />
        <input type="hidden" name="relatorio" value={tipo} />
        <div className="min-w-0">
          <h2 className="font-semibold">Filtros do relatório</h2>
          {atual.motivo && <p className="mt-2 text-sm">{atual.motivo}</p>}
          <p className="my-4 text-sm text-slate-600">
            {tipo === "patrimonios"
              ? "Cadastro e valores atuais, incluindo bens baixados. Tombamento não reconstrói posição em data passada."
              : tipo === "inventarios"
                ? "Escolha o inventário. Conferência incompleta não significa ausência de inconsistências."
                : tipo === "pendencias-depreciacao"
                  ? "Exibe somente obrigações ainda não processadas. A competência é opcional e usa o formato canônico AAAA-MM."
                  : "Nomes sem snapshot são cadastrais atuais; lacunas históricas permanecem identificadas."}
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            {tipo !== "inventarios" &&
              camposTemporais.map((nome) => (
                <label key={nome} className="text-sm">
                  {rotulo(nome)}
                  {competenciaOpcional
                    ? " (opcional)"
                    : opcionalPeriodo
                      ? " (opcional, informe ambos)"
                      : " (obrigatório)"}
                  <input
                    className={campo}
                    name={nome}
                    type={nome.startsWith("competencia") ? "month" : "date"}
                    required={!opcionalPeriodo && !competenciaOpcional}
                    value={
                      q[nome] ??
                      (opcionalPeriodo || competenciaOpcional
                        ? ""
                        : padrao(nome))
                    }
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
                      {v === "true"
                        ? "Sim"
                        : v === "false"
                          ? "Não"
                          : rotuloOpcao(v)}
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
            open={
              tipo === "patrimonios" ||
              tipo === "ficha-bem" ||
              tipo === "inventarios"
            }
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
                  onLabel={registrarNome}
                />
              ))}
            </div>
          </details>
        </div>
        <aside className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm">
          <h2 className="font-semibold">Resumo da seleção</h2>
          <dl className="mt-3 grid gap-2 sm:grid-cols-2">
            <div>
              <dt className="text-slate-500">Relatório</dt>
              <dd>{atual.titulo}</dd>
            </div>
            <div>
              <dt className="text-slate-500">Emitido por</dt>
              <dd>{usuario}</dd>
            </div>
            <div>
              <dt className="text-slate-500">Documento</dt>
              <dd>PDF · conjunto filtrado</dd>
            </div>
            <div>
              <dt className="text-slate-500">Filtros selecionados</dt>
              <dd className="break-words">
                {Object.entries(q)
                  .filter(
                    ([chave, valor]) =>
                      !["relatorio", "consultar", "pagina", "limite"].includes(
                        chave,
                      ) && valor,
                  )
                  .map(
                    ([chave, dado]) =>
                      `${rotulo(chave)}: ${nomes[chave] ?? valor(dado)}`,
                  )
                  .join(" · ") || "Sem filtros opcionais"}
              </dd>
            </div>
          </dl>
        </aside>
        <div className="rounded-lg border border-slate-200 p-4 text-sm lg:col-span-2">
          <h2 className="font-semibold">Informações incluídas</h2>
          <p className="mt-2">
            Identificação do relatório, filtros aplicados, data de emissão,
            registros, totais disponíveis e avisos.
          </p>
        </div>
        <Button
          type="submit"
          className="bg-[#19355d] lg:col-span-2 lg:justify-self-end"
          disabled={submitting || !atual.disponivel}
        >
          {submitting ? "Gerando prévia…" : "Gerar prévia"}
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
