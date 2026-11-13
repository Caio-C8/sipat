import type { Metadata } from "next";
import { headers } from "next/headers";
import Link from "next/link";
import {
  ListarEmprestimosQuerySchema,
  type ListarEmprestimosQueryInput,
} from "@repo/contracts";
import { Button } from "@/components/ui/button";
import { obterIdentidadeAtual } from "@/lib/auth/server-session";
import { serverEmprestimoOperations } from "@/features/emprestimos/api/server-emprestimo-operations";
import {
  botaoPrimarioEmprestimo,
  campoEmprestimo,
  dataExibicao,
  identificacaoEmprestimo,
  mensagemEmprestimo,
  painelEmprestimo,
  situacaoEmprestimo,
} from "@/features/emprestimos/apresentacao";

export const metadata: Metadata = { title: "Empréstimos" };
type Parametros = Record<string, string | string[] | undefined>;

export default async function EmprestimosPage({
  searchParams,
}: {
  searchParams: Promise<Parametros>;
}) {
  const identidade = await obterIdentidadeAtual();
  if (!identidade) return null;
  const entrada = Object.fromEntries(
    Object.entries(await searchParams).filter(
      ([, valor]) => typeof valor === "string" && valor !== "",
    ),
  ) as Record<string, string>;
  const aba =
    entrada.aba === "historico" || entrada.situacao === "CONCLUIDO"
      ? "historico"
      : "andamento";
  const filtros = { ...entrada };
  delete filtros.aba;
  delete filtros.situacao;
  const query: ListarEmprestimosQueryInput = {
    ...filtros,
    situacao: aba === "historico" ? "CONCLUIDO" : "EM_ANDAMENTO",
    ...(aba === "historico" ? { somenteAtrasados: undefined } : {}),
  };
  const validacao = ListarEmprestimosQuerySchema.safeParse(query);
  let resposta: Awaited<
    ReturnType<typeof serverEmprestimoOperations.listar>
  > | null = null;
  let erro: unknown = null;
  if (validacao.success) {
    try {
      resposta = await serverEmprestimoOperations.listar(query, {
        cookie: (await headers()).get("cookie") ?? "",
      });
    } catch (e) {
      erro = e;
    }
  }
  const consulta = new URLSearchParams({ ...filtros, aba });
  if (aba === "historico") consulta.delete("somenteAtrasados");
  const hrefAba = (destino: "andamento" | "historico") => {
    const proxima = new URLSearchParams(consulta);
    proxima.set("aba", destino);
    proxima.delete("pagina");
    if (destino === "historico") proxima.delete("somenteAtrasados");
    return `/emprestimos?${proxima}`;
  };
  const hrefPagina = (pagina: number) => {
    const proxima = new URLSearchParams(consulta);
    proxima.set("pagina", String(pagina));
    return `/emprestimos?${proxima}`;
  };
  return (
    <main className="grid min-w-0 gap-5 p-4 text-[#19355d] sm:p-7">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Empréstimos</h1>
          <p className="mt-1 text-sm text-[#526580]">
            Acompanhe os bens emprestados e as devoluções registradas.
          </p>
        </div>
        {identidade.perfil === "DIRETOR_PATRIMONIO" && (
          <Button asChild className={botaoPrimarioEmprestimo}>
            <Link prefetch={false} href="/emprestimos/nova">
              Novo empréstimo
            </Link>
          </Button>
        )}
      </header>
      <nav
        className="flex rounded-xl border border-[#e1e7ef] bg-white px-4"
        aria-label="Situação dos empréstimos"
      >
        {(["andamento", "historico"] as const).map((destino) => (
          <Link
            key={destino}
            href={hrefAba(destino)}
            aria-current={aba === destino ? "page" : undefined}
            className={`min-w-32 border-b-2 px-3 py-3 text-center text-sm font-semibold ${aba === destino ? "border-blue-600 text-blue-700" : "border-transparent text-[#526580]"}`}
          >
            {destino === "andamento" ? "Em andamento" : "Histórico"}
          </Link>
        ))}
      </nav>
      <form
        action="/emprestimos"
        method="get"
        className={painelEmprestimo}
        aria-label="Filtros de empréstimos"
      >
        <input type="hidden" name="aba" value={aba} />
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-[minmax(18rem,2fr)_repeat(2,minmax(10rem,1fr))_auto] xl:items-end">
          <label className="text-sm">
            Destinatário, patrimônio ou empréstimo
            <input
              className={campoEmprestimo}
              name="busca"
              defaultValue={filtros.busca ?? ""}
              placeholder="Buscar empréstimo"
            />
          </label>
          <label className="text-sm">
            Saída desde
            <input
              className={campoEmprestimo}
              type="date"
              name="dataInicio"
              defaultValue={filtros.dataInicio ?? ""}
            />
          </label>
          <label className="text-sm">
            Saída até
            <input
              className={campoEmprestimo}
              type="date"
              name="dataFim"
              defaultValue={filtros.dataFim ?? ""}
            />
          </label>
          <Button
            type="submit"
            className={`min-h-10 ${botaoPrimarioEmprestimo}`}
          >
            Consultar
          </Button>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-5 text-sm">
          {aba === "andamento" && (
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                name="somenteAtrasados"
                value="true"
                defaultChecked={filtros.somenteAtrasados === "true"}
              />
              Somente atrasados
            </label>
          )}
          <Link className="underline" href={`/emprestimos?aba=${aba}`}>
            Limpar filtros
          </Link>
        </div>
      </form>
      {!validacao.success ? (
        <p role="alert" className="rounded-md bg-red-50 p-4 text-red-900">
          Confira os filtros informados.
        </p>
      ) : erro ? (
        <p role="alert" className="rounded-md bg-red-50 p-4 text-red-900">
          {mensagemEmprestimo(erro)}
        </p>
      ) : (
        resposta && (
          <section
            className={painelEmprestimo}
            aria-labelledby="lista-emprestimos-title"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 id="lista-emprestimos-title" className="font-bold">
                {aba === "andamento"
                  ? "Empréstimos em andamento"
                  : "Histórico de empréstimos"}
              </h2>
              <p className="text-sm text-[#526580]">
                {resposta.meta.total} registro(s)
              </p>
            </div>
            {resposta.dados.length ? (
              <div
                className="mt-4 overflow-x-auto"
                role="region"
                aria-label="Lista de empréstimos"
                tabIndex={0}
              >
                <table className="w-full min-w-[780px] text-left text-sm">
                  <caption className="sr-only">
                    Empréstimos mais recentes primeiro
                  </caption>
                  <thead className="bg-[#f7f9fc] text-xs uppercase text-[#526580]">
                    <tr>
                      {[
                        "Empréstimo / destinatário",
                        "Agrupamento",
                        "Bens pendentes",
                        "Devolução prevista",
                        "Situação",
                        "Ação",
                      ].map((titulo) => (
                        <th scope="col" className="p-3" key={titulo}>
                          {titulo}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {resposta.dados.map((item) => {
                      const situacao = situacaoEmprestimo(item);
                      const detalhe = new URLSearchParams({
                        origem: consulta.toString(),
                      });
                      return (
                        <tr
                          key={item.id}
                          className="border-b border-[#e4eaf2] last:border-0"
                        >
                          <td className="p-3">
                            <strong>{identificacaoEmprestimo(item.id)}</strong>
                            <span className="sr-only">
                              Identificador completo: {item.id}
                            </span>
                            <p className="mt-1 break-words text-[#526580]">
                              {item.destinatario ?? "Não informado"}
                            </p>
                          </td>
                          <td className="p-3">
                            {item.modoAgrupamento === "EM_GRUPO"
                              ? "Em grupo"
                              : item.modoAgrupamento === "SEPARADAMENTE"
                                ? "Separadamente"
                                : "Não informado"}
                          </td>
                          <td className="p-3 font-semibold">
                            {item.pendentes} de {item.total}
                          </td>
                          <td className="p-3">
                            {dataExibicao(item.dataPrevistaDevolucao)}
                          </td>
                          <td className="p-3">
                            <span
                              className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${situacao.classe}`}
                            >
                              {situacao.texto}
                            </span>
                          </td>
                          <td className="p-3">
                            <Link
                              className="inline-flex rounded-md border border-[#dce5f0] px-3 py-2 font-semibold hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-blue-600"
                              prefetch={false}
                              href={`/emprestimos/${item.id}?${detalhe}`}
                            >
                              Abrir
                            </Link>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="mt-4 rounded-lg bg-[#f7f9fc] p-5 text-sm">
                Nenhum empréstimo encontrado para esta consulta.
              </p>
            )}
            <nav
              className="mt-5 flex flex-wrap items-center gap-4 text-sm"
              aria-label="Paginação"
            >
              <span>
                Página {resposta.meta.pagina} de {resposta.meta.ultimaPagina}
              </span>
              {resposta.meta.pagina > 1 && (
                <Link
                  className="underline"
                  href={hrefPagina(resposta.meta.pagina - 1)}
                >
                  Página anterior
                </Link>
              )}
              {resposta.meta.pagina < resposta.meta.ultimaPagina && (
                <Link
                  className="underline"
                  href={hrefPagina(resposta.meta.pagina + 1)}
                >
                  Próxima página
                </Link>
              )}
            </nav>
          </section>
        )
      )}
    </main>
  );
}
