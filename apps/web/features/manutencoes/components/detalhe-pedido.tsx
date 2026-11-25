"use client";

import { Fragment, useEffect, useRef, useState } from "react";
import {
  ChevronDown,
  ChevronUp,
  Download,
  FilePlus2,
  FileText,
  Pencil,
  RotateCcw,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { hojeLocalSaoPaulo } from "@/lib/format/data-hora-sao-paulo";
import type {
  AnexoObservacaoManutencao,
  ItemManutencao,
  ManutencaoDetalhe,
} from "@repo/contracts";
import {
  AtualizarOrcamentoManutencaoBodySchema,
  RegistrarRetornoManutencaoBodySchema,
} from "@repo/contracts";
import { AlertaIdempotencia } from "@/components/alerta-idempotencia";
import { MoneyInput } from "@/components/shared/numeric-inputs";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Combobox } from "@/components/ui/combobox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { browserApiClient } from "@/lib/api/browser-api-client";
import { addDecimal } from "@/lib/format/decimal";
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
const formatarDataHora = (valor: string | null) =>
  valor
    ? new Intl.DateTimeFormat("pt-BR", {
        dateStyle: "short",
        timeStyle: "short",
        timeZone: "America/Sao_Paulo",
      }).format(new Date(valor))
    : "Não informado";

function AnexoObservacao({
  anexo,
}: {
  anexo: AnexoObservacaoManutencao | null;
}) {
  return anexo ? (
    <a
      href={anexo.url}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-2 rounded-md text-sm font-semibold text-primary hover:underline focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-ring"
    >
      <FileText aria-hidden="true" className="size-4" />
      Anexo da observação
      <Download aria-hidden="true" className="size-3.5" />
    </a>
  ) : (
    <p className="text-sm text-foreground/80">Nenhum anexo da observação.</p>
  );
}

function GerenciarAnexoObservacao({
  pedidoId,
  item,
  anexo,
  mutavel,
  onAtualizar,
}: {
  pedidoId: string;
  item?: ItemManutencao;
  anexo: AnexoObservacaoManutencao | null;
  mutavel: boolean;
  onAtualizar: () => Promise<void>;
}) {
  const [arquivo, setArquivo] = useState<File | null>(null);
  const [erro, setErro] = useState<unknown>(null);
  const [ocupado, setOcupado] = useState<
    "anexar" | "substituir" | "remover" | null
  >(null);
  const input = useRef<HTMLInputElement>(null);
  const chave = useRef<string | null>(null);
  async function enviar(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!arquivo || ocupado) return;
    const operacao = anexo ? "substituir" : "anexar";
    setOcupado(operacao);
    setErro(null);
    chave.current ??= crypto.randomUUID();
    try {
      const dados = { chaveIdempotencia: chave.current };
      if (anexo)
        await operacoes.substituirAnexoObservacao(
          pedidoId,
          item?.id ?? null,
          dados,
          arquivo,
        );
      else
        await operacoes.enviarAnexoObservacao(
          pedidoId,
          item?.id ?? null,
          dados,
          arquivo,
        );
      chave.current = null;
      setArquivo(null);
      if (input.current) input.current.value = "";
      await onAtualizar();
      toast.success(
        anexo
          ? "Anexo da observação substituído."
          : "Anexo da observação incluído.",
      );
    } catch (e) {
      setErro(e);
      const decisao = decidirAposFalha(e);
      if (!decisao.manterChave) chave.current = null;
      await onAtualizar();
    } finally {
      setOcupado(null);
    }
  }
  async function remover() {
    if (ocupado) return;
    setOcupado("remover");
    setErro(null);
    try {
      await operacoes.removerAnexoObservacao(pedidoId, item?.id ?? null);
      await onAtualizar();
      toast.success("Anexo da observação removido.");
    } catch (e) {
      setErro(e);
      await onAtualizar();
    } finally {
      setOcupado(null);
    }
  }
  const alvo = item
    ? `o patrimônio ${item.patrimonio.numeroPatrimonio}`
    : "o pedido";
  return (
    <div className="grid gap-3 text-sm">
      <AnexoObservacao anexo={anexo} />
      {mutavel ? (
        <form onSubmit={enviar} className="grid gap-3">
          <label className="grid gap-2">
            {anexo ? "Novo PDF para substituição" : "PDF da observação"} (até 10
            MiB)
            <Input
              ref={input}
              type="file"
              accept="application/pdf,.pdf"
              onChange={(e) => {
                setArquivo(e.target.files?.[0] ?? null);
                chave.current = null;
                setErro(null);
              }}
              required
              disabled={Boolean(ocupado)}
              className={campoManutencao}
            />
          </label>
          <div className="flex flex-wrap gap-2">
            <Button type="submit" disabled={!arquivo || Boolean(ocupado)}>
              <FilePlus2 aria-hidden="true" />
              {ocupado === "anexar"
                ? "Anexando…"
                : ocupado === "substituir"
                  ? "Substituindo…"
                  : anexo
                    ? "Substituir"
                    : "Anexar"}
            </Button>
            {anexo ? (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    type="button"
                    variant="destructive"
                    disabled={Boolean(ocupado)}
                  >
                    <Trash2 aria-hidden="true" /> Remover
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Remover anexo?</AlertDialogTitle>
                    <AlertDialogDescription>
                      O PDF da observação de {alvo} será removido e não poderá
                      mais ser aberto.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction
                      variant="destructive"
                      onClick={() => void remover()}
                    >
                      Confirmar remoção
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            ) : null}
          </div>
        </form>
      ) : anexo ? (
        <p className="text-xs text-muted-foreground">
          O anexo permanece disponível para consulta, mas não pode ser alterado
          após a conclusão deste atendimento.
        </p>
      ) : null}
      {erro ? <ErroManutencao erro={erro} /> : null}
    </div>
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
    item.orcamentoAtual?.dataOrcamento ?? hojeLocalSaoPaulo(),
  );
  const [descricao, setDescricao] = useState(
    item.orcamentoAtual?.descricaoOrcamento ?? "",
  );
  const [valor, setValor] = useState(item.orcamentoAtual?.valorOrcamento ?? "");
  const [fornecedorId, setFornecedorId] = useState(item.fornecedor?.id ?? "");
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
      </div>
      <label className="grid gap-2 sm:col-span-2">
        Fornecedor
        <Combobox
          value={fornecedorId}
          onValueChange={(value) =>
            setFornecedorId(value === "nenhum" ? "" : value)
          }
          options={[
            { value: "nenhum", label: "Nenhum fornecedor" },
            ...(item.fornecedor &&
            !fornecedores.some((f) => f.id === item.fornecedor?.id)
              ? [
                  {
                    value: item.fornecedor.id,
                    label: `${item.fornecedor.nome} (atual)`,
                  },
                ]
              : []),
            ...fornecedores.map((f) => ({ value: f.id, label: f.nome })),
          ]}
          placeholder="Nenhum fornecedor informado"
          searchPlaceholder="Buscar fornecedor"
          emptyText="Nenhum fornecedor ativo encontrado."
        />
      </label>
      <label className="grid gap-2">
        Data do orçamento *
        <Input
          type="date"
          value={data}
          onChange={(e) => setData(e.target.value)}
          required
          className={campoManutencao}
        />
      </label>
      <label className="grid gap-2">
        Valor orçado (R$) *
        <MoneyInput
          value={valor}
          onValueChange={setValor}
          required
          placeholder="R$ 0,00"
        />
      </label>
      <label className="grid gap-2 sm:col-span-2">
        Descrição do orçamento *
        <Textarea
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
      <DialogFooter className="pb-6 sm:col-span-2">
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
  const [data, setData] = useState(hojeLocalSaoPaulo());
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
      garantia:
        garantiaDescricao.trim() || garantiaFim
          ? {
              ...(garantiaDescricao.trim()
                ? { descricao: garantiaDescricao.trim() }
                : {}),
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
        <Input
          type="date"
          min={dataEnvio.slice(0, 10)}
          max={hojeLocalSaoPaulo()}
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
        <MoneyInput
          value={valor}
          onValueChange={(value) => {
            setValor(value);
            alterar();
          }}
          required
          placeholder="R$ 0,00"
        />
      </label>
      <label className="grid gap-2 sm:col-span-2">
        Serviço realizado *
        <Textarea
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
        <Input
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
        <Input
          type="date"
          min={data}
          value={garantiaFim}
          onChange={(e) => {
            setGarantiaFim(e.target.value);
            alterar();
          }}
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
      <DialogFooter className="pb-6 sm:col-span-2">
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
  tipo: "orcamento" | "retorno" | "anexo";
  itemId: string;
} | null;

export function DetalhePedido({ inicial }: { inicial: ManutencaoDetalhe }) {
  const [pedido, setPedido] = useState(inicial);
  const [erro, setErro] = useState<unknown>(null);
  const [acao, setAcao] = useState<Acao>(null);
  const [detalhesAbertos, setDetalhesAbertos] = useState<Set<string>>(
    () => new Set(),
  );
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
                  Pedido #{pedido.numeroPedido}
                </h2>
                <p className="mt-1 text-xs text-[#526580]">Dados do pedido</p>
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
                  {formatarDataHora(pedido.dataEnvio)}
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
                  {formatarDataHora(pedido.dataRetorno)}
                </dd>
              </div>
            </dl>
            {erro ? (
              <div className="mt-4">
                <ErroManutencao erro={erro} />
              </div>
            ) : null}
          </div>
          <aside
            className="rounded-md border border-[#d8e6fb] bg-[#f3f7fe] p-4"
            aria-label="Anexo da observação do pedido"
          >
            <div className="mb-3 flex items-center justify-between gap-2">
              <h3 className="font-semibold">Anexo da observação</h3>
              <FileText aria-hidden="true" className="size-4 text-[#2863ec]" />
            </div>
            <GerenciarAnexoObservacao
              pedidoId={pedido.id}
              anexo={pedido.anexoObservacao}
              mutavel={pedido.status === "EM_ANDAMENTO"}
              onAtualizar={atualizar}
            />
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
            Orçamento, anexo da observação e retorno permanecem individuais.
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
              {pedido.itens.map((item) => {
                const detalhesAbertosItem = detalhesAbertos.has(item.id);
                const detalhesId = `detalhes-atendimento-${item.id}`;
                return (
                  <Fragment key={item.id}>
                    <tr className="border-b border-[#e4eaf2] align-top">
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
                          {item.orcamentoAtual
                            ? "Orçamento informado"
                            : "Não informado"}
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
                            {formatarDataHora(item.dataRetorno)}
                          </p>
                        ) : null}
                      </td>
                      <td className="px-3 py-4">
                        <div className="flex flex-wrap justify-end gap-1">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            aria-expanded={detalhesAbertosItem}
                            aria-controls={detalhesId}
                            onClick={() =>
                              setDetalhesAbertos((atuais) => {
                                const proximos = new Set(atuais);
                                if (proximos.has(item.id))
                                  proximos.delete(item.id);
                                else proximos.add(item.id);
                                return proximos;
                              })
                            }
                          >
                            {detalhesAbertosItem ? (
                              <ChevronUp aria-hidden="true" />
                            ) : (
                              <ChevronDown aria-hidden="true" />
                            )}
                            Ver detalhes
                          </Button>
                          {!item.dataRetorno ? (
                            <>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                  setAcao({
                                    tipo: "orcamento",
                                    itemId: item.id,
                                  })
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
                              setAcao({ tipo: "anexo", itemId: item.id })
                            }
                          >
                            <FilePlus2 aria-hidden="true" /> Anexo
                          </Button>
                        </div>
                      </td>
                    </tr>
                    {detalhesAbertosItem ? (
                      <tr className="border-b border-border bg-muted/30">
                        <td colSpan={7} className="p-3">
                          <div
                            id={detalhesId}
                            className="grid gap-4 rounded-lg border bg-background p-4 lg:grid-cols-2"
                          >
                            <section
                              aria-labelledby={`${detalhesId}-orcamento`}
                            >
                              <h3
                                id={`${detalhesId}-orcamento`}
                                className="font-semibold"
                              >
                                Orçamento atual
                                <span className="sr-only">
                                  {` do patrimônio ${item.patrimonio.numeroPatrimonio}`}
                                </span>
                              </h3>
                              {item.orcamentoAtual ? (
                                <dl className="mt-3 grid gap-3 sm:grid-cols-2">
                                  <div>
                                    <dt className="text-xs text-muted-foreground">
                                      Fornecedor
                                    </dt>
                                    <dd>
                                      {item.orcamentoAtual.fornecedor?.nome ??
                                        "Não informado"}
                                    </dd>
                                  </div>
                                  <div>
                                    <dt className="text-xs text-muted-foreground">
                                      Data
                                    </dt>
                                    <dd>
                                      {formatarDataHora(
                                        item.orcamentoAtual.dataOrcamento,
                                      )}
                                    </dd>
                                  </div>
                                  <div>
                                    <dt className="text-xs text-muted-foreground">
                                      Valor
                                    </dt>
                                    <dd>
                                      {formatarMoeda(
                                        item.orcamentoAtual.valorOrcamento,
                                      )}
                                    </dd>
                                  </div>
                                  <div>
                                    <dt className="text-xs text-muted-foreground">
                                      Registrado por
                                    </dt>
                                    <dd>
                                      {item.orcamentoAtual.registradoPor.nome}
                                    </dd>
                                  </div>
                                  <div className="sm:col-span-2">
                                    <dt className="text-xs text-muted-foreground">
                                      Descrição
                                    </dt>
                                    <dd>
                                      {item.orcamentoAtual.descricaoOrcamento}
                                    </dd>
                                  </div>
                                  <div className="sm:col-span-2">
                                    <dt className="text-xs text-muted-foreground">
                                      Registrado em
                                    </dt>
                                    <dd>
                                      {formatarDataHora(
                                        item.orcamentoAtual.createdAt,
                                      )}
                                    </dd>
                                  </div>
                                </dl>
                              ) : (
                                <p className="mt-3 text-sm text-muted-foreground">
                                  Nenhum orçamento informado.
                                </p>
                              )}
                            </section>
                            <section aria-labelledby={`${detalhesId}-retorno`}>
                              <h3
                                id={`${detalhesId}-retorno`}
                                className="font-semibold"
                              >
                                Retorno
                                <span className="sr-only">
                                  {` do patrimônio ${item.patrimonio.numeroPatrimonio}`}
                                </span>
                              </h3>
                              {item.dataRetorno ? (
                                <dl className="mt-3 grid gap-3 sm:grid-cols-2">
                                  <div>
                                    <dt className="text-xs text-muted-foreground">
                                      Data
                                    </dt>
                                    <dd>
                                      {formatarDataHora(item.dataRetorno)}
                                    </dd>
                                  </div>
                                  <div>
                                    <dt className="text-xs text-muted-foreground">
                                      Valor realizado
                                    </dt>
                                    <dd>
                                      {formatarMoeda(item.valorRealizado)}
                                    </dd>
                                  </div>
                                  <div className="sm:col-span-2">
                                    <dt className="text-xs text-muted-foreground">
                                      Serviço realizado
                                    </dt>
                                    <dd>
                                      {item.descricaoServicoRealizado ??
                                        "Não informado"}
                                    </dd>
                                  </div>
                                  <div>
                                    <dt className="text-xs text-muted-foreground">
                                      Garantia
                                    </dt>
                                    <dd>
                                      {item.garantia?.descricao ??
                                        "Descrição não informada"}
                                    </dd>
                                  </div>
                                  <div>
                                    <dt className="text-xs text-muted-foreground">
                                      Término da garantia
                                    </dt>
                                    <dd>
                                      {item.garantia?.dataFim
                                        ? formatarDataCivil(
                                            item.garantia.dataFim,
                                          )
                                        : "Não informado"}
                                    </dd>
                                  </div>
                                  <div>
                                    <dt className="text-xs text-muted-foreground">
                                      Recebido por
                                    </dt>
                                    <dd>
                                      {item.recebidoPor?.nome ??
                                        "Não informado"}
                                    </dd>
                                  </div>
                                  <div>
                                    <dt className="text-xs text-muted-foreground">
                                      Registrado em
                                    </dt>
                                    <dd>{formatarDataHora(item.recebidoEm)}</dd>
                                  </div>
                                </dl>
                              ) : (
                                <p className="mt-3 text-sm text-muted-foreground">
                                  O item ainda não possui retorno.
                                </p>
                              )}
                            </section>
                          </div>
                        </td>
                      </tr>
                    ) : null}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="mt-5 flex justify-end border-t border-[#e4eaf2] pt-4">
          <p className="text-sm font-semibold">
            Total realizado:{" "}
            {formatarMoeda(
              pedido.itens.reduce(
                (total, item) => addDecimal(total, item.valorRealizado ?? "0"),
                "0",
              ),
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
                Atualize os dados atuais do orçamento deste atendimento.
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
        open={acao?.tipo === "anexo"}
        onOpenChange={(aberto) => {
          if (!aberto) setAcao(null);
        }}
      >
        {acao?.tipo === "anexo" && itemAcao ? (
          <DialogContent className="max-w-xl pb-6">
            <DialogHeader>
              <DialogTitle>Anexo da observação do atendimento</DialogTitle>
              <DialogDescription>
                {itemAcao.patrimonio.numeroPatrimonio} ·{" "}
                {itemAcao.patrimonio.descricao}
              </DialogDescription>
            </DialogHeader>
            <GerenciarAnexoObservacao
              pedidoId={pedido.id}
              item={itemAcao}
              anexo={itemAcao.anexoObservacao}
              mutavel={
                pedido.status === "EM_ANDAMENTO" && !itemAcao.dataRetorno
              }
              onAtualizar={atualizar}
            />
          </DialogContent>
        ) : null}
      </Dialog>
    </div>
  );
}
