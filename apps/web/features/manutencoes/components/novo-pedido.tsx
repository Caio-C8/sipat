"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Check,
  ChevronDown,
  FileText,
  PackagePlus,
  Search,
  Trash2,
  Upload,
} from "lucide-react";
import {
  CriarManutencaoBodySchema,
  type CriarManutencaoBodyInput,
} from "@repo/contracts";
import { AlertaIdempotencia } from "@/components/alerta-idempotencia";
import { ComboboxField } from "@/components/shared/form-fields";
import { MoneyInput } from "@/components/shared/numeric-inputs";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { browserApiClient } from "@/lib/api/browser-api-client";
import {
  decidirAposFalha,
  isConflitoIdempotencia,
  type DecisaoIdempotencia,
} from "@/lib/api/core/idempotencia";
import { campoManutencao, painelManutencao } from "../apresentacao";
import { criarOperacoesManutencoes } from "../api/manutencao-operations";
import { ErroManutencao } from "./erro-manutencao";
import { toast } from "sonner";

const operacoes = criarOperacoesManutencoes(browserApiClient);
type Opcao = { id: string; nome: string };
type Bem = { id: string; numeroPatrimonio: string; descricao: string };
type ItemForm = {
  patrimonioId: string;
  numero: string;
  descricao: string;
  tipo: "PREVENTIVA" | "CORRETIVA";
  fornecedorId: string;
  previsaoRetorno: string;
  descricaoProblema: string;
  dataOrcamento: string;
  descricaoOrcamento: string;
  valorOrcamento: string;
};
type ErrosItem = Partial<Record<keyof ItemForm, string>>;

const hoje = () =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
const novoItem = (bem: Bem): ItemForm => ({
  patrimonioId: bem.id,
  numero: bem.numeroPatrimonio,
  descricao: bem.descricao,
  tipo: "CORRETIVA",
  fornecedorId: "",
  previsaoRetorno: "",
  descricaoProblema: "",
  dataOrcamento: "",
  descricaoOrcamento: "",
  valorOrcamento: "",
});

export function NovoPedido() {
  const router = useRouter();
  const [dataEnvio, setDataEnvio] = useState(hoje);
  const [comissaoId, setComissaoId] = useState("");
  const [justificativa, setJustificativa] = useState("");
  const [arquivo, setArquivo] = useState<File | null>(null);
  const [itens, setItens] = useState<ItemForm[]>([]);
  const [comissoes, setComissoes] = useState<Opcao[]>([]);
  const [fornecedores, setFornecedores] = useState<Opcao[]>([]);
  const [bens, setBens] = useState<Bem[]>([]);
  const [buscaBem, setBuscaBem] = useState("");
  const [buscaComissao, setBuscaComissao] = useState("");
  const [carregandoComissoes, setCarregandoComissoes] = useState(false);
  const [seletorAberto, setSeletorAberto] = useState(false);
  const [configurando, setConfigurando] = useState<number | null>(null);
  const [errosItens, setErrosItens] = useState<Record<number, ErrosItem>>({});
  const [erro, setErro] = useState<unknown>(null);
  const [aviso, setAviso] = useState("");
  const [pedidoCriadoId, setPedidoCriadoId] = useState<string | null>(null);
  const [decisaoIdempotencia, setDecisaoIdempotencia] =
    useState<DecisaoIdempotencia | null>(null);
  const [ocupado, setOcupado] = useState(false);
  const chave = useRef<string | null>(null);
  const enviando = useRef(false);
  const acionadorSeletor = useRef<HTMLButtonElement>(null);
  const secoesItens = useRef(new Map<number, HTMLDivElement>());

  const alterar = () => {
    chave.current = null;
    setAviso("");
    setErro(null);
    setDecisaoIdempotencia(null);
    setErrosItens({});
  };
  async function carregarBens(busca = "") {
    try {
      const resposta = await operacoes.patrimonios({
        status: "ATIVO",
        ...(busca.trim() ? { busca: busca.trim() } : {}),
        limite: "50",
      });
      setBens(
        resposta.dados.map((bem) => ({
          id: bem.id,
          numeroPatrimonio: bem.numeroPatrimonio,
          descricao: bem.descricao,
        })),
      );
      setErro(null);
    } catch (e) {
      setErro(e);
    }
  }
  useEffect(() => {
    let ativo = true;
    void Promise.all([
      operacoes.patrimonios({ status: "ATIVO", limite: "50" }),
      operacoes.fornecedores({ limite: "50" }),
    ])
      .then(([respostaBens, respostaFornecedores]) => {
        if (!ativo) return;
        setBens(
          respostaBens.dados.map((bem) => ({
            id: bem.id,
            numeroPatrimonio: bem.numeroPatrimonio,
            descricao: bem.descricao,
          })),
        );
        setFornecedores(respostaFornecedores.dados);
      })
      .catch((e: unknown) => {
        if (ativo) setErro(e);
      });
    return () => {
      ativo = false;
    };
  }, []);
  useEffect(() => {
    if (!dataEnvio) return;
    const controller = new AbortController();
    const timer = window.setTimeout(
      () => {
        setCarregandoComissoes(true);
        void operacoes
          .comissoes(
            {
              dataEnvio,
              ...(buscaComissao.trim() ? { busca: buscaComissao.trim() } : {}),
              limite: "50",
            },
            { signal: controller.signal },
          )
          .then((resposta) => {
            if (!controller.signal.aborted) {
              setComissoes(resposta.dados);
              setErro(null);
            }
          })
          .catch((e: unknown) => {
            if (!controller.signal.aborted) setErro(e);
          })
          .finally(() => {
            if (!controller.signal.aborted) setCarregandoComissoes(false);
          });
      },
      buscaComissao.trim() ? 250 : 0,
    );
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [buscaComissao, dataEnvio]);

  function alternarBem(bem: Bem) {
    setItens((atuais) =>
      atuais.some((item) => item.patrimonioId === bem.id)
        ? atuais.filter((item) => item.patrimonioId !== bem.id)
        : atuais.length < 50
          ? [...atuais, novoItem(bem)]
          : atuais,
    );
    alterar();
  }
  function atualizarItem(indice: number, alteracoes: Partial<ItemForm>) {
    setItens((atuais) =>
      atuais.map((item, i) =>
        i === indice ? { ...item, ...alteracoes } : item,
      ),
    );
    alterar();
  }

  async function enviar(evento: React.FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    if (enviando.current || pedidoCriadoId) return;
    const body: CriarManutencaoBodyInput = {
      chaveIdempotencia: chave.current ?? crypto.randomUUID(),
      dataEnvio,
      comissaoId,
      ...(justificativa.trim() ? { justificativa: justificativa.trim() } : {}),
      itens: itens.map((item) => ({
        patrimonioId: item.patrimonioId,
        tipo: item.tipo,
        ...(item.fornecedorId ? { fornecedorId: item.fornecedorId } : {}),
        ...(item.previsaoRetorno
          ? { previsaoRetorno: item.previsaoRetorno }
          : {}),
        ...(item.descricaoProblema.trim()
          ? { descricaoProblema: item.descricaoProblema.trim() }
          : {}),
        ...(item.dataOrcamento || item.descricaoOrcamento || item.valorOrcamento
          ? {
              orcamentoInicial: {
                dataOrcamento: item.dataOrcamento,
                descricaoOrcamento: item.descricaoOrcamento,
                valorOrcamento: item.valorOrcamento,
              },
            }
          : {}),
      })),
    };
    const validacao = CriarManutencaoBodySchema.safeParse(body);
    if (!validacao.success) {
      const porItem: Record<number, ErrosItem> = {};
      for (const issue of validacao.error.issues) {
        const [grupo, indice, subgrupo, campo] = issue.path;
        if (grupo !== "itens" || typeof indice !== "number") continue;
        const destino =
          subgrupo === "orcamentoInicial" && typeof campo === "string"
            ? (
                {
                  dataOrcamento: "dataOrcamento",
                  descricaoOrcamento: "descricaoOrcamento",
                  valorOrcamento: "valorOrcamento",
                } as const
              )[campo as "dataOrcamento"]
            : typeof subgrupo === "string"
              ? subgrupo
              : undefined;
        if (destino)
          porItem[indice] = {
            ...porItem[indice],
            [destino]: issue.message,
          };
      }
      setErrosItens(porItem);
      const primeiro = Object.keys(porItem)
        .map(Number)
        .sort((a, b) => a - b)[0];
      if (primeiro !== undefined) {
        setConfigurando(primeiro);
        requestAnimationFrame(() => secoesItens.current.get(primeiro)?.focus());
      }
      setErro(
        primeiro === undefined
          ? validacao.error.issues.map((issue) => issue.message).join(" ")
          : "Revise os campos destacados no primeiro item aberto antes de criar o pedido.",
      );
      return;
    }
    chave.current = body.chaveIdempotencia;
    enviando.current = true;
    setOcupado(true);
    setErro(null);
    setAviso("");
    setDecisaoIdempotencia(null);
    try {
      const resposta = await operacoes.criar(body);
      const id = resposta.dados.id;
      chave.current = null;
      if (arquivo) {
        try {
          await operacoes.enviarAnexoObservacao(
            id,
            null,
            { chaveIdempotencia: crypto.randomUUID() },
            arquivo,
          );
        } catch (e) {
          setPedidoCriadoId(id);
          setErro(e);
          setAviso(
            "O pedido foi criado, mas o PDF não teve envio confirmado. Abra o detalhe para consultar o pedido e anexar o documento sem repetir a criação.",
          );
          return;
        }
      }
      toast.success(resposta.mensagem);
      router.push(`/manutencoes/${id}`);
    } catch (e) {
      const decisao = decidirAposFalha(e);
      setErro(e);
      setDecisaoIdempotencia(isConflitoIdempotencia(e) ? decisao : null);
      if (!decisao.manterChave) chave.current = null;
      if (decisao.atualizarConsultas) router.refresh();
      if (!isConflitoIdempotencia(e))
        setAviso(
          "O formulário foi preservado. Se a resposta se perdeu, consulte a lista antes de reenviar.",
        );
    } finally {
      enviando.current = false;
      setOcupado(false);
    }
  }

  const itemCompleto = (item: ItemForm) => {
    const camposOrcamento = [
      item.dataOrcamento,
      item.descricaoOrcamento.trim(),
      item.valorOrcamento,
    ];
    return (
      camposOrcamento.every(Boolean) || camposOrcamento.every((valor) => !valor)
    );
  };

  return (
    <form onSubmit={enviar} className="grid gap-5" noValidate>
      <section
        className={painelManutencao}
        aria-labelledby="dados-pedido-title"
      >
        <div className="mb-4 flex items-start gap-3">
          <span className="grid size-8 shrink-0 place-items-center rounded-md bg-[#eef4ff] font-bold text-[#2863ec]">
            1
          </span>
          <div>
            <h2 id="dados-pedido-title" className="font-bold">
              Dados do pedido
            </h2>
            <p className="mt-1 text-xs text-[#526580]">
              A comissão precisa estar vigente na data de envio.
            </p>
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <label className="grid gap-2 text-sm">
            Data de envio *
            <Input
              type="date"
              value={dataEnvio}
              max={hoje()}
              onChange={(e) => {
                setDataEnvio(e.target.value);
                setComissaoId("");
                setBuscaComissao("");
                alterar();
              }}
              required
              className={campoManutencao}
            />
          </label>
          <ComboboxField
            id="comissao-responsavel"
            label="Comissão responsável"
            required
            value={comissaoId}
            onValueChange={(value) => {
              setComissaoId(value);
              alterar();
            }}
            onSearchChange={setBuscaComissao}
            options={comissoes.map((opcao) => ({
              value: opcao.id,
              label: opcao.nome,
            }))}
            loading={carregandoComissoes}
            placeholder="Selecione uma comissão"
            searchPlaceholder="Buscar comissão…"
            emptyText="Nenhuma comissão vigente encontrada."
          />
        </div>
      </section>

      <section className={painelManutencao} aria-labelledby="bens-title">
        <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <span className="grid size-8 shrink-0 place-items-center rounded-md bg-[#eef4ff] font-bold text-[#2863ec]">
              2
            </span>
            <div>
              <h2 id="bens-title" className="font-bold">
                Bens deste pedido
              </h2>
              <p className="mt-1 text-xs text-[#526580]">
                Selecione até 50 bens e configure o atendimento individual.
              </p>
            </div>
          </div>
          <Button
            ref={acionadorSeletor}
            type="button"
            variant="outline"
            className="gap-2"
            onClick={() => setSeletorAberto(true)}
          >
            <PackagePlus aria-hidden="true" /> Adicionar bens
          </Button>
        </div>
        {itens.length ? (
          <div className="grid gap-3" aria-label="Bens selecionados">
            {itens.map((item, indice) => {
              const aberto = configurando === indice;
              const erros = errosItens[indice] ?? {};
              const erroId = (campo: keyof ItemForm) =>
                `item-${indice}-${campo}-erro`;
              return (
                <article
                  key={item.patrimonioId}
                  className="rounded-lg border border-[#dce4ef] bg-white"
                >
                  <div className="flex flex-wrap items-center gap-3 p-4">
                    <button
                      type="button"
                      className="flex min-w-0 flex-1 items-center gap-3 rounded text-left focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[#D4A017]"
                      aria-expanded={aberto}
                      aria-controls={`item-${indice}-dados`}
                      onClick={() => setConfigurando(aberto ? null : indice)}
                    >
                      <ChevronDown
                        aria-hidden="true"
                        className={`size-4 shrink-0 transition-transform ${aberto ? "rotate-180" : ""}`}
                      />
                      <span className="min-w-0">
                        <strong className="block truncate">
                          {item.numero} · {item.descricao}
                        </strong>
                        <span className="mt-1 block text-xs text-[#526580]">
                          {item.tipo === "CORRETIVA"
                            ? "Corretiva"
                            : "Preventiva"}
                          {item.previsaoRetorno
                            ? ` · retorno previsto em ${item.previsaoRetorno}`
                            : " · sem previsão de retorno"}
                        </span>
                      </span>
                    </button>
                    <span
                      className={`rounded-full border px-2 py-1 text-xs font-semibold ${itemCompleto(item) && !Object.keys(erros).length ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-red-200 bg-red-50 text-red-700"}`}
                    >
                      {itemCompleto(item) && !Object.keys(erros).length
                        ? "Pronto"
                        : "Revisar item"}
                    </span>
                    <Button
                      type="button"
                      size="icon-sm"
                      variant="ghost"
                      onClick={() => {
                        setItens((atuais) =>
                          atuais.filter((_, i) => i !== indice),
                        );
                        setConfigurando(null);
                        alterar();
                      }}
                    >
                      <Trash2 aria-hidden="true" />
                      <span className="sr-only">Remover {item.numero}</span>
                    </Button>
                  </div>
                  {aberto ? (
                    <div
                      id={`item-${indice}-dados`}
                      ref={(elemento) => {
                        if (elemento) secoesItens.current.set(indice, elemento);
                        else secoesItens.current.delete(indice);
                      }}
                      tabIndex={-1}
                      className="grid gap-4 border-t border-[#e4eaf2] bg-[#fbfcfe] p-4 outline-none sm:grid-cols-2"
                    >
                      <label className="grid gap-2 text-sm">
                        Fornecedor / prestador
                        <Combobox
                          value={item.fornecedorId}
                          onValueChange={(value) =>
                            atualizarItem(indice, {
                              fornecedorId: value === "nenhum" ? "" : value,
                            })
                          }
                          options={[
                            { value: "nenhum", label: "Não informado" },
                            ...fornecedores.map((opcao) => ({
                              value: opcao.id,
                              label: opcao.nome,
                            })),
                          ]}
                          placeholder="Não informado"
                          searchPlaceholder="Buscar fornecedor"
                          emptyText="Nenhum fornecedor ativo encontrado."
                        />
                      </label>
                      <label className="grid gap-2 text-sm">
                        Tipo de manutenção *
                        <Select
                          value={item.tipo}
                          onValueChange={(value) =>
                            atualizarItem(indice, {
                              tipo: value as ItemForm["tipo"],
                            })
                          }
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent position="popper">
                            <SelectItem value="CORRETIVA">Corretiva</SelectItem>
                            <SelectItem value="PREVENTIVA">
                              Preventiva
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </label>
                      <label className="grid gap-2 text-sm">
                        Previsão de retorno
                        <Input
                          type="date"
                          min={dataEnvio}
                          value={item.previsaoRetorno}
                          onChange={(e) =>
                            atualizarItem(indice, {
                              previsaoRetorno: e.target.value,
                            })
                          }
                          className={campoManutencao}
                        />
                      </label>
                      <label className="grid gap-2 text-sm sm:col-span-2">
                        Problema identificado
                        <Textarea
                          rows={3}
                          value={item.descricaoProblema}
                          onChange={(e) =>
                            atualizarItem(indice, {
                              descricaoProblema: e.target.value,
                            })
                          }
                          className={campoManutencao}
                        />
                      </label>
                      <div className="sm:col-span-2">
                        <p className="font-semibold">
                          Orçamento inicial opcional
                        </p>
                        <p className="mt-1 text-xs text-[#526580]">
                          Ao começar o orçamento, preencha os três campos.
                        </p>
                      </div>
                      <label className="grid gap-2 text-sm">
                        Valor orçado (R$)
                        <MoneyInput
                          value={item.valorOrcamento}
                          onValueChange={(value) =>
                            atualizarItem(indice, {
                              valorOrcamento: value,
                            })
                          }
                          placeholder="R$ 0,00"
                          aria-invalid={Boolean(erros.valorOrcamento)}
                          aria-describedby={
                            erros.valorOrcamento
                              ? erroId("valorOrcamento")
                              : undefined
                          }
                          className={campoManutencao}
                        />
                        {erros.valorOrcamento ? (
                          <span
                            id={erroId("valorOrcamento")}
                            className="text-xs text-red-700"
                          >
                            {erros.valorOrcamento}
                          </span>
                        ) : null}
                      </label>
                      <label className="grid gap-2 text-sm">
                        Data do orçamento
                        <Input
                          type="date"
                          value={item.dataOrcamento}
                          onChange={(e) =>
                            atualizarItem(indice, {
                              dataOrcamento: e.target.value,
                            })
                          }
                          aria-invalid={Boolean(erros.dataOrcamento)}
                          aria-describedby={
                            erros.dataOrcamento
                              ? erroId("dataOrcamento")
                              : undefined
                          }
                          className={campoManutencao}
                        />
                        {erros.dataOrcamento ? (
                          <span
                            id={erroId("dataOrcamento")}
                            className="text-xs text-red-700"
                          >
                            {erros.dataOrcamento}
                          </span>
                        ) : null}
                      </label>
                      <label className="grid gap-2 text-sm sm:col-span-2">
                        Descrição do orçamento
                        <Textarea
                          rows={2}
                          value={item.descricaoOrcamento}
                          onChange={(e) =>
                            atualizarItem(indice, {
                              descricaoOrcamento: e.target.value,
                            })
                          }
                          aria-invalid={Boolean(erros.descricaoOrcamento)}
                          aria-describedby={
                            erros.descricaoOrcamento
                              ? erroId("descricaoOrcamento")
                              : undefined
                          }
                          className={campoManutencao}
                        />
                        {erros.descricaoOrcamento ? (
                          <span
                            id={erroId("descricaoOrcamento")}
                            className="text-xs text-red-700"
                          >
                            {erros.descricaoOrcamento}
                          </span>
                        ) : null}
                      </label>
                    </div>
                  ) : null}
                </article>
              );
            })}
          </div>
        ) : (
          <div className="grid min-h-40 place-items-center rounded-md border border-dashed border-[#cfd9e7] bg-[#fbfcfe] p-6 text-center">
            <div>
              <PackagePlus
                aria-hidden="true"
                className="mx-auto size-7 text-[#93a3b8]"
              />
              <p className="mt-3 font-semibold">Nenhum bem adicionado</p>
              <p className="mt-1 text-sm text-[#526580]">
                Clique em “Adicionar bens” para montar o pedido.
              </p>
            </div>
          </div>
        )}
      </section>

      <section className={painelManutencao} aria-labelledby="motivo-title">
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(18rem,0.42fr)]">
          <div>
            <div className="mb-4 flex items-start gap-3">
              <span className="grid size-8 shrink-0 place-items-center rounded-md bg-[#eef4ff] font-bold text-[#2863ec]">
                3
              </span>
              <div>
                <h2 id="motivo-title" className="font-bold">
                  Motivo e observações
                </h2>
                <p className="mt-1 text-xs text-[#526580]">
                  Contexto geral opcional para o pedido.
                </p>
              </div>
            </div>
            <Textarea
              value={justificativa}
              onChange={(e) => {
                setJustificativa(e.target.value);
                alterar();
              }}
              maxLength={10000}
              rows={4}
              className={campoManutencao}
              placeholder="Descreva informações gerais que se aplicam ao pedido"
            />
          </div>
          <div className="rounded-md border border-[#d8e6fb] bg-[#f3f7fe] p-4">
            <div className="flex items-center gap-2 font-semibold">
              <FileText aria-hidden="true" className="size-4 text-[#2863ec]" />{" "}
              Anexo da observação
            </div>
            <p className="mt-2 text-xs text-[#526580]">
              Um único PDF opcional, vinculado à observação geral do pedido.
            </p>
            <label className="mt-4 grid gap-2 text-sm">
              Selecionar PDF
              <Input
                type="file"
                accept="application/pdf,.pdf"
                className={campoManutencao}
                onChange={(e) => {
                  setArquivo(e.target.files?.[0] ?? null);
                  alterar();
                }}
              />
            </label>
            {arquivo ? (
              <p className="mt-2 flex items-center gap-1 text-xs text-emerald-700">
                <Check aria-hidden="true" className="size-3.5" /> {arquivo.name}
              </p>
            ) : null}
          </div>
        </div>
      </section>

      {erro && decisaoIdempotencia ? (
        <AlertaIdempotencia
          erro={erro}
          decisao={decisaoIdempotencia}
          destino={{ href: "/manutencoes", rotulo: "Consultar manutenções" }}
        />
      ) : erro ? (
        <ErroManutencao erro={erro} />
      ) : null}
      {aviso ? (
        <div
          role="status"
          className="rounded-md border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900"
        >
          <p>{aviso}</p>
          {pedidoCriadoId ? (
            <Button asChild className="mt-3">
              <Link href={`/manutencoes/${pedidoCriadoId}`}>
                Abrir pedido criado
              </Link>
            </Button>
          ) : null}
        </div>
      ) : null}
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#dce4ef] pt-5">
        <Button asChild variant="outline">
          <Link href="/manutencoes">Cancelar</Link>
        </Button>
        <Button
          type="submit"
          disabled={
            ocupado ||
            itens.length === 0 ||
            !!pedidoCriadoId ||
            decisaoIdempotencia?.tipo === "ja_processada"
          }
          className="h-10 gap-2 bg-[#173d6b] px-6 hover:bg-[#0f315c]"
        >
          <Upload aria-hidden="true" />{" "}
          {ocupado ? "Criando pedido…" : "Criar pedido"}
        </Button>
      </div>

      <Dialog open={seletorAberto} onOpenChange={setSeletorAberto}>
        <DialogContent
          className="grid max-h-[min(90vh,48rem)] max-w-3xl grid-rows-[auto_minmax(0,1fr)_auto] gap-0 overflow-hidden p-0"
          onCloseAutoFocus={(evento) => {
            evento.preventDefault();
            acionadorSeletor.current?.focus();
          }}
        >
          <DialogHeader className="border-b border-[#e4eaf2] p-6 pb-4">
            <DialogTitle className="text-xl text-[#19355d]">
              Adicionar bens ao pedido
            </DialogTitle>
            <DialogDescription>
              Selecione os patrimônios que compartilharão o mesmo pedido.
            </DialogDescription>
          </DialogHeader>
          <div className="grid min-h-0 gap-4 overflow-y-auto px-6 py-4">
            <label className="grid gap-2 text-sm">
              Placa, código ou descrição
              <div className="flex gap-2">
                <Input
                  value={buscaBem}
                  onChange={(e) => setBuscaBem(e.target.value)}
                  className={campoManutencao}
                />
                <Button
                  type="button"
                  onClick={() => void carregarBens(buscaBem)}
                >
                  <Search aria-hidden="true" /> Buscar
                </Button>
              </div>
            </label>
            <div className="divide-y divide-[#e4eaf2] rounded-md border border-[#dce4ef]">
              {bens.map((bem) => {
                const selecionado = itens.some(
                  (item) => item.patrimonioId === bem.id,
                );
                return (
                  <label
                    key={bem.id}
                    className="flex cursor-pointer items-start gap-4 p-4 hover:bg-[#fbfcfe]"
                  >
                    <Checkbox
                      className="mt-1"
                      checked={selecionado}
                      onCheckedChange={() => alternarBem(bem)}
                      disabled={!selecionado && itens.length >= 50}
                    />
                    <span>
                      <strong>
                        {bem.numeroPatrimonio} · {bem.descricao}
                      </strong>
                      <span className="mt-1 block text-xs text-emerald-700">
                        Disponível para envio
                      </span>
                    </span>
                  </label>
                );
              })}
              {!bens.length ? (
                <p className="p-6 text-center text-sm text-[#526580]">
                  Nenhum patrimônio ativo encontrado.
                </p>
              ) : null}
            </div>
          </div>
          <DialogFooter className="sticky bottom-0 z-10 border-t border-border bg-background px-6 pt-4 pb-6 shadow-[0_-8px_16px_-16px_rgba(15,23,42,0.5)]">
            <span className="mr-auto text-sm text-[#526580]">
              {itens.length} selecionado(s)
            </span>
            <Button type="button" onClick={() => setSeletorAberto(false)}>
              Confirmar seleção
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </form>
  );
}
