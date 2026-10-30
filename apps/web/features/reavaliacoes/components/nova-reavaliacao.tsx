"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  CriarReavaliacaoBodySchema,
  PreviaReavaliacaoBodySchema,
  type CriarReavaliacaoBodyData,
  type CriarReavaliacaoResponse,
  type ErroCampo,
  type PatrimonioDetalhe,
  type PreviaReavaliacao,
} from "@repo/contracts";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { isApiError } from "@/lib/api/core/api-error";
import {
  useComissoesReavaliacao,
  useCriarReavaliacao,
  usePatrimonioReavaliacao,
  usePatrimoniosReavaliacao,
  usePreviaReavaliacao,
} from "../api/hooks";
import {
  campoReavaliacao,
  formatarDataCivil,
  formatarDecimal,
  mensagemReavaliacao,
  painelReavaliacao,
} from "../presentation";

type Selecionado = {
  bem: PatrimonioDetalhe;
  valorReavaliado: string;
  vidaUtilNovaMeses: string;
  residualTipo: "VALOR" | "PERCENTUAL";
  residual: string;
  definirPrimeiroParametro?: true;
};

function hojeSaoPaulo(): string {
  const partes = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const obter = (tipo: string) =>
    partes.find((parte) => parte.type === tipo)!.value;
  return `${obter("year")}-${obter("month")}-${obter("day")}`;
}

export function NovaReavaliacao({ usuarioId }: { usuarioId: string }) {
  const router = useRouter();
  const bens = usePatrimoniosReavaliacao();
  const detalhe = usePatrimonioReavaliacao();
  const comissoes = useComissoesReavaliacao();
  const previaOperacao = usePreviaReavaliacao();
  const criacao = useCriarReavaliacao();
  const [busca, setBusca] = useState("");
  const [buscaAplicada, setBuscaAplicada] = useState("");
  const [pagina, setPagina] = useState(1);
  const [buscaComissao, setBuscaComissao] = useState("");
  const [dataReferencia, setDataReferencia] = useState(hojeSaoPaulo);
  const [comissaoId, setComissaoId] = useState("");
  const [selecionados, setSelecionados] = useState<Selecionado[]>([]);
  const [parametroPendenteId, setParametroPendenteId] = useState<string | null>(
    null,
  );
  const [previa, setPrevia] = useState<PreviaReavaliacao | null>(null);
  const [pedidoPendente, setPedidoPendente] =
    useState<CriarReavaliacaoBodyData | null>(null);
  const [resultado, setResultado] = useState<CriarReavaliacaoResponse | null>(
    null,
  );
  const [erro, setErro] = useState<unknown>(null);
  const [errosCampos, setErrosCampos] = useState<ErroCampo[]>([]);
  const [aviso, setAviso] = useState("");
  const painelAviso = useRef<HTMLDivElement>(null);
  const chaveStorage = `sipat.reavaliacao.pendente.${usuarioId}`;
  const carregarBens = bens.carregar;
  const carregarComissoes = comissoes.carregar;

  useEffect(() => {
    void carregarBens({
      pagina: String(pagina),
      limite: "20",
      ...(buscaAplicada ? { busca: buscaAplicada } : {}),
    });
  }, [carregarBens, buscaAplicada, pagina]);
  useEffect(() => {
    void carregarComissoes({
      contexto: "REGISTRO",
      dataReferencia,
      ...(buscaComissao ? { busca: buscaComissao } : {}),
    });
  }, [carregarComissoes, dataReferencia, buscaComissao]);
  useEffect(() => {
    const temporizador = window.setTimeout(() => {
      try {
        const salvo = sessionStorage.getItem(chaveStorage);
        if (salvo) {
          const parsed = CriarReavaliacaoBodySchema.safeParse(
            JSON.parse(salvo),
          );
          if (parsed.success) setPedidoPendente(parsed.data);
        }
      } catch {
        // O formulário permanece utilizável quando o armazenamento local está indisponível.
      }
    }, 0);
    return () => window.clearTimeout(temporizador);
  }, [chaveStorage]);
  useEffect(() => {
    if (erro || errosCampos.length || aviso) painelAviso.current?.focus();
  }, [erro, errosCampos, aviso]);

  function invalidarPrevia() {
    setPrevia(null);
    setErro(null);
    setErrosCampos([]);
  }

  async function alternar(id: string) {
    if (selecionados.some((item) => item.bem.id === id)) {
      setSelecionados((atuais) => atuais.filter((item) => item.bem.id !== id));
      invalidarPrevia();
      return;
    }
    if (selecionados.length >= 20 || detalhe.pending) return;
    try {
      const bem = await detalhe.consultar(id);
      if (bem.status === "BAIXADO") return;
      setSelecionados((atuais) =>
        atuais.some((item) => item.bem.id === id)
          ? atuais
          : [
              ...atuais,
              {
                bem,
                valorReavaliado: bem.situacaoContabil.valorBrutoAtual,
                vidaUtilNovaMeses: String(
                  bem.parametroDepreciacaoAtual?.vidaUtilInicialMeses ?? 60,
                ),
                residualTipo: "VALOR",
                residual: bem.parametroDepreciacaoAtual?.valorResidual ?? "0",
              },
            ],
      );
      invalidarPrevia();
    } catch (e) {
      setErro(e);
    }
  }

  function alterarItem(id: string, valores: Partial<Selecionado>) {
    setSelecionados((atuais) =>
      atuais.map((item) =>
        item.bem.id === id
          ? { ...item, ...valores, definirPrimeiroParametro: undefined }
          : item,
      ),
    );
    invalidarPrevia();
  }

  function montarBody() {
    return {
      dataReferencia,
      comissaoId,
      itens: selecionados.map((item) => ({
        patrimonioId: item.bem.id,
        valorReavaliado: item.valorReavaliado,
        vidaUtilNovaMeses: Number(item.vidaUtilNovaMeses),
        ...(item.definirPrimeiroParametro
          ? { definirPrimeiroParametro: true as const }
          : {}),
        residual:
          item.residualTipo === "VALOR"
            ? { tipo: "VALOR" as const, valor: item.residual }
            : { tipo: "PERCENTUAL" as const, percentual: item.residual },
      })),
    };
  }

  async function gerarPrevia() {
    const validacao = PreviaReavaliacaoBodySchema.safeParse(montarBody());
    if (!validacao.success) {
      setErrosCampos(
        validacao.error.issues.map((issue) => ({
          campo: issue.path.join("."),
          codigo: "VALIDACAO_ENTRADA_INVALIDA",
          mensagem: issue.message,
        })),
      );
      setAviso("Corrija os campos indicados antes de revisar.");
      return;
    }
    setErro(null);
    setErrosCampos([]);
    setAviso("");
    try {
      const resposta = await previaOperacao.gerar(validacao.data);
      setPrevia(resposta.dados);
      if (!resposta.dados.versaoPrevia) {
        setAviso(
          "A prévia identificou impedimentos. Corrija os itens indicados e consulte novamente.",
        );
      } else {
        setAviso(
          "Confira os valores anteriores, novos e a estimativa antes de confirmar.",
        );
      }
    } catch (e) {
      setErro(e);
      if (isApiError(e)) setErrosCampos(e.erros);
    }
  }

  async function confirmar(pedidoAnterior?: CriarReavaliacaoBodyData) {
    if (criacao.pending) return;
    if (!pedidoAnterior && !previa?.versaoPrevia) return;
    const pedido =
      pedidoAnterior ??
      CriarReavaliacaoBodySchema.parse({
        ...montarBody(),
        versaoPrevia: previa!.versaoPrevia,
        chaveIdempotencia: crypto.randomUUID(),
      });
    setPedidoPendente(pedido);
    setErro(null);
    setErrosCampos([]);
    setAviso("");
    try {
      sessionStorage.setItem(chaveStorage, JSON.stringify(pedido));
    } catch {
      /* A chave continua em memória nesta página. */
    }
    try {
      const resposta = await criacao.confirmar(pedido);
      if (!resposta) return;
      setResultado(resposta);
      setPedidoPendente(null);
      try {
        sessionStorage.removeItem(chaveStorage);
      } catch {
        /* Sem armazenamento. */
      }
      router.refresh();
      requestAnimationFrame(() => painelAviso.current?.focus());
    } catch (e) {
      setErro(e);
      if (isApiError(e)) {
        setErrosCampos(e.erros);
        if (
          e.status !== null &&
          e.status < 500 &&
          e.status !== 401 &&
          e.status !== 403 &&
          e.codigo !== "CONFLITO_CONCORRENTE_REAVALIACAO"
        ) {
          setPedidoPendente(null);
          setPrevia(null);
          try {
            sessionStorage.removeItem(chaveStorage);
          } catch {
            /* Sem armazenamento. */
          }
          setAviso(
            "Os dados foram mantidos. Gere uma nova prévia antes de confirmar.",
          );
        }
      }
    }
  }

  const comissaoSelecionada = comissoes.dados?.dados.find(
    (item) => item.id === comissaoId,
  );
  const bloqueado =
    criacao.pending || previaOperacao.pending || detalhe.pending;
  const parametroPendente = selecionados.find(
    (item) => item.bem.id === parametroPendenteId,
  );
  return (
    <main className="grid min-w-0 gap-5 p-4 text-[#19355d] sm:p-7">
      <Dialog
        open={!!parametroPendente}
        onOpenChange={(aberto) => {
          if (!aberto) setParametroPendenteId(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Definir primeiro parâmetro</DialogTitle>
            <DialogDescription>
              O patrimônio ainda não tem parâmetros de depreciação. Confirme os
              novos valores informados para iniciar o primeiro parâmetro na data
              da reavaliação.
            </DialogDescription>
          </DialogHeader>
          {parametroPendente ? (
            <dl className="grid gap-2 text-sm">
              <div>
                <dt>Patrimônio</dt>
                <dd className="font-semibold">
                  {parametroPendente.bem.numeroPatrimonio} ·{" "}
                  {parametroPendente.bem.descricao}
                </dd>
              </div>
              <div>
                <dt>Novo valor bruto</dt>
                <dd className="font-semibold">
                  {formatarDecimal(parametroPendente.valorReavaliado)}
                </dd>
              </div>
              <div>
                <dt>Nova vida útil</dt>
                <dd className="font-semibold">
                  {parametroPendente.vidaUtilNovaMeses} meses
                </dd>
              </div>
              <div>
                <dt>Novo residual</dt>
                <dd className="font-semibold">
                  {parametroPendente.residualTipo === "PERCENTUAL"
                    ? `${parametroPendente.residual}% do novo valor bruto`
                    : formatarDecimal(parametroPendente.residual)}
                </dd>
              </div>
              <div>
                <dt>Início</dt>
                <dd className="font-semibold">
                  {formatarDataCivil(dataReferencia)}
                </dd>
              </div>
            </dl>
          ) : null}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setParametroPendenteId(null)}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={() => {
                if (!parametroPendenteId) return;
                setSelecionados((atuais) =>
                  atuais.map((item) =>
                    item.bem.id === parametroPendenteId
                      ? { ...item, definirPrimeiroParametro: true }
                      : item,
                  ),
                );
                setParametroPendenteId(null);
                invalidarPrevia();
              }}
            >
              Usar como primeiro parâmetro
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <header>
        <Link
          prefetch={false}
          href="/reavaliacoes"
          className="text-sm underline"
        >
          Voltar às reavaliações
        </Link>
        <h1 className="mt-4 text-2xl font-bold">Nova reavaliação</h1>
        <p className="mt-2 text-sm text-[#526580]">
          Selecione até 20 bens, informe os novos parâmetros e revise a prévia
          calculada pela API.
        </p>
      </header>
      <div ref={painelAviso} tabIndex={-1} className="outline-none">
        {erro ? (
          <div role="alert" className="rounded-md bg-red-50 p-4 text-red-900">
            {mensagemReavaliacao(erro)}
          </div>
        ) : null}
        {aviso ? (
          <p role="status" className="rounded-md bg-blue-50 p-4 text-blue-900">
            {aviso}
          </p>
        ) : null}
        {errosCampos.length ? (
          <ul className="mt-2 list-disc pl-5 text-sm text-red-800">
            {errosCampos.map((item, indice) => (
              <li key={`${item.campo}-${indice}`}>
                {item.campo}: {item.mensagem}
              </li>
            ))}
          </ul>
        ) : null}
      </div>
      {resultado ? (
        <section className={painelReavaliacao}>
          <h2 className="text-xl font-bold">Reavaliação confirmada</h2>
          <p role="status" className="mt-2">
            {resultado.dados.length} registro(s) individual(is) criado(s).
          </p>
          <ul className="mt-4 list-disc pl-5">
            {resultado.dados.map((item) => (
              <li key={item.id}>
                <Link
                  prefetch={false}
                  href={`/reavaliacoes/${item.id}`}
                  className="underline"
                >
                  Ver reavaliação do patrimônio{" "}
                  {item.patrimonio.numeroPatrimonio}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : (
        <>
          {pedidoPendente ? (
            <section
              className={painelReavaliacao}
              aria-label="Confirmação pendente"
            >
              <h2 className="font-bold">Confirmação sem resultado conhecido</h2>
              <p className="mt-2 text-sm">
                Reenvie o mesmo pedido para recuperar o resultado sem duplicar
                registros.
              </p>
              <Button
                className="mt-3"
                type="button"
                disabled={criacao.pending}
                onClick={() => void confirmar(pedidoPendente)}
              >
                {criacao.pending ? "Reenviando…" : "Reenviar confirmação"}
              </Button>
            </section>
          ) : null}
          <section
            className={painelReavaliacao}
            aria-labelledby="selecionar-bens-title"
          >
            <h2 id="selecionar-bens-title" className="font-bold">
              1. Selecionar bens
            </h2>
            <form
              className="mt-4 flex flex-wrap items-end gap-3"
              onSubmit={(e) => {
                e.preventDefault();
                setPagina(1);
                setBuscaAplicada(busca.trim());
                if (pagina === 1 && buscaAplicada === busca.trim())
                  void carregarBens({
                    pagina: "1",
                    limite: "20",
                    ...(buscaAplicada ? { busca: buscaAplicada } : {}),
                  });
              }}
            >
              <label className="grid min-w-56 flex-1 gap-2 text-sm">
                Descrição ou características
                <input
                  className={campoReavaliacao}
                  type="search"
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  maxLength={200}
                />
              </label>
              <Button type="submit">Pesquisar</Button>
            </form>
            {bens.loading ? (
              <p role="status" className="mt-4">
                Carregando bens…
              </p>
            ) : bens.erro ? (
              <p role="alert" className="mt-4 text-red-800">
                Não foi possível consultar os patrimônios.
              </p>
            ) : (
              <ul className="mt-4 grid gap-2">
                {bens.dados?.dados.map((bem) => (
                  <li
                    key={bem.id}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-md border p-3"
                  >
                    <div>
                      <strong>{bem.numeroPatrimonio}</strong> · {bem.descricao}
                      <p className="text-xs text-[#526580]">
                        {bem.status.replaceAll("_", " ")}
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      disabled={
                        bem.status === "BAIXADO" ||
                        (detalhe.pending &&
                          !selecionados.some(
                            (item) => item.bem.id === bem.id,
                          )) ||
                        (selecionados.length >= 20 &&
                          !selecionados.some((item) => item.bem.id === bem.id))
                      }
                      onClick={() => void alternar(bem.id)}
                    >
                      {selecionados.some((item) => item.bem.id === bem.id)
                        ? "Remover"
                        : bem.status === "BAIXADO"
                          ? "Baixado"
                          : "Selecionar"}
                    </Button>
                  </li>
                ))}
              </ul>
            )}
            {bens.dados ? (
              <nav
                aria-label="Páginas de patrimônios"
                className="mt-4 flex items-center gap-3 text-sm"
              >
                <Button
                  type="button"
                  variant="outline"
                  disabled={pagina <= 1}
                  onClick={() => setPagina((atual) => atual - 1)}
                >
                  Anterior
                </Button>
                <span>
                  {pagina} de {bens.dados.meta.ultimaPagina}
                </span>
                <Button
                  type="button"
                  variant="outline"
                  disabled={pagina >= bens.dados.meta.ultimaPagina}
                  onClick={() => setPagina((atual) => atual + 1)}
                >
                  Próxima
                </Button>
              </nav>
            ) : null}
          </section>
          <section
            className={painelReavaliacao}
            aria-labelledby="parametros-title"
          >
            <h2 id="parametros-title" className="font-bold">
              2. Data, comissão e parâmetros
            </h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <label className="grid gap-2 text-sm">
                Data de referência
                <input
                  className={campoReavaliacao}
                  type="date"
                  min={`${hojeSaoPaulo().slice(0, 7)}-01`}
                  max={hojeSaoPaulo()}
                  value={dataReferencia}
                  onChange={(e) => {
                    setDataReferencia(e.target.value);
                    setComissaoId("");
                    setSelecionados((atuais) =>
                      atuais.map((item) => ({
                        ...item,
                        definirPrimeiroParametro: undefined,
                      })),
                    );
                    invalidarPrevia();
                  }}
                />
              </label>
              <label className="grid gap-2 text-sm">
                Comissão vigente
                <select
                  className={campoReavaliacao}
                  value={comissaoId}
                  onChange={(e) => {
                    setComissaoId(e.target.value);
                    invalidarPrevia();
                  }}
                >
                  <option value="">Selecione</option>
                  {comissaoId && !comissaoSelecionada ? (
                    <option value={comissaoId}>Comissão selecionada</option>
                  ) : null}
                  {comissoes.dados?.dados.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.nome}
                    </option>
                  ))}
                </select>
              </label>
              <label className="grid gap-2 text-sm sm:col-span-2">
                Pesquisar comissão
                <input
                  className={campoReavaliacao}
                  type="search"
                  value={buscaComissao}
                  onChange={(e) => setBuscaComissao(e.target.value)}
                  maxLength={200}
                />
              </label>
            </div>
            {comissoes.loading ? (
              <p role="status" className="mt-2 text-sm">
                Carregando comissões…
              </p>
            ) : null}
            {comissoes.erro ? (
              <p role="alert" className="mt-2 text-sm text-red-800">
                Não foi possível consultar as comissões.
              </p>
            ) : null}
            <div className="mt-5 grid gap-4">
              {selecionados.length ? (
                selecionados.map((item, indice) => (
                  <fieldset key={item.bem.id} className="rounded-md border p-4">
                    <legend className="px-1 font-semibold">
                      Bem {indice + 1}: {item.bem.numeroPatrimonio} ·{" "}
                      {item.bem.descricao}
                    </legend>
                    <p className="mb-3 text-xs text-[#526580]">
                      Bruto atual:{" "}
                      {formatarDecimal(
                        item.bem.situacaoContabil.valorBrutoAtual,
                      )}{" "}
                      · Acumulado atual:{" "}
                      {formatarDecimal(
                        item.bem.situacaoContabil.depreciacaoAcumuladaAtual,
                      )}{" "}
                      · Residual vigente:{" "}
                      {formatarDecimal(
                        item.bem.parametroDepreciacaoAtual?.valorResidual,
                      )}
                    </p>
                    {!item.bem.parametroDepreciacaoAtual ? (
                      <div
                        role="alert"
                        className="mb-4 rounded-md border border-amber-300 bg-amber-50 p-3 text-sm"
                      >
                        <p>
                          Este patrimônio foi cadastrado sem parâmetros de
                          depreciação. A reavaliação exige um parâmetro. Deseja
                          definir um agora?
                        </p>
                        <p className="mt-1 text-xs">
                          Enquanto não houver parâmetro vigente, o patrimônio
                          não deprecia.
                        </p>
                        <Button
                          className="mt-3"
                          type="button"
                          variant="outline"
                          onClick={() => setParametroPendenteId(item.bem.id)}
                        >
                          {item.definirPrimeiroParametro
                            ? "Revisar primeiro parâmetro"
                            : "Definir primeiro parâmetro"}
                        </Button>
                        {item.definirPrimeiroParametro ? (
                          <p className="mt-2 text-xs">
                            Primeiro parâmetro confirmado para a prévia.
                          </p>
                        ) : null}
                      </div>
                    ) : null}
                    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                      <label className="grid gap-2 text-sm">
                        Novo valor bruto (R$)
                        <input
                          className={campoReavaliacao}
                          type="text"
                          inputMode="decimal"
                          value={item.valorReavaliado}
                          onChange={(e) =>
                            alterarItem(item.bem.id, {
                              valorReavaliado: e.target.value,
                            })
                          }
                        />
                      </label>
                      <label className="grid gap-2 text-sm">
                        Nova vida útil (meses)
                        <input
                          className={campoReavaliacao}
                          type="number"
                          min={1}
                          max={1200}
                          step={1}
                          value={item.vidaUtilNovaMeses}
                          onChange={(e) =>
                            alterarItem(item.bem.id, {
                              vidaUtilNovaMeses: e.target.value,
                            })
                          }
                        />
                      </label>
                      <label className="grid gap-2 text-sm">
                        Modalidade residual
                        <select
                          className={campoReavaliacao}
                          value={item.residualTipo}
                          onChange={(e) => {
                            const tipo = e.target
                              .value as Selecionado["residualTipo"];
                            alterarItem(item.bem.id, {
                              residualTipo: tipo,
                              residual:
                                tipo === "VALOR"
                                  ? (item.bem.parametroDepreciacaoAtual
                                      ?.valorResidual ?? "0")
                                  : (item.bem.parametroDepreciacaoAtual
                                      ?.percentualResidual ?? "0"),
                            });
                          }}
                        >
                          <option value="VALOR">Valor em reais</option>
                          <option value="PERCENTUAL">Percentual</option>
                        </select>
                      </label>
                      <label className="grid gap-2 text-sm">
                        {item.residualTipo === "VALOR"
                          ? "Novo residual (R$)"
                          : "Novo residual (%)"}
                        <input
                          className={campoReavaliacao}
                          type="text"
                          inputMode="decimal"
                          value={item.residual}
                          onChange={(e) =>
                            alterarItem(item.bem.id, {
                              residual: e.target.value,
                            })
                          }
                        />
                      </label>
                    </div>
                  </fieldset>
                ))
              ) : (
                <p className="text-sm text-[#526580]">
                  Selecione ao menos um patrimônio acima.
                </p>
              )}
            </div>
            <Button
              className="mt-5"
              type="button"
              disabled={
                bloqueado || selecionados.length === 0 || !!pedidoPendente
              }
              onClick={() => void gerarPrevia()}
            >
              {previaOperacao.pending ? "Calculando…" : "Calcular prévia"}
            </Button>
          </section>
          {previa ? (
            <section
              className={painelReavaliacao}
              aria-labelledby="revisao-title"
            >
              <h2 id="revisao-title" className="font-bold">
                3. Revisar antes de confirmar
              </h2>
              <p className="mt-2 text-xs text-[#526580]">
                Os valores anteriores e a estimativa abaixo foram calculados
                pela API. A quota é apenas a estimativa inicial do novo ciclo.
              </p>
              <ul className="mt-4 grid gap-4">
                {previa.itens.map((item) => (
                  <li key={item.patrimonioId} className="rounded-md border p-4">
                    <h3 className="font-semibold">
                      {item.patrimonio?.numeroPatrimonio ?? item.patrimonioId} ·{" "}
                      {item.patrimonio?.descricao}
                    </h3>
                    {item.erros.length ? (
                      <ul className="mt-2 list-disc pl-5 text-sm text-red-800">
                        {item.erros.map((erro, indice) => (
                          <li key={indice}>{erro.mensagem}</li>
                        ))}
                      </ul>
                    ) : null}
                    {item.novo ? (
                      <dl className="mt-3 grid gap-3 text-sm sm:grid-cols-2">
                        {item.anterior ? (
                          <>
                            <div>
                              <dt>Bruto anterior</dt>
                              <dd className="font-semibold">
                                {formatarDecimal(
                                  item.anterior.valorBrutoAnterior,
                                )}
                              </dd>
                            </div>
                            <div>
                              <dt>Depreciação acumulada anterior</dt>
                              <dd className="font-semibold">
                                {formatarDecimal(
                                  item.anterior.depreciacaoAcumuladaAnterior,
                                )}
                              </dd>
                            </div>
                            <div>
                              <dt>Líquido anterior</dt>
                              <dd className="font-semibold">
                                {formatarDecimal(
                                  item.anterior.valorLiquidoAnterior,
                                )}
                              </dd>
                            </div>
                          </>
                        ) : (
                          <div>
                            <dt>Parâmetro anterior</dt>
                            <dd className="font-semibold">Não havia</dd>
                          </div>
                        )}
                        <div>
                          <dt>Novo bruto</dt>
                          <dd className="font-semibold">
                            {formatarDecimal(item.novo.valorBrutoNovo)}
                          </dd>
                        </div>
                        <div>
                          <dt>Novo residual</dt>
                          <dd className="font-semibold">
                            {formatarDecimal(item.novo.valorResidualNovo)}
                            {item.novo.percentualResidualNovo
                              ? ` (${item.novo.percentualResidualNovo.replace(".", ",")}%)`
                              : ""}
                          </dd>
                        </div>
                        <div>
                          <dt>Nova vida útil</dt>
                          <dd className="font-semibold">
                            {item.novo.vidaUtilNovaMeses} meses
                          </dd>
                        </div>
                        <div>
                          <dt>Quota mensal inicial estimada</dt>
                          <dd className="font-semibold">
                            {formatarDecimal(item.quotaMensalInicialEstimada)}
                          </dd>
                        </div>
                      </dl>
                    ) : null}
                  </li>
                ))}
              </ul>
              <div className="mt-5 flex flex-wrap items-center gap-3">
                <p className="text-sm">
                  Data: {formatarDataCivil(dataReferencia)} · Comissão:{" "}
                  {comissaoSelecionada?.nome ?? "Selecionada"}
                </p>
                <Button
                  type="button"
                  disabled={
                    !previa.versaoPrevia || bloqueado || !!pedidoPendente
                  }
                  onClick={() => void confirmar()}
                >
                  {criacao.pending ? "Confirmando…" : "Confirmar reavaliação"}
                </Button>
              </div>
            </section>
          ) : null}
        </>
      )}
    </main>
  );
}
