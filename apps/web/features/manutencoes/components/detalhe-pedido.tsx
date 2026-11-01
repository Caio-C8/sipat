"use client";
import { useEffect, useRef, useState } from "react";
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
import { browserApiClient } from "@/lib/api/browser-api-client";
import {
  decidirAposFalha,
  isConflitoIdempotencia,
  type DecisaoIdempotencia,
} from "@/lib/api/core/idempotencia";
import { criarOperacoesManutencoes } from "../api/manutencao-operations";
import { ErroManutencao } from "./erro-manutencao";

const operacoes = criarOperacoesManutencoes(browserApiClient);
const campo =
  "rounded-md border border-slate-300 bg-white p-2 text-sm text-slate-900 focus-visible:outline-2 focus-visible:outline-offset-2";
const hoje = () =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());

function Documentos({ documentos }: { documentos: DocumentoManutencao[] }) {
  return (
    <div className="grid gap-2">
      <h4 className="font-semibold">Documentos</h4>
      {documentos.length ? (
        <ul className="list-disc pl-5 text-sm">
          {documentos.map((doc) => (
            <li key={doc.id}>
              <a
                href={doc.url}
                target="_blank"
                rel="noopener noreferrer"
                className="underline"
              >
                {doc.nome} ({doc.fase.toLowerCase()})
              </a>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm">Nenhum documento.</p>
      )}
    </div>
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
          chaveIdempotencia: chave.current ?? crypto.randomUUID(),
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
    <form onSubmit={enviar} className="grid gap-2 rounded border p-3 text-sm">
      <h4 className="font-semibold">Anexar PDF</h4>
      {item ? (
        <label className="grid gap-1">
          Fase
          <select
            value={fase}
            onChange={(e) => {
              setFase(e.target.value as "ENVIO" | "RECEBIMENTO");
              chave.current = null;
              setErro(null);
              setDecisaoIdempotencia(null);
            }}
            className={campo}
          >
            <option value="ENVIO" disabled={!!item.dataRetorno}>
              Envio
            </option>
            <option value="RECEBIMENTO" disabled={!item.dataRetorno}>
              Recebimento
            </option>
          </select>
        </label>
      ) : (
        <p>Documento comum do pedido (opcional, um PDF).</p>
      )}
      <label className="grid gap-1">
        Arquivo PDF (até 10 MiB)
        <input
          ref={input}
          type="file"
          accept="application/pdf,.pdf"
          onChange={(e) => {
            setArquivo(e.target.files?.[0] ?? null);
            chave.current = null;
            setErro(null);
            setDecisaoIdempotencia(null);
          }}
          required
          className={campo}
        />
      </label>
      <button
        type="submit"
        disabled={
          !arquivo || ocupado || decisaoIdempotencia?.tipo === "ja_processada"
        }
        className="justify-self-start rounded border px-3 py-2 disabled:opacity-50"
      >
        {ocupado ? "Enviando..." : "Enviar documento"}
      </button>
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
            Anexo não confirmado. O pedido ou retorno já registrado permanece no
            sistema; consulte o detalhe antes de reenviar.
          </p>
        </>
      ) : null}
    </form>
  );
}

function Orcamento({
  pedidoId,
  item,
  onAtualizar,
}: {
  pedidoId: string;
  item: ItemManutencao;
  onAtualizar: () => Promise<void>;
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
  async function buscarFornecedores() {
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
    } catch (e) {
      setErro(e);
    } finally {
      setOcupado(false);
    }
  }
  if (item.dataRetorno) return null;
  return (
    <form
      onSubmit={salvar}
      className="grid gap-3 rounded border p-3 text-sm sm:grid-cols-2"
    >
      <h4 className="font-semibold sm:col-span-2">
        Atualizar orçamento (versão {item.versaoOrcamento})
      </h4>
      <label className="grid gap-1">
        Data do orçamento
        <input
          type="date"
          value={data}
          onChange={(e) => setData(e.target.value)}
          required
          className={campo}
        />
      </label>
      <label className="grid gap-1">
        Valor
        <input
          inputMode="decimal"
          value={valor}
          onChange={(e) => setValor(e.target.value)}
          placeholder="0.00"
          required
          className={campo}
        />
      </label>
      <label className="grid gap-1 sm:col-span-2">
        Descrição
        <input
          value={descricao}
          onChange={(e) => setDescricao(e.target.value)}
          required
          className={campo}
        />
      </label>
      <div className="grid gap-1 sm:col-span-2">
        <label htmlFor={`busca-fornecedor-${item.id}`}>
          Buscar fornecedor ativo
        </label>
        <div className="flex gap-2">
          <input
            id={`busca-fornecedor-${item.id}`}
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className={`${campo} min-w-0 flex-1`}
          />
          <button
            type="button"
            onClick={() => void buscarFornecedores()}
            className="rounded border px-3"
          >
            Buscar
          </button>
        </div>
      </div>
      <label className="grid gap-1 sm:col-span-2">
        Fornecedor
        <select
          value={fornecedorId}
          onChange={(e) => setFornecedorId(e.target.value)}
          className={campo}
        >
          <option value="">Nenhum</option>
          {item.fornecedor &&
          !fornecedores.some((f) => f.id === item.fornecedor?.id) ? (
            <option value={item.fornecedor.id}>
              {item.fornecedor.nome} (vínculo atual)
            </option>
          ) : null}
          {fornecedores.map((f) => (
            <option key={f.id} value={f.id}>
              {f.nome}
            </option>
          ))}
        </select>
      </label>
      <button
        type="submit"
        disabled={ocupado}
        className="justify-self-start rounded border px-3 py-2 disabled:opacity-50"
      >
        {ocupado ? "Salvando..." : "Salvar orçamento"}
      </button>
      {erro ? (
        <div className="sm:col-span-2">
          <ErroManutencao erro={erro} />
        </div>
      ) : null}
    </form>
  );
}

function Retorno({
  pedidoId,
  item,
  dataEnvio,
  onAtualizar,
  onJaProcessada,
}: {
  pedidoId: string;
  item: ItemManutencao;
  dataEnvio: string;
  onAtualizar: () => Promise<void>;
  onJaProcessada: (erro: unknown, decisao: DecisaoIdempotencia) => void;
}) {
  const [data, setData] = useState(hoje);
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
  if (item.dataRetorno) return null;
  return (
    <form
      onSubmit={salvar}
      className="grid gap-3 rounded border p-3 text-sm sm:grid-cols-2"
    >
      <h4 className="font-semibold sm:col-span-2">Registrar retorno</h4>
      <label className="grid gap-1">
        Data de retorno
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
          className={campo}
        />
      </label>
      <label className="grid gap-1">
        Valor realizado
        <input
          inputMode="decimal"
          value={valor}
          onChange={(e) => {
            setValor(e.target.value);
            alterar();
          }}
          required
          placeholder="0.00"
          className={campo}
        />
      </label>
      <label className="grid gap-1 sm:col-span-2">
        Serviço realizado
        <textarea
          rows={2}
          value={descricao}
          onChange={(e) => {
            setDescricao(e.target.value);
            alterar();
          }}
          required
          className={campo}
        />
      </label>
      <label className="grid gap-1">
        Descrição da garantia (opcional)
        <input
          value={garantiaDescricao}
          onChange={(e) => {
            setGarantiaDescricao(e.target.value);
            alterar();
          }}
          className={campo}
        />
      </label>
      <label className="grid gap-1">
        Fim da garantia (opcional)
        <input
          type="date"
          min={data}
          value={garantiaFim}
          onChange={(e) => {
            setGarantiaFim(e.target.value);
            alterar();
          }}
          disabled={!garantiaDescricao.trim()}
          className={campo}
        />
      </label>
      <button
        type="submit"
        disabled={ocupado || decisaoIdempotencia?.tipo === "ja_processada"}
        className="justify-self-start rounded border px-3 py-2 disabled:opacity-50"
      >
        {ocupado ? "Registrando..." : "Confirmar retorno"}
      </button>
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
    </form>
  );
}

export function DetalhePedido({ inicial }: { inicial: ManutencaoDetalhe }) {
  const [pedido, setPedido] = useState(inicial);
  const [erro, setErro] = useState<unknown>(null);
  const [conflitoProcessado, setConflitoProcessado] = useState<{
    erro: unknown;
    decisao: DecisaoIdempotencia;
  } | null>(null);
  const conflitoRef = useRef<HTMLDivElement>(null);
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
            destino={{
              href: "/manutencoes",
              rotulo: "Consultar manutenções",
            }}
          />
        </div>
      ) : null}
      <section className="grid gap-2 rounded-md border bg-white p-4">
        <h2 className="font-semibold">
          Pedido {pedido.numeroRequisicao ?? pedido.id}
        </h2>
        <p className="break-all text-xs">ID: {pedido.id}</p>
        <p>
          Envio: {pedido.dataEnvio} · Situação:{" "}
          {pedido.status === "CONCLUIDA" ? "Concluída" : "Em andamento"}
        </p>
        <p>
          Comissão: {pedido.comissao.nome} · Autor: {pedido.criadoPor.nome}
        </p>
        <p>
          Itens: {pedido.itensRetornados} retornados e {pedido.itensPendentes}{" "}
          pendentes
        </p>
        {pedido.dataRetorno ? (
          <p>Último retorno: {pedido.dataRetorno}</p>
        ) : null}
        {pedido.justificativa ? (
          <p>Justificativa: {pedido.justificativa}</p>
        ) : null}
        <button
          type="button"
          onClick={() => void atualizar()}
          className="justify-self-start rounded border px-3 py-2 text-sm"
        >
          Atualizar dados
        </button>
        {erro ? <ErroManutencao erro={erro} /> : null}
      </section>
      <section className="grid gap-3 rounded-md border bg-white p-4">
        <h3 className="font-semibold">Documentos do pedido</h3>
        <Documentos documentos={pedido.documentos} />
        {!pedido.documentos.length ? (
          <EnviarDocumento
            pedidoId={pedido.id}
            onAtualizar={atualizar}
            onJaProcessada={informarJaProcessada}
          />
        ) : null}
      </section>
      {pedido.itens.map((item) => (
        <section
          key={item.id}
          className="grid gap-4 rounded-md border bg-white p-4"
          aria-labelledby={`item-${item.id}`}
        >
          <h3 id={`item-${item.id}`} className="font-semibold">
            {item.patrimonio.numeroPatrimonio} — {item.patrimonio.descricao}
          </h3>
          <p className="text-sm">
            Tipo: {item.tipo === "CORRETIVA" ? "Corretiva" : "Preventiva"} ·
            Fornecedor: {item.fornecedor?.nome ?? "Não informado"} · Previsão:{" "}
            {item.previsaoRetorno ?? "Não informada"}
          </p>
          {item.descricaoProblema ? (
            <p className="text-sm">Problema: {item.descricaoProblema}</p>
          ) : null}
          <p className="text-sm">
            Situação do bem:{" "}
            {item.patrimonio.status === "EM_MANUTENCAO"
              ? "Em manutenção"
              : item.patrimonio.status}
          </p>
          <div className="grid gap-2 text-sm">
            <h4 className="font-semibold">Orçamentos</h4>
            {item.revisoesOrcamento.length ? (
              <ol className="list-decimal pl-5">
                {item.revisoesOrcamento.map((r) => (
                  <li key={r.id}>
                    Versão {r.versao}: {r.dataOrcamento}, {r.valorOrcamento} —{" "}
                    {r.descricaoOrcamento} (
                    {r.fornecedor?.nome ?? "sem fornecedor"})
                  </li>
                ))}
              </ol>
            ) : (
              <p>Sem orçamento.</p>
            )}
          </div>
          {item.dataRetorno ? (
            <div className="grid gap-1 text-sm">
              <h4 className="font-semibold">Retorno</h4>
              <p>
                Recebido em {item.dataRetorno} por{" "}
                {item.recebidoPor?.nome ?? "Não registrado"}.
              </p>
              <p>Serviço: {item.descricaoServicoRealizado}</p>
              <p>Valor realizado: {item.valorRealizado}</p>
              <p>
                Garantia:{" "}
                {item.garantia
                  ? `${item.garantia.descricao}${item.garantia.dataFim ? ` até ${item.garantia.dataFim}` : ""}`
                  : "Não informada"}
              </p>
            </div>
          ) : null}
          <Orcamento
            key={`${item.id}-${item.versaoOrcamento}`}
            pedidoId={pedido.id}
            item={item}
            onAtualizar={atualizar}
          />
          <Retorno
            key={`retorno-${item.id}-${item.dataRetorno ?? "pendente"}`}
            pedidoId={pedido.id}
            item={item}
            dataEnvio={pedido.dataEnvio}
            onAtualizar={atualizar}
            onJaProcessada={informarJaProcessada}
          />
          <Documentos documentos={item.documentos} />
          <EnviarDocumento
            key={`documento-${item.id}-${item.dataRetorno ?? "pendente"}`}
            pedidoId={pedido.id}
            item={item}
            onAtualizar={atualizar}
            onJaProcessada={informarJaProcessada}
          />
        </section>
      ))}
    </div>
  );
}
