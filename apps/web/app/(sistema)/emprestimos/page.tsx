import type { Metadata } from "next";
import { headers } from "next/headers";
import Link from "next/link";
import { ListarEmprestimosQuerySchema } from "@repo/contracts";
import { Button } from "@/components/ui/button";
import { obterIdentidadeAtual } from "@/lib/auth/server-session";
import { serverEmprestimoOperations } from "@/features/emprestimos/api/server-emprestimo-operations";
import {
  campoEmprestimo,
  dataExibicao,
  mensagemEmprestimo,
  painelEmprestimo,
} from "@/features/emprestimos/apresentacao";

export const metadata: Metadata = { title: "Empréstimos" };

export default async function EmprestimosPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const identidade = await obterIdentidadeAtual();
  if (!identidade) return null;
  const parametros = await searchParams;
  const valores = Object.fromEntries(
    Object.entries(parametros).filter(
      ([, valor]) => typeof valor === "string" && valor !== "",
    ),
  ) as Record<string, string>;
  const validacao = ListarEmprestimosQuerySchema.safeParse(valores);
  let resposta: Awaited<
    ReturnType<typeof serverEmprestimoOperations.listar>
  > | null = null;
  let erro: unknown = null;
  if (validacao.success) {
    try {
      resposta = await serverEmprestimoOperations.listar(valores, {
        cookie: (await headers()).get("cookie") ?? "",
      });
    } catch (e) {
      erro = e;
    }
  }
  const hrefPagina = (pagina: number) =>
    `/emprestimos?${new URLSearchParams({ ...valores, pagina: String(pagina) }).toString()}`;
  return (
    <main className="grid min-w-0 gap-5 p-4 text-[#19355d] sm:p-7">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Empréstimos</h1>
          <p className="mt-2 text-sm text-[#526580]">
            Consulte saídas, pendências e devoluções registradas.
          </p>
        </div>
        {identidade.perfil === "DIRETOR_PATRIMONIO" && (
          <Button asChild>
            <Link prefetch={false} href="/emprestimos/nova">
              Novo empréstimo
            </Link>
          </Button>
        )}
      </header>
      <form
        action="/emprestimos"
        method="get"
        className={painelEmprestimo}
        aria-label="Filtros de empréstimos"
      >
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <label className="text-sm">
            Busca
            <input
              className={campoEmprestimo}
              name="busca"
              defaultValue={valores.busca ?? ""}
              placeholder="Destinatário, patrimônio ou UUID"
            />
          </label>
          <label className="text-sm">
            Situação
            <select
              className={campoEmprestimo}
              name="situacao"
              defaultValue={valores.situacao ?? ""}
            >
              <option value="">Todas</option>
              <option value="EM_ANDAMENTO">Em andamento</option>
              <option value="CONCLUIDO">Concluído</option>
            </select>
          </label>
          <label className="text-sm">
            Saída desde
            <input
              className={campoEmprestimo}
              type="date"
              name="dataInicio"
              defaultValue={valores.dataInicio ?? ""}
            />
          </label>
          <label className="text-sm">
            Saída até
            <input
              className={campoEmprestimo}
              type="date"
              name="dataFim"
              defaultValue={valores.dataFim ?? ""}
            />
          </label>
        </div>
        <label className="mt-4 flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            name="somenteAtrasados"
            value="true"
            defaultChecked={valores.somenteAtrasados === "true"}
          />{" "}
          Somente atrasados
        </label>
        <div className="mt-4 flex gap-3">
          <Button type="submit">Filtrar</Button>
          <Link className="self-center underline" href="/emprestimos">
            Limpar
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
      ) : resposta ? (
        <section
          className={painelEmprestimo}
          aria-labelledby="lista-emprestimos-title"
        >
          <div className="flex flex-wrap justify-between gap-2">
            <h2 id="lista-emprestimos-title" className="font-bold">
              Registros
            </h2>
            <p>{resposta.meta.total} empréstimo(s)</p>
          </div>
          {resposta.dados.length ? (
            <div
              className="mt-4 overflow-x-auto"
              role="region"
              aria-label="Lista de empréstimos"
              tabIndex={0}
            >
              <table className="w-full text-left text-sm">
                <caption className="sr-only">
                  Empréstimos mais recentes primeiro
                </caption>
                <thead className="bg-[#f7f9fc]">
                  <tr>
                    <th scope="col" className="p-3">
                      Destinatário
                    </th>
                    <th scope="col" className="p-3">
                      Saída
                    </th>
                    <th scope="col" className="p-3">
                      Modo
                    </th>
                    <th scope="col" className="p-3">
                      Pendências
                    </th>
                    <th scope="col" className="p-3">
                      Situação
                    </th>
                    <th scope="col" className="p-3">
                      Ação
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {resposta.dados.map((item) => (
                    <tr key={item.id} className="border-b border-[#e4eaf2]">
                      <td className="p-3">
                        <strong>{item.destinatario ?? "Não informado"}</strong>
                        <p className="break-all text-xs text-[#526580]">
                          {item.id}
                        </p>
                      </td>
                      <td className="p-3">
                        {dataExibicao(item.dataEmprestimo)}
                      </td>
                      <td className="p-3">
                        {item.modoAgrupamento === "EM_GRUPO"
                          ? "Em grupo"
                          : item.modoAgrupamento === "SEPARADAMENTE"
                            ? "Separado"
                            : "Não informado"}
                      </td>
                      <td className="p-3">
                        {item.pendentes} de {item.total}
                      </td>
                      <td className="p-3">
                        {item.situacao === "CONCLUIDO"
                          ? "Concluído"
                          : item.emAtraso
                            ? "Em atraso"
                            : "Em andamento"}
                      </td>
                      <td className="p-3">
                        <Link
                          className="underline"
                          prefetch={false}
                          href={`/emprestimos/${item.id}`}
                        >
                          Abrir detalhe
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="mt-4">Nenhum empréstimo encontrado.</p>
          )}
          <nav className="mt-5 flex gap-4" aria-label="Paginação">
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
      ) : null}
    </main>
  );
}
