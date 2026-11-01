"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  CriarManutencaoBodySchema,
  type CriarManutencaoBodyInput,
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
const campo =
  "rounded-md border border-slate-300 bg-white p-2 text-sm text-slate-900 focus-visible:outline-2 focus-visible:outline-offset-2";

export function NovoPedido() {
  const router = useRouter();
  const [dataEnvio, setDataEnvio] = useState(hoje);
  const [comissaoId, setComissaoId] = useState("");
  const [justificativa, setJustificativa] = useState("");
  const [itens, setItens] = useState<ItemForm[]>([]);
  const [comissoes, setComissoes] = useState<Opcao[]>([]);
  const [fornecedores, setFornecedores] = useState<Opcao[]>([]);
  const [bens, setBens] = useState<Bem[]>([]);
  const [buscaBem, setBuscaBem] = useState("");
  const [buscaComissao, setBuscaComissao] = useState("");
  const [buscaFornecedor, setBuscaFornecedor] = useState("");
  const [bemSelecionado, setBemSelecionado] = useState("");
  const [erro, setErro] = useState<unknown>(null);
  const [aviso, setAviso] = useState("");
  const [decisaoIdempotencia, setDecisaoIdempotencia] =
    useState<DecisaoIdempotencia | null>(null);
  const [ocupado, setOcupado] = useState(false);
  const chave = useRef<string | null>(null);
  const enviando = useRef(false);

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
    void operacoes
      .patrimonios({ status: "ATIVO", limite: "50" })
      .then((resposta) => {
        if (ativo)
          setBens(
            resposta.dados.map((bem) => ({
              id: bem.id,
              numeroPatrimonio: bem.numeroPatrimonio,
              descricao: bem.descricao,
            })),
          );
      })
      .catch((e: unknown) => {
        if (ativo) setErro(e);
      });
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

  function adicionarBem() {
    const bem = bens.find((linha) => linha.id === bemSelecionado);
    if (!bem || itens.some((item) => item.patrimonioId === bem.id)) return;
    setItens((atual) => [
      ...atual,
      {
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
      },
    ]);
    setBemSelecionado("");
    alterar();
  }
  function atualizarItem(indice: number, alteracoes: Partial<ItemForm>) {
    setItens((atual) =>
      atual.map((item, i) =>
        i === indice ? { ...item, ...alteracoes } : item,
      ),
    );
    alterar();
  }
  async function enviar(evento: React.FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    if (enviando.current) return;
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
      router.push(`/manutencoes/${resposta.dados.id}`);
    } catch (e) {
      const decisao = decidirAposFalha(e);
      setErro(e);
      setDecisaoIdempotencia(isConflitoIdempotencia(e) ? decisao : null);
      if (!decisao.manterChave) chave.current = null;
      if (decisao.atualizarConsultas) router.refresh();
      if (!isConflitoIdempotencia(e)) {
        setAviso(
          "O formulário foi preservado. Se a resposta se perdeu, consulte a lista antes de reenviar.",
        );
      }
    } finally {
      enviando.current = false;
      setOcupado(false);
    }
  }

  return (
    <form onSubmit={enviar} className="grid gap-5" noValidate>
      <section className="grid gap-3 rounded-md border bg-white p-4 sm:grid-cols-2">
        <label className="grid gap-1 text-sm">
          Data de envio
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
            className={campo}
          />
        </label>
        <div className="grid gap-1 text-sm">
          <label htmlFor="busca-comissao">Buscar comissão</label>
          <div className="flex gap-2">
            <input
              id="busca-comissao"
              value={buscaComissao}
              onChange={(e) => setBuscaComissao(e.target.value)}
              className={`${campo} min-w-0 flex-1`}
            />
            <button
              type="button"
              onClick={() => void carregarComissoes(buscaComissao)}
              className="rounded border px-3"
            >
              Buscar
            </button>
          </div>
        </div>
        <label className="grid gap-1 text-sm">
          Comissão vigente
          <select
            value={comissaoId}
            onChange={(e) => {
              setComissaoId(e.target.value);
              alterar();
            }}
            required
            className={campo}
          >
            <option value="">Selecione</option>
            {comissoes.map((opcao) => (
              <option key={opcao.id} value={opcao.id}>
                {opcao.nome}
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-1 text-sm sm:col-span-2">
          Justificativa (opcional)
          <textarea
            value={justificativa}
            onChange={(e) => {
              setJustificativa(e.target.value);
              alterar();
            }}
            maxLength={10000}
            rows={2}
            className={campo}
          />
        </label>
      </section>
      <section
        className="grid gap-3 rounded-md border bg-white p-4"
        aria-labelledby="bens-title"
      >
        <h2 id="bens-title" className="font-semibold">
          Patrimônios enviados
        </h2>
        <div className="flex flex-wrap gap-2">
          <label className="grid min-w-0 flex-1 gap-1 text-sm">
            Buscar patrimônio ativo
            <input
              value={buscaBem}
              onChange={(e) => setBuscaBem(e.target.value)}
              className={campo}
              placeholder="Número ou descrição"
            />
          </label>
          <button
            type="button"
            onClick={() => void carregarBens(buscaBem)}
            className="self-end rounded border px-3 py-2"
          >
            Buscar
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          <label className="grid min-w-0 flex-1 gap-1 text-sm">
            Patrimônio
            <select
              value={bemSelecionado}
              onChange={(e) => setBemSelecionado(e.target.value)}
              className={campo}
            >
              <option value="">Selecione</option>
              {bens.map((bem) => (
                <option key={bem.id} value={bem.id}>
                  {bem.numeroPatrimonio} — {bem.descricao}
                </option>
              ))}
            </select>
          </label>
          <button
            type="button"
            onClick={adicionarBem}
            disabled={!bemSelecionado || itens.length >= 50}
            className="self-end rounded border px-3 py-2 disabled:opacity-50"
          >
            Adicionar
          </button>
        </div>
        <p className="text-xs text-slate-600">
          Se o patrimônio não aparece, use a busca. Até 50 itens por pedido.
        </p>
        {itens.length === 0 ? <p>Nenhum patrimônio adicionado.</p> : null}
        {itens.map((item, indice) => (
          <fieldset
            key={item.patrimonioId}
            className="grid gap-3 rounded border p-3 sm:grid-cols-2"
          >
            <legend className="px-1 font-semibold">
              {item.numero} — {item.descricao}
            </legend>
            <label className="grid gap-1 text-sm">
              Tipo
              <select
                value={item.tipo}
                onChange={(e) =>
                  atualizarItem(indice, {
                    tipo: e.target.value as ItemForm["tipo"],
                  })
                }
                className={campo}
              >
                <option value="CORRETIVA">Corretiva</option>
                <option value="PREVENTIVA">Preventiva</option>
              </select>
            </label>
            <label className="grid gap-1 text-sm">
              Previsão de retorno (opcional)
              <input
                type="date"
                value={item.previsaoRetorno}
                onChange={(e) =>
                  atualizarItem(indice, { previsaoRetorno: e.target.value })
                }
                className={campo}
              />
            </label>
            <div className="grid gap-1 text-sm sm:col-span-2">
              <label htmlFor={`buscar-fornecedor-${indice}`}>
                Buscar fornecedor ativo
              </label>
              <div className="flex gap-2">
                <input
                  id={`buscar-fornecedor-${indice}`}
                  value={buscaFornecedor}
                  onChange={(e) => setBuscaFornecedor(e.target.value)}
                  className={`${campo} min-w-0 flex-1`}
                />
                <button
                  type="button"
                  onClick={() => void carregarFornecedores(buscaFornecedor)}
                  className="rounded border px-3"
                >
                  Buscar
                </button>
              </div>
            </div>
            <label className="grid gap-1 text-sm sm:col-span-2">
              Fornecedor (opcional)
              <select
                value={item.fornecedorId}
                onChange={(e) =>
                  atualizarItem(indice, { fornecedorId: e.target.value })
                }
                className={campo}
              >
                <option value="">Nenhum</option>
                {fornecedores.map((opcao) => (
                  <option key={opcao.id} value={opcao.id}>
                    {opcao.nome}
                  </option>
                ))}
              </select>
            </label>
            <label className="grid gap-1 text-sm sm:col-span-2">
              Problema (opcional)
              <textarea
                value={item.descricaoProblema}
                onChange={(e) =>
                  atualizarItem(indice, { descricaoProblema: e.target.value })
                }
                rows={2}
                className={campo}
              />
            </label>
            <p className="text-sm sm:col-span-2">
              Orçamento inicial (opcional; preencha os três campos se informado)
            </p>
            <label className="grid gap-1 text-sm">
              Data
              <input
                type="date"
                value={item.dataOrcamento}
                onChange={(e) =>
                  atualizarItem(indice, { dataOrcamento: e.target.value })
                }
                className={campo}
              />
            </label>
            <label className="grid gap-1 text-sm">
              Valor
              <input
                inputMode="decimal"
                value={item.valorOrcamento}
                onChange={(e) =>
                  atualizarItem(indice, { valorOrcamento: e.target.value })
                }
                placeholder="0.00"
                className={campo}
              />
            </label>
            <label className="grid gap-1 text-sm sm:col-span-2">
              Descrição do orçamento
              <input
                value={item.descricaoOrcamento}
                onChange={(e) =>
                  atualizarItem(indice, { descricaoOrcamento: e.target.value })
                }
                className={campo}
              />
            </label>
            <button
              type="button"
              onClick={() => {
                setItens((atual) => atual.filter((_, i) => i !== indice));
                alterar();
              }}
              className="justify-self-start rounded border px-3 py-2 text-sm"
            >
              Remover item
            </button>
          </fieldset>
        ))}
      </section>
      {erro && decisaoIdempotencia ? (
        <AlertaIdempotencia
          erro={erro}
          decisao={decisaoIdempotencia}
          destino={{
            href: "/manutencoes",
            rotulo: "Consultar manutenções",
          }}
        />
      ) : erro ? (
        <ErroManutencao erro={erro} />
      ) : null}
      {aviso ? (
        <p role="status" className="text-sm">
          {aviso}
        </p>
      ) : null}
      <button
        type="submit"
        disabled={
          ocupado ||
          itens.length === 0 ||
          decisaoIdempotencia?.tipo === "ja_processada"
        }
        className="justify-self-start rounded-md bg-[#19355d] px-4 py-2 text-white disabled:opacity-50"
      >
        {ocupado ? "Salvando..." : "Criar pedido"}
      </button>
    </form>
  );
}
