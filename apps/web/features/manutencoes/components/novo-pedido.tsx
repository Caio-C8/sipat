"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Check,
  FileText,
  PackagePlus,
  Pencil,
  Search,
  Trash2,
  Upload,
} from "lucide-react";
import {
  CriarManutencaoBodySchema,
  type CriarManutencaoBodyInput,
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
import { campoManutencao, painelManutencao } from "../apresentacao";
import { criarOperacoesManutencoes } from "../api/manutencao-operations";
import { ErroManutencao } from "./erro-manutencao";

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
  const [buscaFornecedor, setBuscaFornecedor] = useState("");
  const [seletorAberto, setSeletorAberto] = useState(false);
  const [configurando, setConfigurando] = useState<number | null>(null);
  const [erro, setErro] = useState<unknown>(null);
  const [aviso, setAviso] = useState("");
  const [pedidoCriadoId, setPedidoCriadoId] = useState<string | null>(null);
  const [decisaoIdempotencia, setDecisaoIdempotencia] =
    useState<DecisaoIdempotencia | null>(null);
  const [ocupado, setOcupado] = useState(false);
  const chave = useRef<string | null>(null);
  const enviando = useRef(false);
  const acionadorSeletor = useRef<HTMLButtonElement>(null);

  const alterar = () => {
    chave.current = null;
    setAviso("");
    setErro(null);
    setDecisaoIdempotencia(null);
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
  async function carregarComissoes(busca = "", data = dataEnvio) {
    try {
      const resposta = await operacoes.comissoes({
        dataEnvio: data,
        ...(busca.trim() ? { busca: busca.trim() } : {}),
        limite: "50",
      });
      setComissoes(resposta.dados);
      setErro(null);
    } catch (e) {
      setErro(e);
    }
  }
  async function carregarFornecedores(busca = "") {
    try {
      const resposta = await operacoes.fornecedores({
        ...(busca.trim() ? { busca: busca.trim() } : {}),
        limite: "50",
      });
      setFornecedores(resposta.dados);
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
    let ativo = true;
    void operacoes
      .comissoes({ dataEnvio, limite: "50" })
      .then((resposta) => {
        if (ativo) setComissoes(resposta.dados);
      })
      .catch((e: unknown) => {
        if (ativo) setErro(e);
      });
    return () => {
      ativo = false;
    };
  }, [dataEnvio]);

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
      setErro(
        validacao.error.issues
          .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
          .join(" "),
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
          await operacoes.enviarDocumento(
            id,
            { chaveIdempotencia: crypto.randomUUID(), fase: "PEDIDO" },
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

  const itemConfigurado = (item: ItemForm) =>
    Boolean(
      item.fornecedorId ||
      item.previsaoRetorno ||
      item.descricaoProblema.trim() ||
      item.dataOrcamento,
    );

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
            <input
              type="date"
              value={dataEnvio}
              max={hoje()}
              onChange={(e) => {
                setDataEnvio(e.target.value);
                setComissaoId("");
                alterar();
              }}
              required
              className={campoManutencao}
            />
          </label>
          <label className="grid gap-2 text-sm">
            Comissão responsável *
            <select
              value={comissaoId}
              onChange={(e) => {
                setComissaoId(e.target.value);
                alterar();
              }}
              required
              className={campoManutencao}
            >
              <option value="">Selecione</option>
              {comissoes.map((opcao) => (
                <option key={opcao.id} value={opcao.id}>
                  {opcao.nome}
                </option>
              ))}
            </select>
          </label>
          <div className="grid gap-2 text-sm">
            <label htmlFor="busca-comissao">Buscar comissão</label>
            <div className="flex gap-2">
              <input
                id="busca-comissao"
                value={buscaComissao}
                onChange={(e) => setBuscaComissao(e.target.value)}
                className={campoManutencao}
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => void carregarComissoes(buscaComissao)}
              >
                <Search aria-hidden="true" />
                <span className="sr-only">Buscar comissão</span>
              </Button>
            </div>
          </div>
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
          <div
            className="overflow-x-auto"
            role="region"
            aria-label="Bens selecionados"
            tabIndex={0}
          >
            <table className="w-full min-w-[48rem] text-left text-sm">
              <thead className="bg-[#f7f9fc] text-[11px] font-semibold tracking-wide text-[#526580] uppercase">
                <tr>
                  <th className="px-3 py-3">Patrimônio / bem</th>
                  <th className="px-3 py-3">Fornecedor</th>
                  <th className="px-3 py-3">Tipo</th>
                  <th className="px-3 py-3">Previsão</th>
                  <th className="px-3 py-3">Configuração</th>
                  <th className="px-3 py-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                {itens.map((item, indice) => (
                  <tr
                    key={item.patrimonioId}
                    className="border-b border-[#e4eaf2]"
                  >
                    <td className="px-3 py-4">
                      <strong>
                        {item.numero} · {item.descricao}
                      </strong>
                      <p className="mt-1 text-xs text-[#526580]">
                        {item.descricaoProblema ||
                          "Problema ainda não descrito"}
                      </p>
                    </td>
                    <td className="px-3 py-4">
                      {fornecedores.find((f) => f.id === item.fornecedorId)
                        ?.nome ?? "Não informado"}
                    </td>
                    <td className="px-3 py-4">
                      {item.tipo === "CORRETIVA" ? "Corretiva" : "Preventiva"}
                    </td>
                    <td className="px-3 py-4">
                      {item.previsaoRetorno || "Não informada"}
                    </td>
                    <td className="px-3 py-4">
                      <span
                        className={`inline-flex rounded-full border px-2 py-1 text-xs font-semibold ${itemConfigurado(item) ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-amber-200 bg-amber-50 text-amber-700"}`}
                      >
                        {itemConfigurado(item) ? "Configurado" : "Pendente"}
                      </span>
                    </td>
                    <td className="px-3 py-4 text-right">
                      <div className="inline-flex gap-1">
                        <Button
                          type="button"
                          size="icon-sm"
                          variant="outline"
                          onClick={() => setConfigurando(indice)}
                        >
                          <Pencil aria-hidden="true" />
                          <span className="sr-only">
                            Configurar {item.numero}
                          </span>
                        </Button>
                        <Button
                          type="button"
                          size="icon-sm"
                          variant="ghost"
                          onClick={() => {
                            setItens((atuais) =>
                              atuais.filter((_, i) => i !== indice),
                            );
                            alterar();
                          }}
                        >
                          <Trash2 aria-hidden="true" />
                          <span className="sr-only">Remover {item.numero}</span>
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
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
            <textarea
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
              Documento do pedido
            </div>
            <p className="mt-2 text-xs text-[#526580]">
              PDF opcional. O pedido é criado primeiro e o arquivo é enviado em
              seguida.
            </p>
            <label className="mt-4 grid gap-2 text-sm">
              Selecionar PDF
              <input
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
          className="max-h-[min(90vh,48rem)] max-w-3xl overflow-y-auto p-0"
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
          <div className="grid gap-4 px-6">
            <label className="grid gap-2 text-sm">
              Placa, código ou descrição
              <div className="flex gap-2">
                <input
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
                    <input
                      type="checkbox"
                      className="mt-1 size-4 accent-[#2863ec]"
                      checked={selecionado}
                      onChange={() => alternarBem(bem)}
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
          <DialogFooter className="border-t border-[#e4eaf2] p-6 pt-4">
            <span className="mr-auto text-sm text-[#526580]">
              {itens.length} selecionado(s)
            </span>
            <Button type="button" onClick={() => setSeletorAberto(false)}>
              Confirmar seleção
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={configurando !== null}
        onOpenChange={(aberto) => {
          if (!aberto) setConfigurando(null);
        }}
      >
        {configurando !== null && itens[configurando] ? (
          <DialogContent className="max-h-[min(92vh,54rem)] max-w-3xl overflow-y-auto p-0">
            <DialogHeader className="border-b border-[#e4eaf2] p-6 pb-4">
              <DialogTitle className="text-xl text-[#19355d]">
                Configurar atendimento do item
              </DialogTitle>
              <DialogDescription>
                Defina fornecedor e dados exclusivos deste patrimônio.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-5 px-6">
              <div className="rounded-md bg-[#f3f7fe] p-4">
                <strong>
                  {itens[configurando].numero} · {itens[configurando].descricao}
                </strong>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="grid gap-2 text-sm sm:col-span-2">
                  <label htmlFor="busca-fornecedor">
                    Buscar fornecedor ativo
                  </label>
                  <div className="flex gap-2">
                    <input
                      id="busca-fornecedor"
                      value={buscaFornecedor}
                      onChange={(e) => setBuscaFornecedor(e.target.value)}
                      className={campoManutencao}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => void carregarFornecedores(buscaFornecedor)}
                    >
                      <Search aria-hidden="true" /> Buscar
                    </Button>
                  </div>
                </div>
                <label className="grid gap-2 text-sm">
                  Fornecedor / prestador
                  <select
                    value={itens[configurando].fornecedorId}
                    onChange={(e) =>
                      atualizarItem(configurando, {
                        fornecedorId: e.target.value,
                      })
                    }
                    className={campoManutencao}
                  >
                    <option value="">Não informado</option>
                    {fornecedores.map((opcao) => (
                      <option key={opcao.id} value={opcao.id}>
                        {opcao.nome}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="grid gap-2 text-sm">
                  Tipo de manutenção *
                  <select
                    value={itens[configurando].tipo}
                    onChange={(e) =>
                      atualizarItem(configurando, {
                        tipo: e.target.value as ItemForm["tipo"],
                      })
                    }
                    className={campoManutencao}
                  >
                    <option value="CORRETIVA">Corretiva</option>
                    <option value="PREVENTIVA">Preventiva</option>
                  </select>
                </label>
                <label className="grid gap-2 text-sm">
                  Previsão de retorno
                  <input
                    type="date"
                    min={dataEnvio}
                    value={itens[configurando].previsaoRetorno}
                    onChange={(e) =>
                      atualizarItem(configurando, {
                        previsaoRetorno: e.target.value,
                      })
                    }
                    className={campoManutencao}
                  />
                </label>
                <label className="grid gap-2 text-sm">
                  Valor orçado (R$)
                  <input
                    inputMode="decimal"
                    value={itens[configurando].valorOrcamento}
                    onChange={(e) =>
                      atualizarItem(configurando, {
                        valorOrcamento: e.target.value,
                      })
                    }
                    placeholder="0.00"
                    className={campoManutencao}
                  />
                </label>
                <label className="grid gap-2 text-sm">
                  Data do orçamento
                  <input
                    type="date"
                    value={itens[configurando].dataOrcamento}
                    onChange={(e) =>
                      atualizarItem(configurando, {
                        dataOrcamento: e.target.value,
                      })
                    }
                    className={campoManutencao}
                  />
                </label>
                <label className="grid gap-2 text-sm sm:col-span-2">
                  Problema identificado
                  <textarea
                    rows={3}
                    value={itens[configurando].descricaoProblema}
                    onChange={(e) =>
                      atualizarItem(configurando, {
                        descricaoProblema: e.target.value,
                      })
                    }
                    className={campoManutencao}
                  />
                </label>
                <label className="grid gap-2 text-sm sm:col-span-2">
                  Descrição do orçamento
                  <input
                    value={itens[configurando].descricaoOrcamento}
                    onChange={(e) =>
                      atualizarItem(configurando, {
                        descricaoOrcamento: e.target.value,
                      })
                    }
                    className={campoManutencao}
                  />
                </label>
              </div>
            </div>
            <DialogFooter className="border-t border-[#e4eaf2] p-6 pt-4">
              <Button type="button" onClick={() => setConfigurando(null)}>
                Salvar atendimento
              </Button>
            </DialogFooter>
          </DialogContent>
        ) : null}
      </Dialog>
    </form>
  );
}
