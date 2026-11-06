"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Check,
  CircleAlert,
  Search,
  TrendingDown,
} from "lucide-react";
import type {
  ComissaoOpcaoReavaliacao,
  ListarDepreciacoesPendentesResponse,
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
  useExecutarDepreciacaoIndividual,
  useExecutarDepreciacoesEmMassa,
} from "../api/hooks";

type ItemPendente = ListarDepreciacoesPendentesResponse["dados"][number];
type AlvoConfirmacao =
  { tipo: "LOTE" } | { tipo: "INDIVIDUAL"; item: ItemPendente };

const campo =
  "min-h-10 min-w-0 w-full rounded-md border border-[#dce5f0] bg-white px-3 py-2 text-sm text-[#17253d] focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[#2863ec] disabled:bg-[#eef2f7]";
const dinheiro = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});
const statusPatrimonio: Record<ItemPendente["status"], string> = {
  ATIVO: "Ativo",
  EMPRESTADO: "Emprestado",
  EM_MANUTENCAO: "Em manutenção",
};

function moeda(valor: string) {
  return dinheiro.format(Number(valor));
}

function mensagemErro(erro: unknown) {
  if (isApiError(erro)) {
    if (erro.status === 401)
      return "Sua sessão expirou. Entre novamente para continuar.";
    if (erro.status === 403)
      return "Seu perfil não tem permissão para processar depreciações.";
    if (erro.codigo === "COMPETENCIA_NAO_CORRENTE")
      return "A competência mudou. Atualize a página para consultar o mês atual.";
    if (erro.codigo === "COMISSAO_INVALIDA")
      return "A comissão selecionada não está vigente. Atualize a página e escolha uma comissão vigente.";
    if (erro.codigo === "CONFIRMACAO_VALOR_RESIDUAL_NECESSARIA")
      return "Confirme que os bens que já chegaram ao valor residual serão ignorados e tente novamente.";
    if (erro.codigo === "ESTADO_CONTABIL_INCONSISTENTE")
      return "A API encontrou dados contábeis inconsistentes. Nenhum processamento parcial foi mantido.";
    if (erro.codigo === "CONFLITO_CONCORRENTE")
      return "Outro processamento alterou os bens ao mesmo tempo. Atualize a consulta antes de tentar novamente.";
    if (
      erro.categoria === "rede" ||
      erro.categoria === "timeout" ||
      erro.status === null
    ) {
      return "Não foi possível confirmar o resultado. Atualize a página e confira os bens antes de tentar de novo.";
    }
    return erro.erros.length
      ? erro.erros.map((item) => `${item.campo}: ${item.mensagem}`).join(" ")
      : erro.message;
  }
  return "Não foi possível processar a depreciação. Atualize a consulta antes de tentar novamente.";
}

function motivoInelegibilidade(motivo: string) {
  const motivos: Record<string, string> = {
    BAIXADO: "Patrimônio baixado",
    SEM_PARAMETRO_VIGENTE: "Sem parâmetro vigente",
    DATA_INICIO_NAO_ATINGIDA:
      "A depreciação começa no mês seguinte ao cadastro dos parâmetros",
    JA_DEPRECIADO_NA_COMPETENCIA: "Já depreciado nesta competência",
    VALOR_RESIDUAL_ATINGIDO: "Valor residual já atingido",
  };
  return motivos[motivo] ?? "O patrimônio não é elegível nesta competência.";
}

export function ProcessamentoDepreciacoes({
  resposta,
  competencia,
  comissoes,
  erroComissoes,
}: {
  resposta: ListarDepreciacoesPendentesResponse;
  competencia: string;
  comissoes: ComissaoOpcaoReavaliacao[];
  erroComissoes: string;
}) {
  const router = useRouter();
  const lote = useExecutarDepreciacoesEmMassa();
  const individual = useExecutarDepreciacaoIndividual();
  const mutacaoEmAndamento = useRef(false);
  const [comissaoId, setComissaoId] = useState(comissoes[0]?.id ?? "");
  const [busca, setBusca] = useState("");
  const [confirmarResidual, setConfirmarResidual] = useState(false);
  const [alvo, setAlvo] = useState<AlvoConfirmacao | null>(null);
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");
  const [detalhes, setDetalhes] = useState<string[]>([]);
  const pendente = lote.pending || individual.pendingId !== null;
  const elegiveis = resposta.dados.filter((item) => {
    const texto =
      `${item.numeroPatrimonio} ${item.descricao}`.toLocaleLowerCase("pt-BR");
    return texto.includes(busca.trim().toLocaleLowerCase("pt-BR"));
  });
  const quantidadeResidual = resposta.resumo.totalNoValorResidual;

  function abrirConfirmacao(proxima: AlvoConfirmacao) {
    setErro("");
    setSucesso("");
    setDetalhes([]);
    setAlvo(proxima);
  }

  async function confirmarExecucao() {
    if (!alvo || !comissaoId || pendente || mutacaoEmAndamento.current) return;
    mutacaoEmAndamento.current = true;
    setErro("");
    setSucesso("");
    try {
      if (alvo.tipo === "LOTE") {
        const resultado = await lote.executar({
          competencia,
          comissaoId,
          confirmarIgnorarValorResidual: confirmarResidual,
        });
        const dados = resultado.dados;
        setSucesso(
          `${dados.quantidadeProcessada} bem(ns) processado(s); ${dados.quantidadeAtingiuValorResidual} atingiu/atingiram o valor residual.`,
        );
        setDetalhes([
          `Baixados: ${dados.quantidadesInelegiveis.baixado}`,
          `Sem parâmetro vigente: ${dados.quantidadesInelegiveis.semParametroVigente}`,
          `Parâmetro ainda não iniciado: ${dados.quantidadesInelegiveis.dataInicioNaoAtingida}`,
          `Já depreciados nesta competência: ${dados.quantidadesInelegiveis.jaDepreciadoNaCompetencia}`,
          `Já no valor residual: ${dados.quantidadesInelegiveis.valorResidualAtingido}`,
        ]);
      } else {
        const resultado = await individual.executar(alvo.item.patrimonioId, {
          competencia,
          comissaoId,
          confirmarIgnorarValorResidual: false,
        });
        if (resultado.dados.resultado === "DEPRECIADO") {
          setSucesso(
            `${alvo.item.numeroPatrimonio} processado: ${moeda(resultado.dados.valorContabilAnterior)} − ${moeda(resultado.dados.valorDepreciado)} = ${moeda(resultado.dados.valorContabilNovo)}.`,
          );
        } else {
          setSucesso(
            `${alvo.item.numeroPatrimonio}: ${motivoInelegibilidade(resultado.dados.motivo)}.`,
          );
        }
      }
      setAlvo(null);
      setConfirmarResidual(false);
      router.refresh();
    } catch (falha) {
      setErro(mensagemErro(falha));
      setAlvo(null);
    } finally {
      mutacaoEmAndamento.current = false;
    }
  }

  const tituloCompetencia = (() => {
    const [ano, mes] = competencia.split("-").map(Number);
    return new Intl.DateTimeFormat("pt-BR", {
      month: "long",
      year: "numeric",
      timeZone: "UTC",
    }).format(new Date(Date.UTC(ano!, mes! - 1, 1)));
  })();

  return (
    <>
      <main className="mx-auto grid w-full min-w-0 max-w-[1900px] gap-5 px-4 py-5 text-[#17253d] sm:px-7 sm:py-6">
        <header>
          <h1 className="text-2xl font-bold text-[#111d34] sm:text-3xl">
            Depreciação
          </h1>
          <p className="mt-1 text-sm text-[#7188a5]">
            Consulte os bens elegíveis e processe a competência de{" "}
            {tituloCompetencia}, individualmente ou em lote.
          </p>
        </header>

        <section
          className="grid gap-4 rounded-lg border border-[#dfe7f1] bg-white p-5 sm:grid-cols-[minmax(200px,260px)_1fr] sm:items-center"
          aria-label="Competência e método"
        >
          <label className="grid gap-2 text-xs font-medium text-[#526b8c]">
            Competência
            <input
              className={campo}
              type="month"
              value={competencia}
              readOnly
              aria-readonly="true"
            />
          </label>
          <div>
            <h2 className="font-bold text-[#203b61]">
              Método linear · cálculo automático
            </h2>
            <p className="mt-2 text-sm text-[#7188a5]">
              Os parâmetros vêm do cadastro do patrimônio. A competência
              processável é sempre o mês atual.
            </p>
          </div>
        </section>

        <section
          className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3"
          aria-label="Resumo da competência"
        >
          <article className="rounded-lg border border-[#dfe7f1] bg-white p-4">
            <p className="text-xs text-[#7188a5]">Bens elegíveis</p>
            <p className="mt-1 text-2xl font-bold text-[#203b61]">
              {resposta.resumo.totalElegiveis}
            </p>
            <p className="mt-1 text-xs text-[#7188a5]">
              A API revalida todo o acervo ao confirmar o lote.
            </p>
          </article>
          <article className="rounded-lg border border-[#dfe7f1] bg-white p-4">
            <p className="text-xs text-[#7188a5]">Na página atual</p>
            <p className="mt-1 text-2xl font-bold text-[#2863ec]">
              {resposta.dados.length}
            </p>
            <p className="mt-1 text-xs text-[#7188a5]">
              A quota prevista aparece por patrimônio na lista.
            </p>
          </article>
          <article className="rounded-lg border border-[#f4d78e] bg-[#fffbec] p-4">
            <p className="text-xs font-semibold text-[#9a4a08]">
              Já no valor residual
            </p>
            <p className="mt-1 text-2xl font-bold text-[#9a4a08]">
              {quantidadeResidual}
            </p>
            <p className="mt-1 text-xs text-[#8d5a2a]">
              Esses bens não serão depreciados novamente.
            </p>
          </article>
        </section>

        <section className="grid gap-4 rounded-lg border border-[#dfe7f1] bg-white p-5 md:grid-cols-[minmax(0,1fr)_minmax(260px,0.6fr)] md:items-end">
          <div>
            <label
              htmlFor="comissao-depreciacao"
              className="text-xs font-medium text-[#526b8c]"
            >
              Comissão vigente para o processamento *
            </label>
            <select
              id="comissao-depreciacao"
              className={`${campo} mt-1`}
              value={comissaoId}
              onChange={(event) => setComissaoId(event.target.value)}
              disabled={pendente || comissoes.length === 0}
            >
              <option value="">
                {comissoes.length
                  ? "Selecione uma comissão"
                  : "Nenhuma comissão vigente"}
              </option>
              {comissoes.map((comissao) => (
                <option key={comissao.id} value={comissao.id}>
                  {comissao.nome}
                </option>
              ))}
            </select>
            {erroComissoes ? (
              <p role="alert" className="mt-2 text-sm text-red-800">
                {erroComissoes}
              </p>
            ) : null}
            {!erroComissoes && comissoes.length === 0 ? (
              <p className="mt-2 text-sm text-[#8d5a2a]">
                Não há comissão vigente para registrar esta operação.
              </p>
            ) : null}
          </div>
          <p className="text-xs leading-5 text-[#7188a5]">
            A comissão é obrigatória e será validada novamente pela API antes de
            gravar o processamento.
          </p>
        </section>

        {erro ? (
          <div
            role="alert"
            className="flex gap-2 rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-900"
          >
            <CircleAlert className="mt-0.5 size-4 shrink-0" />
            {erro}
          </div>
        ) : null}
        {sucesso ? (
          <div
            role="status"
            className="rounded-md border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900"
          >
            <p className="flex items-center gap-2 font-semibold">
              <Check className="size-4" />
              {sucesso}
            </p>
            {detalhes.length ? (
              <ul className="mt-2 grid gap-1 sm:grid-cols-2">
                {detalhes.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            ) : null}
          </div>
        ) : null}

        <section
          className="min-w-0 rounded-lg border border-[#dfe7f1] bg-white p-4 sm:p-5"
          aria-labelledby="bens-elegiveis-heading"
        >
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 id="bens-elegiveis-heading" className="text-lg font-bold">
                Bens elegíveis para depreciação
              </h2>
              <p className="mt-1 text-sm text-[#7188a5]">
                {resposta.meta.total} bem(ns) nesta competência
              </p>
            </div>
            <label className="relative w-full sm:max-w-sm">
              <span className="sr-only">Pesquisar nesta página</span>
              <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-[#7188a5]" />
              <input
                className={`${campo} pl-9`}
                type="search"
                value={busca}
                onChange={(event) => setBusca(event.target.value)}
                placeholder="Pesquisar nesta página"
              />
            </label>
          </div>
          {elegiveis.length === 0 ? (
            <p
              role="status"
              className="rounded-md bg-[#f7f9fc] p-8 text-center text-sm text-[#7188a5]"
            >
              {resposta.dados.length
                ? "Nenhum bem desta página corresponde à busca."
                : "Não há bens pendentes para esta competência."}
            </p>
          ) : (
            <div
              className="overflow-x-auto"
              role="region"
              aria-label="Bens elegíveis para depreciação"
              tabIndex={0}
            >
              <table className="w-full min-w-[980px] text-left text-sm">
                <thead className="bg-[#f7f9fc] text-xs uppercase text-[#7188a5]">
                  <tr>
                    <th scope="col" className="p-3">
                      Patrimônio / bem
                    </th>
                    <th scope="col" className="p-3">
                      Situação
                    </th>
                    <th scope="col" className="p-3">
                      Valor líquido
                    </th>
                    <th scope="col" className="p-3">
                      Quota prevista
                    </th>
                    <th scope="col" className="p-3">
                      Valor residual
                    </th>
                    <th scope="col" className="p-3">
                      <span className="sr-only">Ação</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {elegiveis.map((item) => (
                    <tr
                      key={item.patrimonioId}
                      className="border-b border-[#e4ebf4] hover:bg-[#f9fbfd]"
                    >
                      <td className="p-3">
                        <strong className="text-[#203b61]">
                          {item.descricao}
                        </strong>
                        <small className="mt-1 block text-[#7188a5]">
                          {item.numeroPatrimonio}
                        </small>
                      </td>
                      <td className="p-3">{statusPatrimonio[item.status]}</td>
                      <td className="p-3 font-medium">
                        {moeda(item.valorLiquidoAtual)}
                      </td>
                      <td className="p-3 font-bold text-[#2863ec]">
                        {moeda(item.quotaPrevista)}
                        <small className="mt-1 block font-normal text-[#7188a5]">
                          {item.vidaUtilRestanteMeses} meses restantes
                        </small>
                      </td>
                      <td className="p-3 font-medium">
                        {moeda(item.valorResidual)}
                        {item.atingiraValorResidual ? (
                          <small className="mt-1 block font-semibold text-[#9a4a08]">
                            Atingirá este mês
                          </small>
                        ) : null}
                      </td>
                      <td className="p-3 text-right">
                        <Button
                          type="button"
                          variant="outline"
                          disabled={pendente || !comissaoId}
                          onClick={() =>
                            abrirConfirmacao({ tipo: "INDIVIDUAL", item })
                          }
                          className="min-h-10 gap-2 px-4"
                        >
                          <TrendingDown className="size-4" /> Processar bem
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-[#e4ebf4] pt-4">
            <p className="max-w-2xl text-xs leading-5 text-[#7188a5]">
              O processamento em lote inclui todos os bens elegíveis da
              competência, mesmo os que não aparecem nesta página. A operação é
              confirmada como uma unidade.
            </p>
            <div className="flex flex-wrap items-center gap-4">
              {resposta.meta.ultimaPagina > 1 ? (
                <nav
                  aria-label="Paginação de bens elegíveis"
                  className="flex items-center gap-3 text-sm"
                >
                  {resposta.meta.pagina > 1 ? (
                    <Link
                      className="underline"
                      href={`/depreciacao?pagina=${resposta.meta.pagina - 1}`}
                    >
                      Anterior
                    </Link>
                  ) : (
                    <span className="text-slate-400">Anterior</span>
                  )}
                  <span>
                    {resposta.meta.pagina} de {resposta.meta.ultimaPagina}
                  </span>
                  {resposta.meta.pagina < resposta.meta.ultimaPagina ? (
                    <Link
                      className="underline"
                      href={`/depreciacao?pagina=${resposta.meta.pagina + 1}`}
                    >
                      Próxima
                    </Link>
                  ) : (
                    <span className="text-slate-400">Próxima</span>
                  )}
                </nav>
              ) : null}
              <Button
                type="button"
                disabled={
                  pendente ||
                  !comissaoId ||
                  resposta.resumo.totalElegiveis === 0 ||
                  (quantidadeResidual > 0 && !confirmarResidual)
                }
                onClick={() => abrirConfirmacao({ tipo: "LOTE" })}
                className="min-h-10 gap-2 bg-[#203b61] px-5 text-white hover:bg-[#31537f]"
              >
                <Check className="size-4" />{" "}
                {lote.pending
                  ? "Processando…"
                  : "Confirmar depreciação em lote"}
              </Button>
            </div>
          </div>
          {quantidadeResidual > 0 ? (
            <label className="mt-4 flex max-w-3xl items-start gap-3 rounded-md border border-[#f4d78e] bg-[#fffbec] p-3 text-sm text-[#70430c]">
              <input
                className="mt-1 size-4 accent-[#b45b0a]"
                type="checkbox"
                checked={confirmarResidual}
                onChange={(event) => setConfirmarResidual(event.target.checked)}
                disabled={pendente}
              />
              <span>
                Confirmo que os {quantidadeResidual} bem(ns) que já chegaram ao
                valor residual devem ser ignorados neste lote.
              </span>
            </label>
          ) : null}
        </section>

        <aside className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-[#eef5ff] p-4 text-sm text-[#38577f]">
          <div>
            <h2 className="font-semibold">Parâmetros de depreciação</h2>
            <p className="mt-1">
              A reavaliação é a operação que altera valor bruto, residual e vida
              útil do bem.
            </p>
          </div>
          <Button asChild variant="outline" className="min-h-10 gap-2">
            <Link href="/reavaliacoes">
              Consultar reavaliações <ArrowRight className="size-4" />
            </Link>
          </Button>
        </aside>
      </main>

      <Dialog
        open={alvo !== null}
        onOpenChange={(open) => {
          if (!open && !pendente) setAlvo(null);
        }}
      >
        <DialogContent closeDisabled={pendente}>
          <DialogHeader>
            <DialogTitle>
              {alvo?.tipo === "LOTE"
                ? "Confirmar depreciação em lote"
                : "Confirmar depreciação do bem"}
            </DialogTitle>
            <DialogDescription>
              {alvo?.tipo === "LOTE"
                ? `A API recalculará todos os bens elegíveis da competência ${competencia} e registrará o resultado atomicamente.`
                : `Será registrada a quota da competência ${competencia} para ${alvo?.tipo === "INDIVIDUAL" ? `${alvo.item.numeroPatrimonio} · ${alvo.item.descricao}` : "o bem selecionado"}.`}
            </DialogDescription>
          </DialogHeader>
          {alvo?.tipo === "LOTE" && quantidadeResidual > 0 ? (
            <p className="rounded-md bg-[#fffbec] p-3 text-sm text-[#70430c]">
              Os {quantidadeResidual} bem(ns) já no valor residual serão
              ignorados; nenhum bem fora da competência atual será processado.
            </p>
          ) : null}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={pendente}
              onClick={() => setAlvo(null)}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              disabled={pendente}
              onClick={() => void confirmarExecucao()}
              className="bg-[#203b61] text-white hover:bg-[#31537f]"
            >
              {pendente ? "Processando…" : "Confirmar processamento"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
