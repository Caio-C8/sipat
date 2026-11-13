"use client";

import { useEffect, useRef, useState } from "react";
import {
  Download,
  FilePlus2,
  FileText,
  Pencil,
  RefreshCw,
  RotateCcw,
} from "lucide-react";
import type {
  DocumentoManutencao,
  ItemManutencao,
  ManutencaoDetalhe,
} from "@repo/contracts";
import {
  AtualizarOrcamentoManutencaoBodySchema,
  RegistrarRetornoManutencaoBodySchema,
} from "@repo/contracts";
import { AlertaIdempotencia } from "@/components/alerta-idempotencia";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { browserApiClient } from "@/lib/api/browser-api-client";
import {
  decidirAposFalha,
  isConflitoIdempotencia,
  type DecisaoIdempotencia,
} from "@/lib/api/core/idempotencia";
import {
  campoManutencao,
  classeStatusManutencao,
  formatarDataCivil,
  formatarMoeda,
  painelManutencao,
  rotuloStatusManutencao,
} from "../apresentacao";
import { criarOperacoesManutencoes } from "../api/manutencao-operations";
import { ErroManutencao } from "./erro-manutencao";

const operacoes = criarOperacoesManutencoes(browserApiClient);
const hoje = () =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());

function ListaDocumentos({
  documentos,
}: {
  documentos: DocumentoManutencao[];
}) {
  return documentos.length ? (
    <ul className="grid gap-2">
      {documentos.map((doc) => (
        <li key={doc.id}>
          <a
            href={doc.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-md text-sm font-semibold text-[#2863ec] hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2863ec]"
          >
            <FileText aria-hidden="true" className="size-4" />
            {doc.nome}
            <Download aria-hidden="true" className="size-3.5" />
          </a>
          <p className="ml-6 text-xs text-[#526580]">
            {doc.fase.toLowerCase()} ·{" "}
            {formatarDataCivil(doc.criadoEm.slice(0, 10))}
          </p>
        </li>
      ))}
    </ul>
  ) : (
    <p className="text-sm text-[#526580]">Nenhum documento anexado.</p>
  );
}

function EnviarDocumento({
  pedidoId,
  item,
  onAtualizar,
  onJaProcessada,
}: {
  pedidoId: string;
  item?: ItemManutencao;
  onAtualizar: () => Promise<void>;
  onJaProcessada: (erro: unknown, decisao: DecisaoIdempotencia) => void;
}) {
  const [fase, setFase] = useState<"PEDIDO" | "ENVIO" | "RECEBIMENTO">(
    item ? (item.dataRetorno ? "RECEBIMENTO" : "ENVIO") : "PEDIDO",
  );
  const [arquivo, setArquivo] = useState<File | null>(null);
  const [erro, setErro] = useState<unknown>(null);
  const [decisaoIdempotencia, setDecisaoIdempotencia] =
    useState<DecisaoIdempotencia | null>(null);
  const [ocupado, setOcupado] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const chave = useRef<string | null>(null);
  async function enviar(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!arquivo || ocupado) return;
    setOcupado(true);
    setErro(null);
    setDecisaoIdempotencia(null);
    chave.current ??= crypto.randomUUID();
    try {
      await operacoes.enviarDocumento(
        pedidoId,
        {
          chaveIdempotencia: chave.current,
          fase,
          ...(item ? { itemId: item.id } : {}),
        },
        arquivo,
      );
      chave.current = null;
      setArquivo(null);
      if (input.current) input.current.value = "";
      await onAtualizar();
    } catch (e) {
      const decisao = decidirAposFalha(e);
      setErro(e);
      setDecisaoIdempotencia(
        isConflitoIdempotencia(e) && decisao.tipo !== "ja_processada"
          ? decisao
          : null,
      );
      if (!decisao.manterChave) chave.current = null;
      if (decisao.atualizarConsultas) {
        onJaProcessada(e, decisao);
        await onAtualizar();
      }
    } finally {
      setOcupado(false);
    }
  }
  return (
    <form onSubmit={enviar} className="grid gap-3 text-sm">
      {item ? (
        <label className="grid gap-2">
          Fase
          <select
            value={fase}
            onChange={(e) => {
              setFase(e.target.value as "ENVIO" | "RECEBIMENTO");
              chave.current = null;
              setErro(null);
            }}
            className={campoManutencao}
          >
            <option value="ENVIO" disabled={!!item.dataRetorno}>
              Envio
            </option>
            <option value="RECEBIMENTO" disabled={!item.dataRetorno}>
              Recebimento
            </option>
          </select>
        </label>
      ) : null}
      <label className="grid gap-2">
        Arquivo PDF (até 10 MiB)
        <input
          ref={input}
          type="file"
          accept="application/pdf,.pdf"
          onChange={(e) => {
            setArquivo(e.target.files?.[0] ?? null);
            chave.current = null;
            setErro(null);
          }}
          required
          className={campoManutencao}
        />
      </label>
      <Button
        type="submit"
        disabled={
          !arquivo || ocupado || decisaoIdempotencia?.tipo === "ja_processada"
        }
        className="justify-self-start gap-2"
      >
        <FilePlus2 aria-hidden="true" />
        {ocupado ? "Enviando…" : "Anexar PDF"}
      </Button>
      {erro && decisaoIdempotencia ? (
        <AlertaIdempotencia
          erro={erro}
          decisao={decisaoIdempotencia}
          destino={{
            href: `/manutencoes/${pedidoId}`,
            rotulo: "Atualizar detalhe da manutenção",
          }}
        />
      ) : erro ? (
        <>
          <ErroManutencao erro={erro} />
          <p role="status">
            O pedido ou retorno já confirmado permanece no sistema. Consulte o
            detalhe antes de reenviar.
          </p>
        </>
      ) : null}
    </form>
  );
}

function FormularioOrcamento({
  pedidoId,
  item,
  onAtualizar,
  onConcluir,
}: {
  pedidoId: string;
  item: ItemManutencao;
  onAtualizar: () => Promise<void>;
  onConcluir: () => void;
}) {
  const [data, setData] = useState(
    item.orcamentoAtual?.dataOrcamento ?? hoje(),
  );
  const [descricao, setDescricao] = useState(
    item.orcamentoAtual?.descricaoOrcamento ?? "",
  );
  const [valor, setValor] = useState(item.orcamentoAtual?.valorOrcamento ?? "");
  const [fornecedorId, setFornecedorId] = useState(item.fornecedor?.id ?? "");
  const [busca, setBusca] = useState("");
  const [fornecedores, setFornecedores] = useState<
    { id: string; nome: string }[]
  >([]);
  const [erro, setErro] = useState<unknown>(null);
  const [ocupado, setOcupado] = useState(false);
  useEffect(() => {
    let ativo = true;
    void operacoes
      .fornecedores({ limite: "50" })
      .then((resposta) => {
        if (ativo) setFornecedores(resposta.dados);
      })
      .catch((e: unknown) => {
        if (ativo) setErro(e);
      });
    return () => {
      ativo = false;
    };
  }, []);
  async function buscar() {
    try {
      setFornecedores(
        (
          await operacoes.fornecedores({
            ...(busca.trim() ? { busca: busca.trim() } : {}),
            limite: "50",
          })
        ).dados,
      );
    } catch (e) {
      setErro(e);
    }
  }
  async function salvar(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (ocupado) return;
    const body = {
      versaoEsperada: item.versaoOrcamento,
      fornecedorId: fornecedorId || null,
      dataOrcamento: data,
      descricaoOrcamento: descricao,
      valorOrcamento: valor,
    };
    const validacao = AtualizarOrcamentoManutencaoBodySchema.safeParse(body);
    if (!validacao.success) {
      setErro(validacao.error.issues.map((issue) => issue.message).join(" "));
      return;
    }
    setOcupado(true);
    setErro(null);
    try {
      await operacoes.atualizarOrcamento(pedidoId, item.id, body);
      await onAtualizar();
      onConcluir();
    } catch (e) {
      setErro(e);
    } finally {
      setOcupado(false);
    }
  }
  return (
    <form
      id="form-orcamento"
      onSubmit={salvar}
      className="grid gap-4 px-6 text-sm sm:grid-cols-2"
    >
      <div className="rounded-md bg-[#f3f7fe] p-4 sm:col-span-2">
        <strong>
          {item.patrimonio.numeroPatrimonio} · {item.patrimonio.descricao}
        </strong>
        <p className="mt-1 text-xs text-[#526580]">
          Versão atual: {item.versaoOrcamento}
        </p>
      </div>
      <div className="grid gap-2 sm:col-span-2">
        <label htmlFor="busca-fornecedor-orcamento">
          Buscar fornecedor ativo
        </label>
        <div className="flex gap-2">
          <input
            id="busca-fornecedor-orcamento"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className={campoManutencao}
          />
          <Button type="button" variant="outline" onClick={() => void buscar()}>
            Buscar
          </Button>
        </div>
      </div>
      <label className="grid gap-2">
        Fornecedor
        <select
          value={fornecedorId}
          onChange={(e) => setFornecedorId(e.target.value)}
          className={campoManutencao}
        >
          <option value="">Nenhum</option>
          {item.fornecedor &&
          !fornecedores.some((f) => f.id === item.fornecedor?.id) ? (
            <option value={item.fornecedor.id}>
              {item.fornecedor.nome} (atual)
            </option>
          ) : null}
          {fornecedores.map((f) => (
            <option key={f.id} value={f.id}>
              {f.nome}
            </option>
          ))}
        </select>
      </label>
      <label className="grid gap-2">
        Data do orçamento *
        <input
          type="date"
          value={data}
          onChange={(e) => setData(e.target.value)}
          required
          className={campoManutencao}
        />
      </label>
      <label className="grid gap-2">
        Valor orçado (R$) *
        <input
          inputMode="decimal"
          value={valor}
          onChange={(e) => setValor(e.target.value)}
          required
          className={campoManutencao}
        />
      </label>
      <label className="grid gap-2 sm:col-span-2">
        Descrição do orçamento *
        <textarea
          rows={3}
          value={descricao}
          onChange={(e) => setDescricao(e.target.value)}
          required
          className={campoManutencao}
        />
      </label>
      {erro ? (
        <div className="sm:col-span-2">
          <ErroManutencao erro={erro} />
        </div>
      ) : null}
      <DialogFooter className="sm:col-span-2">
        <Button type="button" variant="outline" onClick={onConcluir}>
          Cancelar
        </Button>
        <Button type="submit" disabled={ocupado}>
          {ocupado ? "Salvando…" : "Salvar orçamento"}
        </Button>
      </DialogFooter>
    </form>
  );
}

function FormularioRetorno({
  pedidoId,
  item,
  dataEnvio,
  onAtualizar,
  onJaProcessada,
  onConcluir,
}: {
  pedidoId: string;
  item: ItemManutencao;
  dataEnvio: string;
  onAtualizar: () => Promise<void>;
  onJaProcessada: (erro: unknown, decisao: DecisaoIdempotencia) => void;
  onConcluir: () => void;
}) {
  const [data, setData] = useState(hoje());
  const [descricao, setDescricao] = useState("");
  const [valor, setValor] = useState("");
  const [garantiaDescricao, setGarantiaDescricao] = useState("");
  const [garantiaFim, setGarantiaFim] = useState("");
  const [erro, setErro] = useState<unknown>(null);
  const [ocupado, setOcupado] = useState(false);
  const [decisaoIdempotencia, setDecisaoIdempotencia] =
    useState<DecisaoIdempotencia | null>(null);
  const chave = useRef<string | null>(null);
  const alterar = () => {
    chave.current = null;
    setErro(null);
    setDecisaoIdempotencia(null);
  };
  async function salvar(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (ocupado) return;
    const body = {
      chaveIdempotencia: chave.current ?? crypto.randomUUID(),
      dataRetorno: data,
      descricaoServicoRealizado: descricao,
      valorRealizado: valor,
      garantia: garantiaDescricao.trim()
        ? {
            descricao: garantiaDescricao.trim(),
            ...(garantiaFim ? { dataFim: garantiaFim } : {}),
          }
        : null,
    };
    const validacao = RegistrarRetornoManutencaoBodySchema.safeParse(body);
    if (!validacao.success) {
      setErro(validacao.error.issues.map((issue) => issue.message).join(" "));
      return;
    }
    chave.current = body.chaveIdempotencia;
    setOcupado(true);
    setErro(null);
    setDecisaoIdempotencia(null);
    try {
      await operacoes.registrarRetorno(pedidoId, item.id, body);
      chave.current = null;
      await onAtualizar();
      onConcluir();
    } catch (e) {
      const decisao = decidirAposFalha(e);
      setErro(e);
      setDecisaoIdempotencia(
        isConflitoIdempotencia(e) && decisao.tipo !== "ja_processada"
          ? decisao
          : null,
      );
      if (!decisao.manterChave) chave.current = null;
      if (decisao.atualizarConsultas) {
        onJaProcessada(e, decisao);
        await onAtualizar();
        onConcluir();
      }
    } finally {
      setOcupado(false);
    }
  }
  return (
    <form onSubmit={salvar} className="grid gap-4 px-6 text-sm sm:grid-cols-2">
      <div className="rounded-md bg-[#f3f7fe] p-4 sm:col-span-2">
        <strong>
          {item.patrimonio.numeroPatrimonio} · {item.patrimonio.descricao}
        </strong>
        <p className="mt-1 text-xs text-[#526580]">
          {item.fornecedor?.nome ?? "Fornecedor não informado"}
        </p>
      </div>
      <label className="grid gap-2">
        Data do retorno *
        <input
          type="date"
          min={dataEnvio}
          max={hoje()}
          value={data}
          onChange={(e) => {
            setData(e.target.value);
            alterar();
          }}
          required
          className={campoManutencao}
        />
      </label>
      <label className="grid gap-2">
        Valor realizado (R$) *
        <input
          inputMode="decimal"
          value={valor}
          onChange={(e) => {
            setValor(e.target.value);
            alterar();
          }}
          required
          className={campoManutencao}
        />
      </label>
      <label className="grid gap-2 sm:col-span-2">
        Serviço realizado *
        <textarea
          rows={4}
          value={descricao}
          onChange={(e) => {
            setDescricao(e.target.value);
            alterar();
          }}
          required
          className={campoManutencao}
        />
      </label>
      <label className="grid gap-2">
        Descrição da garantia
        <input
          value={garantiaDescricao}
          onChange={(e) => {
            setGarantiaDescricao(e.target.value);
            alterar();
          }}
          className={campoManutencao}
        />
      </label>
      <label className="grid gap-2">
        Fim da garantia
        <input
          type="date"
          min={data}
          value={garantiaFim}
          onChange={(e) => {
            setGarantiaFim(e.target.value);
            alterar();
          }}
          disabled={!garantiaDescricao.trim()}
          className={campoManutencao}
        />
      </label>
      {erro && decisaoIdempotencia ? (
        <div className="sm:col-span-2">
          <AlertaIdempotencia
            erro={erro}
            decisao={decisaoIdempotencia}
            destino={{
              href: `/manutencoes/${pedidoId}`,
              rotulo: "Atualizar detalhe da manutenção",
            }}
          />
        </div>
      ) : erro ? (
        <div className="sm:col-span-2">
          <ErroManutencao erro={erro} />
        </div>
      ) : null}
      <DialogFooter className="sm:col-span-2">
        <Button type="button" variant="outline" onClick={onConcluir}>
          Cancelar
        </Button>
        <Button
          type="submit"
          disabled={ocupado || decisaoIdempotencia?.tipo === "ja_processada"}
        >
          {ocupado ? "Registrando…" : "Confirmar retorno"}
        </Button>
      </DialogFooter>
    </form>
  );
}

type Acao = {
  tipo: "orcamento" | "retorno" | "documento";
  itemId: string;
} | null;

export function DetalhePedido({ inicial }: { inicial: ManutencaoDetalhe }) {
  const [pedido, setPedido] = useState(inicial);
  const [erro, setErro] = useState<unknown>(null);
  const [acao, setAcao] = useState<Acao>(null);
  const [conflitoProcessado, setConflitoProcessado] = useState<{
    erro: unknown;
    decisao: DecisaoIdempotencia;
  } | null>(null);
  const conflitoRef = useRef<HTMLDivElement>(null);
  const itemAcao = acao
    ? pedido.itens.find((item) => item.id === acao.itemId)
    : undefined;
  function informarJaProcessada(
    erroConflito: unknown,
    decisao: DecisaoIdempotencia,
  ) {
    setConflitoProcessado({ erro: erroConflito, decisao });
    requestAnimationFrame(() => conflitoRef.current?.focus());
  }
  async function atualizar() {
    try {
      setPedido((await operacoes.consultar(pedido.id)).dados);
      setErro(null);
    } catch (e) {
      setErro(e);
    }
  }
  return (
    <div className="grid gap-5">
      {conflitoProcessado ? (
        <div ref={conflitoRef} tabIndex={-1} className="outline-none">
          <AlertaIdempotencia
            erro={conflitoProcessado.erro}
            decisao={conflitoProcessado.decisao}
            destino={{ href: "/manutencoes", rotulo: "Consultar manutenções" }}
          />
        </div>
      ) : null}
      <section
        className={painelManutencao}
        aria-labelledby="dados-pedido-title"
      >
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(18rem,0.36fr)]">
          <div>
            <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 id="dados-pedido-title" className="font-bold">
                  Dados do pedido
                </h2>
                <p className="mt-1 break-all text-xs text-[#526580]">
                  ID {pedido.id}
                </p>
              </div>
              <span
                className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${classeStatusManutencao(pedido.status)}`}
              >
                {rotuloStatusManutencao(pedido.status)}
              </span>
            </div>
            <dl className="grid gap-4 text-sm sm:grid-cols-2 xl:grid-cols-4">
              <div>
                <dt className="text-xs text-[#526580]">Data de envio</dt>
                <dd className="mt-1 font-semibold">
                  {formatarDataCivil(pedido.dataEnvio)}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-[#526580]">Comissão</dt>
                <dd className="mt-1 font-semibold">{pedido.comissao.nome}</dd>
              </div>
              <div>
                <dt className="text-xs text-[#526580]">Atendimentos</dt>
                <dd className="mt-1 font-semibold">
                  {pedido.itensRetornados} de {pedido.totalItens} retornados
                </dd>
              </div>
              <div>
                <dt className="text-xs text-[#526580]">Último retorno</dt>
                <dd className="mt-1 font-semibold">
                  {formatarDataCivil(pedido.dataRetorno)}
                </dd>
              </div>
            </dl>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="mt-5 gap-2"
              onClick={() => void atualizar()}
            >
              <RefreshCw aria-hidden="true" /> Atualizar dados
            </Button>
            {erro ? (
              <div className="mt-4">
                <ErroManutencao erro={erro} />
              </div>
            ) : null}
          </div>
          <aside
            className="rounded-md border border-[#d8e6fb] bg-[#f3f7fe] p-4"
            aria-label="Documento do pedido"
          >
            <div className="mb-3 flex items-center justify-between gap-2">
              <h3 className="font-semibold">Documento do pedido</h3>
              <FileText aria-hidden="true" className="size-4 text-[#2863ec]" />
            </div>
            <ListaDocumentos documentos={pedido.documentos} />
            {!pedido.documentos.length ? (
              <div className="mt-4">
                <EnviarDocumento
                  pedidoId={pedido.id}
                  onAtualizar={atualizar}
                  onJaProcessada={informarJaProcessada}
                />
              </div>
            ) : null}
          </aside>
        </div>
      </section>

      <section
        className={painelManutencao}
        aria-labelledby="atendimentos-title"
      >
        <div className="mb-4">
          <h2 id="atendimentos-title" className="font-bold">
            Atendimentos por item
          </h2>
          <p className="mt-1 text-xs text-[#526580]">
            Orçamento, documentos e retorno permanecem individuais.
          </p>
        </div>
        <div
          className="overflow-x-auto"
          role="region"
          aria-label="Atendimentos do pedido"
          tabIndex={0}
        >
          <table className="w-full min-w-[68rem] text-left text-sm">
            <thead className="bg-[#f7f9fc] text-[11px] font-semibold tracking-wide text-[#526580] uppercase">
              <tr>
                <th className="px-3 py-3">Patrimônio / problema</th>
                <th className="px-3 py-3">Fornecedor</th>
                <th className="px-3 py-3">Tipo</th>
                <th className="px-3 py-3">Previsão</th>
                <th className="px-3 py-3">Orçamento</th>
                <th className="px-3 py-3">Situação</th>
                <th className="px-3 py-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {pedido.itens.map((item) => (
                <tr
                  key={item.id}
                  className="border-b border-[#e4eaf2] align-top"
                >
                  <td className="px-3 py-4">
                    <strong>
                      {item.patrimonio.numeroPatrimonio} ·{" "}
                      {item.patrimonio.descricao}
                    </strong>
                    <p className="mt-1 max-w-72 text-xs text-[#526580]">
                      {item.descricaoProblema ?? "Problema não informado"}
                    </p>
                  </td>
                  <td className="px-3 py-4">
                    {item.fornecedor?.nome ?? "Não informado"}
                  </td>
                  <td className="px-3 py-4">
                    {item.tipo === "CORRETIVA" ? "Corretiva" : "Preventiva"}
                  </td>
                  <td className="px-3 py-4">
                    {formatarDataCivil(item.previsaoRetorno)}
                  </td>
                  <td className="px-3 py-4">
                    <strong>
                      {formatarMoeda(item.orcamentoAtual?.valorOrcamento)}
                    </strong>
                    <p className="mt-1 text-xs text-[#526580]">
                      {item.revisoesOrcamento.length} versão(ões)
                    </p>
                  </td>
                  <td className="px-3 py-4">
                    <span
                      className={`inline-flex rounded-full border px-2 py-1 text-xs font-semibold ${item.dataRetorno ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-amber-200 bg-amber-50 text-amber-700"}`}
                    >
                      {item.dataRetorno ? "Retornado" : "Em manutenção"}
                    </span>
                    {item.dataRetorno ? (
                      <p className="mt-1 text-xs text-[#526580]">
                        {formatarDataCivil(item.dataRetorno)}
                      </p>
                    ) : null}
                  </td>
                  <td className="px-3 py-4">
                    <div className="flex justify-end gap-1">
                      {!item.dataRetorno ? (
                        <>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              setAcao({ tipo: "orcamento", itemId: item.id })
                            }
                          >
                            <Pencil aria-hidden="true" /> Orçamento
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            onClick={() =>
                              setAcao({ tipo: "retorno", itemId: item.id })
                            }
                          >
                            <RotateCcw aria-hidden="true" /> Retorno
                          </Button>
                        </>
                      ) : null}
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          setAcao({ tipo: "documento", itemId: item.id })
                        }
                      >
                        <FilePlus2 aria-hidden="true" /> PDF
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-5 flex justify-end border-t border-[#e4eaf2] pt-4">
          <p className="text-sm font-semibold">
            Total realizado:{" "}
            {formatarMoeda(
              pedido.itens
                .reduce(
                  (total, item) => total + Number(item.valorRealizado ?? 0),
                  0,
                )
                .toString(),
            )}
          </p>
        </div>
      </section>

      {pedido.justificativa ? (
        <section className={painelManutencao}>
          <h2 className="font-bold">Motivo do pedido</h2>
          <p className="mt-2 text-sm text-[#526580]">{pedido.justificativa}</p>
        </section>
      ) : null}

      <Dialog
        open={acao?.tipo === "orcamento"}
        onOpenChange={(aberto) => {
          if (!aberto) setAcao(null);
        }}
      >
        {acao?.tipo === "orcamento" && itemAcao ? (
          <DialogContent className="max-h-[min(92vh,54rem)] max-w-3xl overflow-y-auto p-0">
            <DialogHeader className="border-b border-[#e4eaf2] p-6 pb-4">
              <DialogTitle className="text-xl text-[#19355d]">
                Configurar atendimento do item
              </DialogTitle>
              <DialogDescription>
                Registre uma nova versão sem apagar o histórico de orçamento.
              </DialogDescription>
            </DialogHeader>
            <FormularioOrcamento
              pedidoId={pedido.id}
              item={itemAcao}
              onAtualizar={atualizar}
              onConcluir={() => setAcao(null)}
            />
          </DialogContent>
        ) : null}
      </Dialog>
      <Dialog
        open={acao?.tipo === "retorno"}
        onOpenChange={(aberto) => {
          if (!aberto) setAcao(null);
        }}
      >
        {acao?.tipo === "retorno" && itemAcao ? (
          <DialogContent className="max-h-[min(92vh,54rem)] max-w-3xl overflow-y-auto p-0">
            <DialogHeader className="border-b border-[#e4eaf2] p-6 pb-4">
              <DialogTitle className="text-xl text-[#19355d]">
                Registrar retorno do bem
              </DialogTitle>
              <DialogDescription>
                Conclua apenas o atendimento do patrimônio selecionado.
              </DialogDescription>
            </DialogHeader>
            <FormularioRetorno
              pedidoId={pedido.id}
              item={itemAcao}
              dataEnvio={pedido.dataEnvio}
              onAtualizar={atualizar}
              onJaProcessada={informarJaProcessada}
              onConcluir={() => setAcao(null)}
            />
          </DialogContent>
        ) : null}
      </Dialog>
      <Dialog
        open={acao?.tipo === "documento"}
        onOpenChange={(aberto) => {
          if (!aberto) setAcao(null);
        }}
      >
        {acao?.tipo === "documento" && itemAcao ? (
          <DialogContent className="max-w-xl">
            <DialogHeader>
              <DialogTitle>Documentos do atendimento</DialogTitle>
              <DialogDescription>
                {itemAcao.patrimonio.numeroPatrimonio} ·{" "}
                {itemAcao.patrimonio.descricao}
              </DialogDescription>
            </DialogHeader>
            <ListaDocumentos documentos={itemAcao.documentos} />
            <div className="border-t border-[#e4eaf2] pt-4">
              <EnviarDocumento
                pedidoId={pedido.id}
                item={itemAcao}
                onAtualizar={atualizar}
                onJaProcessada={informarJaProcessada}
              />
            </div>
          </DialogContent>
        ) : null}
      </Dialog>
    </div>
  );
}
