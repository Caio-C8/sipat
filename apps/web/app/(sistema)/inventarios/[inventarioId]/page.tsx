import type { Metadata } from "next";
import { headers } from "next/headers";
import Link from "next/link";
import {
  InventarioParamsSchema,
  ListarItensInventarioQuerySchema,
} from "@repo/contracts";
import { serverInventarioOperations } from "@/features/inventarios/api/server-inventario-operations";
import { ResolverCorrecaoDialog } from "@/features/inventarios/components/resolver-correcao-dialog";
import { isApiError } from "@/lib/api/core/api-error";
import { obterIdentidadeAtual } from "@/lib/auth/server-session";

export const metadata: Metadata = { title: "Detalhe do inventário" };
const painel = "rounded-xl border border-[#dfe7f1] bg-white p-5";
const data = (valor: string | null) =>
  valor
    ? new Intl.DateTimeFormat("pt-BR", {
        dateStyle: "short",
        timeStyle: "short",
        timeZone: "America/Sao_Paulo",
      }).format(new Date(valor))
    : "—";

export default async function InventarioDetalhePage({
  params,
  searchParams,
}: {
  params: Promise<{ inventarioId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const identidade = await obterIdentidadeAtual();
  if (!identidade) return null;
  const { inventarioId } = await params;
  if (!InventarioParamsSchema.safeParse({ inventarioId }).success)
    return (
      <main className="p-7">
        <h1 className="text-2xl font-bold">Inventário não encontrado</h1>
        <Link className="mt-4 inline-block underline" href="/inventarios">
          Voltar aos inventários
        </Link>
      </main>
    );
  const paramsTela = await searchParams;
  const visao =
    typeof paramsTela.visao === "string" ? paramsTela.visao : "pendentes";
  const busca =
    typeof paramsTela.busca === "string" ? paramsTela.busca : undefined;
  const pagina =
    typeof paramsTela.pagina === "string" ? paramsTela.pagina : "1";
  const query = {
    pagina,
    limite: "50",
    ...(busca ? { busca } : {}),
    ...(visao === "pendentes"
      ? { statusCorrecao: "PENDENTE" as const }
      : visao === "nao-localizados"
        ? { situacao: "NAO_LOCALIZADO" as const }
        : {}),
  };
  const queryValidada = ListarItensInventarioQuerySchema.safeParse(query);
  const cookie = (await headers()).get("cookie") ?? "";
  let detalhe: Awaited<
    ReturnType<typeof serverInventarioOperations.consultar>
  > | null = null;
  let itens: Awaited<
    ReturnType<typeof serverInventarioOperations.itens>
  > | null = null;
  let erro = "";
  try {
    if (!queryValidada.success) throw new Error("Filtros inválidos.");
    const resultados = await Promise.all([
      serverInventarioOperations.consultar(inventarioId, { cookie }),
      serverInventarioOperations.itens(inventarioId, query, { cookie }),
    ]);
    detalhe = resultados[0];
    itens = resultados[1];
  } catch (falha) {
    erro = isApiError(falha)
      ? falha.message
      : "Não foi possível consultar este inventário.";
  }
  const hrefVisao = (v: string, p = "1") =>
    `/inventarios/${inventarioId}?${new URLSearchParams({ visao: v, ...(busca ? { busca } : {}), pagina: p })}`;
  return (
    <main className="grid min-w-0 gap-5 p-4 text-[#17253d] sm:p-7">
      <Link
        className="text-sm font-medium text-[#526580] hover:underline"
        href="/inventarios"
      >
        ← Todos os inventários
      </Link>
      {erro ? (
        <p role="alert" className="rounded-md bg-red-50 p-4 text-red-900">
          {erro}
        </p>
      ) : detalhe && itens ? (
        <>
          <header>
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold">{detalhe.dados.nome}</h1>
                <p className="mt-2 text-sm text-[#627996]">
                  {detalhe.dados.comissao.nome} · Criado{" "}
                  {data(detalhe.dados.createdAt)}
                </p>
              </div>
              <span className="rounded-full bg-[#eef5ff] px-3 py-1 text-sm font-semibold text-[#203e66]">
                {detalhe.dados.status === "FINALIZADO"
                  ? "Finalizado"
                  : detalhe.dados.status === "EM_ANDAMENTO"
                    ? "Em andamento"
                    : "Pendente"}
              </span>
            </div>
          </header>
          <section
            className={`${painel} grid gap-4 sm:grid-cols-4`}
            aria-label="Resumo do inventário"
          >
            <div>
              <span className="text-xs text-[#627996]">Setores incluídos</span>
              <p className="mt-1 text-xl font-bold">
                {detalhe.dados.progresso.totalSetores}
              </p>
            </div>
            <div>
              <span className="text-xs text-[#627996]">Bens incluídos</span>
              <p className="mt-1 text-xl font-bold">
                {detalhe.dados.progresso.totalItens}
              </p>
            </div>
            <div>
              <span className="text-xs text-[#627996]">Bens verificados</span>
              <p className="mt-1 text-xl font-bold">
                {detalhe.dados.progresso.itensVerificados}
              </p>
            </div>
            <div>
              <span className="text-xs text-[#627996]">
                Correções pendentes
              </span>
              <p className="mt-1 text-xl font-bold">
                {detalhe.dados.progresso.correcoesPendentes}
              </p>
            </div>
          </section>
          <section className={`${painel} min-h-[440px]`}>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <nav
                className="flex flex-wrap gap-2"
                aria-label="Filtros de itens"
              >
                <Link
                  aria-current={visao === "pendentes" ? "page" : undefined}
                  className={`rounded-md px-3 py-2 text-sm font-semibold ${visao === "pendentes" ? "bg-[#eef5ff] text-blue-700" : "text-[#627996]"}`}
                  href={hrefVisao("pendentes")}
                >
                  Correções pendentes
                </Link>
                <Link
                  aria-current={visao === "todos" ? "page" : undefined}
                  className={`rounded-md px-3 py-2 text-sm font-semibold ${visao === "todos" ? "bg-[#eef5ff] text-blue-700" : "text-[#627996]"}`}
                  href={hrefVisao("todos")}
                >
                  Todos os itens
                </Link>
                <Link
                  aria-current={
                    visao === "nao-localizados" ? "page" : undefined
                  }
                  className={`rounded-md px-3 py-2 text-sm font-semibold ${visao === "nao-localizados" ? "bg-[#eef5ff] text-blue-700" : "text-[#627996]"}`}
                  href={hrefVisao("nao-localizados")}
                >
                  Não localizados
                </Link>
              </nav>
              <form
                action={`/inventarios/${inventarioId}`}
                method="get"
                className="flex gap-2"
              >
                <input type="hidden" name="visao" value={visao} />
                <label className="sr-only" htmlFor="busca-itens">
                  Buscar bens
                </label>
                <input
                  id="busca-itens"
                  name="busca"
                  defaultValue={busca ?? ""}
                  placeholder="Patrimônio ou descrição"
                  className="rounded-md border border-[#d8e1ed] px-3 py-2 text-sm"
                />
                <button className="rounded-md border border-[#d8e1ed] px-3 text-sm font-semibold">
                  Buscar
                </button>
              </form>
            </div>
            <p className="mt-3 text-right text-xs text-[#627996]">
              {itens.meta.total} itens nesta consulta
            </p>
            {itens.dados.length ? (
              <div
                className="mt-4 overflow-x-auto"
                role="region"
                aria-label="Itens do inventário"
                tabIndex={0}
              >
                <table className="w-full min-w-[900px] text-left text-sm">
                  <thead className="bg-[#f6f8fb] text-xs uppercase text-[#627996]">
                    <tr>
                      <th className="p-3">Patrimônio / bem</th>
                      <th className="p-3">Resultado</th>
                      <th className="p-3">Setor cadastrado</th>
                      <th className="p-3">Setor encontrado</th>
                      <th className="p-3">Correção</th>
                      <th className="p-3">Ação</th>
                    </tr>
                  </thead>
                  <tbody>
                    {itens.dados.map((item) => {
                      const corrigivel =
                        item.situacao === "DIVERGENCIA" ||
                        item.situacao === "NAO_LOCALIZADO";
                      const setorEncontrado =
                        item.situacao === "DIVERGENCIA"
                          ? item.setorEncontrado.nome
                          : item.situacao === "NAO_LOCALIZADO"
                            ? (item.localizacaoPosterior?.setorEncontrado
                                .nome ?? "—")
                            : "—";
                      const estado =
                        item.situacao === null
                          ? "Aguardando conferência"
                          : item.situacao === "DIVERGENCIA"
                            ? item.statusCorrecao === "PENDENTE"
                              ? "Pendente"
                              : "Corrigido"
                            : item.situacao === "NAO_LOCALIZADO"
                              ? item.localizacaoPosterior?.statusCorrecao ===
                                "PENDENTE"
                                ? "Localizado depois · pendente"
                                : item.localizacaoPosterior
                                  ? "Localizado depois · corrigido"
                                  : "Não localizado"
                              : "Correto";
                      return (
                        <tr key={item.id} className="border-b border-[#e4eaf2]">
                          <td className="p-4">
                            <span className="text-xs text-[#627996]">
                              {item.patrimonio.numeroPatrimonio}
                            </span>
                            <strong className="mt-1 block">
                              {item.patrimonio.descricao}
                            </strong>
                          </td>
                          <td className="p-4">
                            {item.situacao === "DIVERGENCIA"
                              ? "Setor divergente"
                              : item.situacao === "NAO_LOCALIZADO"
                                ? "Não localizado"
                                : item.situacao === "CORRETO"
                                  ? "Correto"
                                  : "Pendente"}
                          </td>
                          <td className="p-4">{item.setorEsperado.nome}</td>
                          <td className="p-4">{setorEncontrado}</td>
                          <td className="p-4">{estado}</td>
                          <td className="p-4">
                            {corrigivel ? (
                              <ResolverCorrecaoDialog
                                inventarioId={inventarioId}
                                item={item}
                                bloqueado={
                                  detalhe.dados.status === "FINALIZADO" ||
                                  identidade.perfil !== "DIRETOR_PATRIMONIO"
                                }
                              />
                            ) : (
                              "—"
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="py-12 text-center text-sm text-[#627996]">
                Nenhum item encontrado nesta consulta.
              </p>
            )}
            <nav
              className="mt-5 flex justify-between"
              aria-label="Paginação de itens"
            >
              {itens.meta.pagina > 1 ? (
                <Link
                  className="underline"
                  href={hrefVisao(visao, String(itens.meta.pagina - 1))}
                >
                  Anterior
                </Link>
              ) : (
                <span />
              )}
              {itens.meta.pagina < itens.meta.ultimaPagina && (
                <Link
                  className="underline"
                  href={hrefVisao(visao, String(itens.meta.pagina + 1))}
                >
                  Próxima
                </Link>
              )}
            </nav>
          </section>
          <aside className="rounded-lg bg-[#eef5ff] p-4 text-sm text-[#35577e]">
            <strong className="block text-[#203e66]">
              A conferência ocorre no aplicativo móvel
            </strong>
            O resultado original permanece no histórico. Um bem não localizado
            só pode ser corrigido após a equipe móvel registrar onde ele foi
            encontrado.
          </aside>
        </>
      ) : null}
    </main>
  );
}
