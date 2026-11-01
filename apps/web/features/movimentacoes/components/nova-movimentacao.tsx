"use client";
import { useConfirmacaoPendente } from "../use-confirmacao-pendente";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Check, Plus, Trash2 } from "lucide-react";
import {
  CriarMovimentacaoBodySchema,
  type CriarMovimentacaoBodyData,
  type CriarMovimentacaoResponse,
  type PatrimonioResumo,
  type SetorOpcaoMovimentacao,
  type ComissaoOpcaoMovimentacao,
  type ErroCampo,
} from "@repo/contracts";
import { Button } from "@/components/ui/button";
import { AlertaIdempotencia } from "@/components/alerta-idempotencia";
import { isApiError } from "@/lib/api/core/api-error";
import {
  decidirAposFalha,
  isConflitoIdempotencia,
  type DecisaoIdempotencia,
} from "@/lib/api/core/idempotencia";
import {
  usePatrimoniosMovimentacao,
  useSetoresMovimentacao,
  useComissoesMovimentacao,
  useAtualizarPatrimonioMovimentacao,
  useCriarMovimentacao,
} from "../api/hooks";
import {
  campoMovimentacao,
  painelMovimentacao,
  formatarDataMovimentacao,
} from "../presentation";
import { ErroMovimentacao } from "./erro-movimentacao";
type Selecionado = {
  bem: PatrimonioResumo;
  destino: SetorOpcaoMovimentacao | null;
};
export function NovaMovimentacao({ usuarioId }: { usuarioId: string }) {
  const router = useRouter();
  const envioEmCurso = useRef(false);
  const bens = usePatrimoniosMovimentacao(),
    setores = useSetoresMovimentacao(),
    comissoes = useComissoesMovimentacao(),
    atualizacao = useAtualizarPatrimonioMovimentacao(),
    criacao = useCriarMovimentacao();
  const [etapa, setEtapa] = useState(1),
    [selecionados, setSelecionados] = useState<Selecionado[]>([]);
  const [comissao, setComissao] = useState<ComissaoOpcaoMovimentacao | null>(
      null,
    ),
    [observacao, setObservacao] = useState("");
  const [busca, setBusca] = useState(""),
    [buscaSetor, setBuscaSetor] = useState(""),
    [buscaComissao, setBuscaComissao] = useState(""),
    [destinoTodos, setDestinoTodos] = useState("");
  const [erro, setErro] = useState<unknown>(null),
    [errosCampos, setErrosCampos] = useState<ErroCampo[]>([]),
    [aviso, setAviso] = useState("");
  const [decisaoIdempotencia, setDecisaoIdempotencia] =
    useState<DecisaoIdempotencia | null>(null);
  const [pedido, setPedido] = useState<CriarMovimentacaoBodyData | null>(null),
    [incerto, setDesconhecido] = useState(false),
    [resultado, setResultado] = useState<CriarMovimentacaoResponse | null>(
      null,
    );

  const painelErro = useRef<HTMLDivElement>(null),
    tituloEtapa = useRef<HTMLHeadingElement>(null);
  const chaveStorage = `sipat.movimentacao.pendente.${usuarioId}`;
  const persistencia = useConfirmacaoPendente(chaveStorage);
  const restaurado = persistencia.pedido !== null && pedido === null;
  const desconhecido = incerto || (restaurado && resultado === null);
  const carregarBens = bens.carregar,
    carregarSetores = setores.carregar,
    carregarComissoes = comissoes.carregar;
  useEffect(() => {
    void carregarBens({ limite: "20" });
    void carregarSetores({ contexto: "REGISTRO" });
    void carregarComissoes({ contexto: "REGISTRO" });
  }, [carregarBens, carregarSetores, carregarComissoes]);
  useEffect(() => {
    if (erro || errosCampos.length || desconhecido) painelErro.current?.focus();
  }, [erro, errosCampos, desconhecido]);
  function irEtapa(valor: number) {
    setEtapa(valor);
    setErro(null);
    setErrosCampos([]);
    setDecisaoIdempotencia(null);
    setAviso("");
    requestAnimationFrame(() => tituloEtapa.current?.focus());
  }
  function alternar(bem: PatrimonioResumo) {
    if (bem.status !== "ATIVO") return;
    setSelecionados((atuais) =>
      atuais.some((item) => item.bem.id === bem.id)
        ? atuais.filter((item) => item.bem.id !== bem.id)
        : atuais.length < 10
          ? [...atuais, { bem, destino: null }]
          : atuais,
    );
  }
  function destinoItem(id: string, destinoId: string) {
    const destino =
      setores.dados?.dados.find((s) => s.id === destinoId) ??
      selecionados.find((i) => i.destino?.id === destinoId)?.destino ??
      null;
    setSelecionados((atuais) =>
      atuais.map((item) => (item.bem.id === id ? { ...item, destino } : item)),
    );
  }
  function aplicarTodos() {
    const destino = setores.dados?.dados.find((s) => s.id === destinoTodos);
    if (!destino) return;
    setSelecionados((atuais) =>
      atuais.map((item) =>
        item.bem.setorAtual.id === destino.id ? item : { ...item, destino },
      ),
    );
    setAviso(
      "Destino aplicado. Os itens que já estão nesse setor precisam de outro destino.",
    );
  }
  function montarPedido() {
    return {
      chaveIdempotencia: crypto.randomUUID(),
      comissaoId: comissao?.id,
      observacao,
      itens: selecionados.map((item) => ({
        patrimonioId: item.bem.id,
        setorOrigemEsperadoId: item.bem.setorAtual.id,
        setorDestinoId: item.destino?.id,
      })),
    };
  }
  function revisar() {
    const validacao = CriarMovimentacaoBodySchema.safeParse(montarPedido());
    if (!validacao.success) {
      setErrosCampos(
        validacao.error.issues.map((issue) => ({
          campo: issue.path.join("."),
          codigo: "VALIDACAO_ENTRADA_INVALIDA",
          mensagem: issue.message,
        })),
      );
      return;
    }
    irEtapa(3);
  }
  async function confirmar() {
    if (envioEmCurso.current) return;
    const novoPedido =
      pedido ??
      persistencia.pedido ??
      CriarMovimentacaoBodySchema.parse(montarPedido());
    envioEmCurso.current = true;
    setPedido(novoPedido);
    setErro(null);
    setErrosCampos([]);
    setDecisaoIdempotencia(null);
    persistencia.salvar(novoPedido);
    try {
      const resposta = await criacao.confirmar(novoPedido);
      if (!resposta) return;
      setResultado(resposta);
      setDesconhecido(false);
      setPedido(null);
      persistencia.salvar(null);
      router.refresh();
      requestAnimationFrame(() => tituloEtapa.current?.focus());
    } catch (e) {
      const decisao = decidirAposFalha(e);
      setErro(e);
      setDecisaoIdempotencia(isConflitoIdempotencia(e) ? decisao : null);
      if (isApiError(e) && !isConflitoIdempotencia(e)) {
        setErrosCampos(e.erros);
      }
      const incerto =
        decisao.tipo === "resultado_incerto" ||
        decisao.tipo === "em_processamento";
      setDesconhecido(incerto);
      if (!decisao.manterChave) {
        setPedido(null);
        persistencia.salvar(null);
      }
      if (decisao.atualizarConsultas) {
        void carregarBens({ limite: "20" });
        router.refresh();
      }
    } finally {
      envioEmCurso.current = false;
    }
  }
  async function atualizarOrigem(id: string) {
    try {
      const bem = await atualizacao.atualizar(id);
      setSelecionados((atuais) =>
        atuais.map((item) =>
          item.bem.id === id
            ? {
                ...item,
                bem,
                destino:
                  item.destino?.id === bem.setorAtual.id ? null : item.destino,
              }
            : item,
        ),
      );
      setEtapa(2);
      setErro(null);
      setErrosCampos([]);
      setAviso(
        `Origem atualizada para ${bem.setorAtual.nome}. Confira os destinos e revise novamente antes de confirmar.`,
      );
    } catch (e) {
      setErro(e);
    }
  }
  function campoErro(campo: string) {
    return errosCampos
      .filter((e) => e.campo === campo)
      .map((e) => e.mensagem)
      .join(" ");
  }
  const desabilitado =
    criacao.pending ||
    desconhecido ||
    decisaoIdempotencia?.tipo === "ja_processada";
  if (resultado)
    return (
      <main className="grid min-w-0 gap-6 p-4 sm:p-7">
        <section className={painelMovimentacao}>
          <Check aria-hidden="true" className="mb-4 text-green-700" />
          <h1
            ref={tituloEtapa}
            tabIndex={-1}
            className="text-2xl font-bold text-[#19355d]"
          >
            Movimentação confirmada
          </h1>
          <p role="status" className="mt-3">
            {resultado.dados.length} transferência(s) registrada(s) em{" "}
            {formatarDataMovimentacao(resultado.dados[0]!.dataTransferencia)}{" "}
            (São Paulo).
          </p>
          <ul className="my-5 grid list-disc gap-3 pl-5">
            {resultado.dados.map((item) => (
              <li key={item.id}>
                <Link
                  prefetch={false}
                  className="text-[#19355d] underline"
                  href={`/movimentacoes/${item.id}`}
                >
                  Ver transferência do patrimônio{" "}
                  {item.patrimonio.numeroPatrimonio}
                </Link>
              </li>
            ))}
          </ul>
          <Button asChild>
            <Link prefetch={false} href="/movimentacoes">
              Consultar movimentações
            </Link>
          </Button>
        </section>
      </main>
    );
  const opcoesSetores = [
    ...(setores.dados?.dados ?? []),
    ...selecionados.flatMap((i) => (i.destino ? [i.destino] : [])),
  ].filter(
    (s, indice, lista) => lista.findIndex((x) => x.id === s.id) === indice,
  );
  const opcoesComissoes = [
    ...(comissoes.dados?.dados ?? []),
    ...(comissao ? [comissao] : []),
  ].filter(
    (c, indice, lista) => lista.findIndex((x) => x.id === c.id) === indice,
  );
  return (
    <main className="grid min-w-0 gap-5 p-4 sm:p-7 text-[#19355d]">
      <header className="grid gap-3">
        <Link
          prefetch={false}
          href="/movimentacoes"
          className="flex w-fit items-center gap-1 text-sm underline"
        >
          <ArrowLeft size={15} aria-hidden="true" />
          Voltar às movimentações
        </Link>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Nova movimentação</h1>
            <p className="mt-1 text-sm text-[#526580]">
              Transfira até dez patrimônios entre setores.
            </p>
          </div>
          <ol
            className="flex flex-wrap gap-3 text-xs"
            aria-label="Etapas da movimentação"
          >
            {["Selecionar bens", "Definir destinos", "Revisar"].map(
              (nome, i) => (
                <li
                  key={nome}
                  aria-current={etapa === i + 1 ? "step" : undefined}
                  className={
                    etapa === i + 1
                      ? "font-bold text-[#2057d6]"
                      : "text-[#526580]"
                  }
                >
                  <span className="mr-1 inline-grid size-6 place-items-center rounded-full border">
                    {i + 1}
                  </span>
                  {nome}
                </li>
              ),
            )}
          </ol>
        </div>
      </header>
      {erro || errosCampos.length || desconhecido ? (
        <div
          ref={painelErro}
          tabIndex={-1}
          className="grid gap-3 outline-offset-4"
          aria-label="Revise a confirmação"
        >
          {erro && !decisaoIdempotencia ? (
            <ErroMovimentacao erro={erro} />
          ) : null}
          {erro && decisaoIdempotencia ? (
            <AlertaIdempotencia
              erro={erro}
              decisao={decisaoIdempotencia}
              destino={{
                href: "/movimentacoes",
                rotulo: "Consultar movimentações",
              }}
              pending={criacao.pending}
              onTentarNovamente={() => void confirmar()}
            />
          ) : null}
          {desconhecido && !decisaoIdempotencia ? (
            <section
              role="alert"
              className="rounded-md border border-amber-300 bg-amber-50 p-4 text-sm text-amber-950"
            >
              <h2 className="font-bold">Resultado ainda não confirmado</h2>
              <p className="my-2">
                {restaurado ? "Há uma confirmação anterior a recuperar. " : ""}A
                resposta pode ter sido perdida após a gravação. Recupere o
                resultado com o mesmo pedido antes de iniciar outra
                movimentação.
              </p>
              <Button
                type="button"
                disabled={criacao.pending}
                onClick={() => void confirmar()}
              >
                {criacao.pending ? "Recuperando…" : "Recuperar confirmação"}
              </Button>
            </section>
          ) : null}
          {errosCampos.length ? (
            <section
              role="alert"
              className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-900"
            >
              <h2 className="font-bold">Revise os campos indicados</h2>
              <ul className="mt-2 list-disc pl-5">
                {errosCampos.map((e, i) => (
                  <li key={`${e.campo}:${i}`}>
                    {e.campo.startsWith("itens.")
                      ? `Item ${Number(e.campo.split(".")[1]) + 1}: `
                      : ""}
                    {e.mensagem}
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
        </div>
      ) : null}
      {aviso ? (
        <p role="status" className="rounded-md bg-blue-50 p-3 text-sm">
          {aviso}
        </p>
      ) : null}
      <h2 ref={tituloEtapa} tabIndex={-1} className="sr-only">
        Etapa {etapa}:{" "}
        {
          ["Selecionar bens", "Definir destinos", "Revisar e confirmar"][
            etapa - 1
          ]
        }
      </h2>
      <fieldset
        disabled={desabilitado}
        className="grid min-w-0 gap-5 disabled:opacity-70"
      >
        <legend className="sr-only">Preenchimento da movimentação</legend>
        {etapa === 1 ? (
          <section
            className={painelMovimentacao}
            aria-label="Selecionar patrimônios"
          >
            <form
              className="mb-4 flex flex-wrap items-end gap-3"
              onSubmit={(e) => {
                e.preventDefault();
                void carregarBens({
                  busca: busca.trim() || undefined,
                  limite: "20",
                });
              }}
            >
              <label className="grid min-w-0 flex-1 gap-2 text-sm">
                Buscar patrimônios
                <input
                  type="search"
                  className={campoMovimentacao}
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  maxLength={200}
                  placeholder="Número patrimonial ou descrição"
                />
              </label>
              <Button type="submit" disabled={bens.loading}>
                Pesquisar bens
              </Button>
              <p aria-live="polite" className="p-2 text-sm font-semibold">
                {selecionados.length} de 10 selecionados
              </p>
            </form>
            <p className="mb-3 text-xs text-[#526580]">
              Bens baixados, emprestados ou em manutenção não podem ser
              selecionados.
            </p>
            {bens.loading ? (
              <p role="status">Carregando patrimônios…</p>
            ) : bens.erro ? (
              <ErroMovimentacao erro={bens.erro} />
            ) : bens.dados?.dados.length ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <caption className="sr-only">
                    Patrimônios disponíveis para seleção
                  </caption>
                  <thead className="bg-[#f7f9fc] text-xs text-[#526580]">
                    <tr>
                      {[
                        "Selecionar",
                        "Patrimônio / bem",
                        "Setor atual",
                        "Situação",
                      ].map((texto) => (
                        <th className="px-3 py-3" key={texto} scope="col">
                          {texto}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {bens.dados.dados.map((bem) => {
                      const checked = selecionados.some(
                        (item) => item.bem.id === bem.id,
                      );
                      const bloqueado = bem.status !== "ATIVO";
                      return (
                        <tr key={bem.id} className="border-b border-[#e4eaf2]">
                          <td className="px-3 py-4">
                            <input
                              type="checkbox"
                              aria-label={`Selecionar patrimônio ${bem.numeroPatrimonio}`}
                              checked={checked}
                              disabled={
                                bloqueado ||
                                (!checked && selecionados.length >= 10)
                              }
                              onChange={() => alternar(bem)}
                              className="size-4 accent-[#2860eb]"
                            />
                          </td>
                          <td className="max-w-sm px-3 py-4 wrap-anywhere">
                            <span className="text-xs text-[#526580]">
                              {bem.numeroPatrimonio}
                            </span>
                            <p className="font-semibold">{bem.descricao}</p>
                          </td>
                          <td className="px-3 py-4">{bem.setorAtual.nome}</td>
                          <td className="px-3 py-4">
                            <span
                              className={
                                bloqueado ? "text-amber-900" : "text-green-800"
                              }
                            >
                              {bem.status === "ATIVO"
                                ? "Ativo"
                                : bem.status === "EM_MANUTENCAO"
                                  ? "Em manutenção — indisponível"
                                  : bem.status === "EMPRESTADO"
                                    ? "Emprestado — indisponível"
                                    : "Baixado — indisponível"}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="py-10 text-center text-sm">
                Nenhum patrimônio encontrado.
              </p>
            )}
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm">
              <p>
                {bens.dados
                  ? `Página ${bens.dados.meta.pagina} de ${bens.dados.meta.ultimaPagina}`
                  : ""}
              </p>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  disabled={
                    bens.loading || !bens.dados || bens.dados.meta.pagina <= 1
                  }
                  onClick={() =>
                    void carregarBens({
                      busca: busca.trim() || undefined,
                      pagina: String(bens.dados!.meta.pagina - 1),
                      limite: "20",
                    })
                  }
                >
                  Bens anteriores
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  disabled={
                    bens.loading ||
                    !bens.dados ||
                    bens.dados.meta.pagina >= bens.dados.meta.ultimaPagina
                  }
                  onClick={() =>
                    void carregarBens({
                      busca: busca.trim() || undefined,
                      pagina: String(bens.dados!.meta.pagina + 1),
                      limite: "20",
                    })
                  }
                >
                  Mais bens
                </Button>
              </div>
            </div>
            {selecionados.length ? (
              <div className="mt-4 border-t pt-4">
                <h3 className="mb-2 text-sm font-bold">
                  Seleção mantida entre pesquisas e páginas
                </h3>
                <div className="flex flex-wrap gap-2">
                  {selecionados.map((item) => (
                    <Button
                      type="button"
                      variant="outline"
                      key={item.bem.id}
                      aria-label={`Remover patrimônio ${item.bem.numeroPatrimonio}`}
                      onClick={() => alternar(item.bem)}
                    >
                      {item.bem.numeroPatrimonio}
                      <Trash2 size={14} aria-hidden="true" />
                    </Button>
                  ))}
                </div>
              </div>
            ) : null}
          </section>
        ) : null}
        {etapa === 2 ? (
          <>
            <section className={painelMovimentacao}>
              <div className="grid gap-4 lg:grid-cols-2">
                <div className="grid gap-2">
                  <label className="grid gap-2 text-sm">
                    Comissão vigente
                    <select
                      className={campoMovimentacao}
                      value={comissao?.id ?? ""}
                      aria-invalid={!!campoErro("comissaoId")}
                      aria-describedby="erro-comissao"
                      onChange={(e) =>
                        setComissao(
                          opcoesComissoes.find(
                            (c) => c.id === e.target.value,
                          ) ?? null,
                        )
                      }
                    >
                      <option value="">Selecione a comissão</option>
                      {opcoesComissoes.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.nome}
                        </option>
                      ))}
                    </select>
                  </label>
                  <p id="erro-comissao" className="text-sm text-red-800">
                    {campoErro("comissaoId")}
                  </p>
                  <label className="text-xs">
                    Buscar comissão vigente
                    <input
                      className={campoMovimentacao}
                      value={buscaComissao}
                      maxLength={200}
                      onChange={(e) => setBuscaComissao(e.target.value)}
                    />
                  </label>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      disabled={comissoes.loading}
                      onClick={() =>
                        void carregarComissoes({
                          contexto: "REGISTRO",
                          busca: buscaComissao.trim() || undefined,
                        })
                      }
                    >
                      Buscar comissões
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      disabled={
                        comissoes.loading ||
                        !comissoes.dados ||
                        comissoes.dados.meta.pagina <= 1
                      }
                      onClick={() =>
                        void carregarComissoes({
                          contexto: "REGISTRO",
                          busca: buscaComissao.trim() || undefined,
                          pagina: String(comissoes.dados!.meta.pagina - 1),
                        })
                      }
                    >
                      Comissões anteriores
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      disabled={
                        comissoes.loading ||
                        !comissoes.dados ||
                        comissoes.dados.meta.pagina >=
                          comissoes.dados.meta.ultimaPagina
                      }
                      onClick={() =>
                        void carregarComissoes({
                          contexto: "REGISTRO",
                          busca: buscaComissao.trim() || undefined,
                          pagina: String(comissoes.dados!.meta.pagina + 1),
                        })
                      }
                    >
                      Mais comissões
                    </Button>
                  </div>
                  {comissoes.loading ? (
                    <p role="status">Carregando comissões…</p>
                  ) : comissoes.erro ? (
                    <ErroMovimentacao erro={comissoes.erro} />
                  ) : !comissoes.dados?.dados.length ? (
                    <p className="text-sm">
                      Nenhuma comissão vigente encontrada.
                    </p>
                  ) : null}
                </div>
                <label className="grid content-start gap-2 text-sm">
                  Motivo da movimentação
                  <textarea
                    className={`${campoMovimentacao} min-h-32`}
                    maxLength={2000}
                    value={observacao}
                    aria-invalid={!!campoErro("observacao")}
                    aria-describedby="erro-observacao"
                    onChange={(e) => setObservacao(e.target.value)}
                  />
                  <span id="erro-observacao" className="text-red-800">
                    {campoErro("observacao")}
                  </span>
                  <span className="text-xs text-[#526580]">
                    Comissão e motivo serão usados em todas as transferências
                    desta confirmação.
                  </span>
                </label>
              </div>
            </section>
            <section className={painelMovimentacao}>
              <h3 className="font-bold">Destino por patrimônio</h3>
              <p className="mt-1 text-xs text-[#526580]">
                Cada bem pode ter um destino diferente. O responsável atual é
                informado pelo setor.
              </p>
              <div className="my-4 grid gap-3 lg:grid-cols-2">
                <div className="flex flex-wrap items-end gap-2">
                  <label className="grid min-w-0 flex-1 gap-2 text-sm">
                    Buscar setores de destino
                    <input
                      className={campoMovimentacao}
                      value={buscaSetor}
                      maxLength={200}
                      onChange={(e) => setBuscaSetor(e.target.value)}
                    />
                  </label>
                  <Button
                    type="button"
                    variant="outline"
                    disabled={setores.loading}
                    onClick={() =>
                      void carregarSetores({
                        contexto: "REGISTRO",
                        busca: buscaSetor.trim() || undefined,
                      })
                    }
                  >
                    Buscar setores
                  </Button>
                </div>
                <div className="flex flex-wrap items-end gap-2">
                  <label className="grid min-w-0 flex-1 gap-2 text-sm">
                    Destino para todos
                    <select
                      className={campoMovimentacao}
                      value={destinoTodos}
                      onChange={(e) => setDestinoTodos(e.target.value)}
                    >
                      <option value="">Selecione um destino</option>
                      {opcoesSetores.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.nome}
                        </option>
                      ))}
                    </select>
                  </label>
                  <Button
                    type="button"
                    variant="outline"
                    disabled={!destinoTodos}
                    onClick={aplicarTodos}
                  >
                    Aplicar a todos
                  </Button>
                </div>
              </div>
              <div className="mb-3 flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="outline"
                  disabled={
                    setores.loading ||
                    !setores.dados ||
                    setores.dados.meta.pagina <= 1
                  }
                  onClick={() =>
                    void carregarSetores({
                      contexto: "REGISTRO",
                      busca: buscaSetor.trim() || undefined,
                      pagina: String(setores.dados!.meta.pagina - 1),
                    })
                  }
                >
                  Setores anteriores
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  disabled={
                    setores.loading ||
                    !setores.dados ||
                    setores.dados.meta.pagina >= setores.dados.meta.ultimaPagina
                  }
                  onClick={() =>
                    void carregarSetores({
                      contexto: "REGISTRO",
                      busca: buscaSetor.trim() || undefined,
                      pagina: String(setores.dados!.meta.pagina + 1),
                    })
                  }
                >
                  Mais setores
                </Button>
              </div>
              {setores.loading ? (
                <p role="status">Carregando setores…</p>
              ) : setores.erro ? (
                <ErroMovimentacao erro={setores.erro} />
              ) : !setores.dados?.dados.length ? (
                <p>Nenhum setor ativo encontrado.</p>
              ) : null}
              <div className="grid divide-y divide-[#dce4ef]">
                {selecionados.map((item, i) => (
                  <article
                    key={item.bem.id}
                    className="grid min-w-0 gap-3 py-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]"
                  >
                    <div className="min-w-0 wrap-anywhere">
                      <p className="text-xs text-[#526580]">
                        {item.bem.numeroPatrimonio}
                      </p>
                      <h4 className="text-sm font-semibold">
                        {item.bem.descricao}
                      </h4>
                      <p className="mt-1 text-xs">
                        Origem: {item.bem.setorAtual.nome}
                      </p>
                      {item.bem.status !== "ATIVO" ? (
                        <p className="mt-1 text-sm text-red-800">
                          Este patrimônio ficou indisponível. Remova-o da
                          seleção.
                        </p>
                      ) : null}
                    </div>
                    <div className="grid min-w-0 gap-2">
                      <label className="grid gap-2 text-sm">
                        Destino do patrimônio {item.bem.numeroPatrimonio}
                        <select
                          className={campoMovimentacao}
                          value={item.destino?.id ?? ""}
                          aria-invalid={
                            !!campoErro(`itens.${i}.setorDestinoId`)
                          }
                          aria-describedby={`erro-destino-${i}`}
                          onChange={(e) =>
                            destinoItem(item.bem.id, e.target.value)
                          }
                        >
                          <option value="">Selecione o setor</option>
                          {opcoesSetores
                            .filter(
                              (s) => s.ativo && s.id !== item.bem.setorAtual.id,
                            )
                            .map((s) => (
                              <option value={s.id} key={s.id}>
                                {s.nome}
                              </option>
                            ))}
                        </select>
                      </label>
                      <p className="text-xs text-[#526580]">
                        Responsável atual:{" "}
                        {item.destino?.responsavelAtual.nome ??
                          "Definido pelo destino"}
                      </p>
                      <p
                        id={`erro-destino-${i}`}
                        className="text-sm text-red-800"
                      >
                        {campoErro(`itens.${i}.setorDestinoId`)}
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      aria-label={`Remover patrimônio ${item.bem.numeroPatrimonio}`}
                      onClick={() =>
                        setSelecionados((atuais) =>
                          atuais.filter((s) => s.bem.id !== item.bem.id),
                        )
                      }
                    >
                      <Trash2 size={15} aria-hidden="true" />
                      Remover
                    </Button>
                  </article>
                ))}
              </div>
            </section>
          </>
        ) : null}
        {etapa === 3 ? (
          <section className={painelMovimentacao}>
            <h3 className="font-bold">Revise antes de confirmar</h3>
            <dl className="my-4 grid gap-3 text-sm">
              <div>
                <dt className="text-[#526580]">Comissão</dt>
                <dd className="font-semibold">{comissao?.nome}</dd>
              </div>
              <div>
                <dt className="text-[#526580]">Motivo</dt>
                <dd className="whitespace-pre-wrap wrap-anywhere">
                  {observacao.trim()}
                </dd>
              </div>
            </dl>
            <ul className="grid divide-y divide-[#dce4ef]">
              {selecionados.map((item, i) => (
                <li key={item.bem.id} className="grid gap-2 py-4 text-sm">
                  <p className="font-semibold">
                    {item.bem.numeroPatrimonio} · {item.bem.descricao}
                  </p>
                  <p className="wrap-anywhere">
                    {item.bem.setorAtual.nome} → {item.destino?.nome}
                  </p>
                  {errosCampos
                    .filter((e) => e.campo.startsWith(`itens.${i}.`))
                    .map((e, j) => (
                      <p key={j} className="text-red-800">
                        {e.mensagem}
                      </p>
                    ))}
                  {errosCampos.some(
                    (e) =>
                      e.campo === `itens.${i}.setorOrigemEsperadoId` &&
                      e.codigo === "ORIGEM_ALTERADA",
                  ) ? (
                    <Button
                      type="button"
                      variant="outline"
                      disabled={atualizacao.pending}
                      onClick={() => void atualizarOrigem(item.bem.id)}
                    >
                      Atualizar e revisar origem do patrimônio{" "}
                      {item.bem.numeroPatrimonio}
                    </Button>
                  ) : null}
                </li>
              ))}
            </ul>
            <div className="mt-4 rounded-md bg-[#edf4fd] p-4 text-sm leading-relaxed">
              <p>
                Data e horário serão definidos pelo servidor ao confirmar, com
                exibição em São Paulo.
              </p>
              <p className="mt-1 font-semibold">
                Se qualquer item estiver impedido, nenhuma transferência desta
                confirmação será gravada.
              </p>
            </div>
          </section>
        ) : null}
      </fieldset>
      <footer
        className={`${painelMovimentacao} flex flex-wrap items-center justify-between gap-3`}
      >
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline">
            <Link prefetch={false} href="/movimentacoes">
              {desconhecido ? "Consultar movimentações" : "Cancelar"}
            </Link>
          </Button>
          {etapa > 1 ? (
            <Button
              type="button"
              variant="outline"
              disabled={desabilitado}
              onClick={() => irEtapa(etapa - 1)}
            >
              <ArrowLeft size={15} aria-hidden="true" />
              {etapa === 3 ? "Alterar destinos" : "Voltar aos bens"}
            </Button>
          ) : null}
        </div>
        {etapa === 1 ? (
          <Button
            type="button"
            disabled={!selecionados.length || desabilitado}
            onClick={() => irEtapa(2)}
          >
            Definir destinos
            <ArrowRight size={15} aria-hidden="true" />
          </Button>
        ) : etapa === 2 ? (
          <Button
            type="button"
            disabled={
              !selecionados.length ||
              selecionados.some((i) => i.bem.status !== "ATIVO") ||
              desabilitado
            }
            onClick={revisar}
          >
            Revisar movimentação
            <ArrowRight size={15} aria-hidden="true" />
          </Button>
        ) : (
          <Button
            type="button"
            disabled={
              desabilitado ||
              errosCampos.some((e) => e.codigo === "ORIGEM_ALTERADA")
            }
            onClick={() => void confirmar()}
          >
            <Plus size={15} aria-hidden="true" />
            {criacao.pending ? "Confirmando…" : "Confirmar movimentação"}
          </Button>
        )}
      </footer>
    </main>
  );
}
