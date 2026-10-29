import type { Metadata } from "next";
import { headers } from "next/headers";
import Link from "next/link";
import { ListarManutencoesQuerySchema } from "@repo/contracts";
import { obterIdentidadeAtual } from "@/lib/auth/server-session";
import { ErroManutencao } from "@/features/manutencoes/components/erro-manutencao";
import { serverManutencaoOperations } from "@/features/manutencoes/api/server-manutencao-operations";

export const metadata: Metadata = { title: "Manutenções" };

export default async function ManutencoesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  if (!(await obterIdentidadeAtual())) return null;
  const entrada = await searchParams;
  const valores = Object.fromEntries(
    Object.entries(entrada).filter(
      ([, valor]) => typeof valor === "string" && valor !== "",
    ),
  ) as Record<string, string>;
  const validacao = ListarManutencoesQuerySchema.safeParse(valores);
  let resposta: Awaited<
    ReturnType<typeof serverManutencaoOperations.listar>
  > | null = null;
  let erro: unknown = null;
  if (validacao.success) {
    try {
      resposta = await serverManutencaoOperations.listar(valores, {
        cookie: (await headers()).get("cookie") ?? "",
      });
    } catch (e) {
      erro = e;
    }
  }
  const pagina = validacao.success ? validacao.data.pagina : 1;
  const hrefPagina = (p: number) =>
    `/manutencoes?${new URLSearchParams({ ...valores, pagina: String(p) }).toString()}`;
  return (
    <main className="grid min-w-0 gap-5 p-4 text-[#19355d] sm:p-7">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Manutenções</h1>
          <p className="mt-1 text-sm">
            Consulte pedidos e acompanhe o retorno de cada patrimônio.
          </p>
        </div>
        <Link
          href="/manutencoes/nova"
          className="rounded-md bg-[#19355d] px-4 py-2 text-sm text-white focus-visible:outline-2 focus-visible:outline-offset-2"
        >
          Novo pedido
        </Link>
      </header>
      <form
        action="/manutencoes"
        method="get"
        className="grid gap-3 rounded-md border bg-white p-4 sm:grid-cols-2 xl:grid-cols-5"
      >
        <label className="grid gap-1 text-sm">
          Busca
          <input
            name="busca"
            defaultValue={valores.busca ?? ""}
            maxLength={200}
            placeholder="ID, número ou descrição"
            className="rounded border p-2"
          />
        </label>
        <label className="grid gap-1 text-sm">
          Situação
          <select
            name="status"
            defaultValue={valores.status ?? ""}
            className="rounded border p-2"
          >
            <option value="">Todas</option>
            <option value="EM_ANDAMENTO">Em andamento</option>
            <option value="CONCLUIDA">Concluída</option>
          </select>
        </label>
        <label className="grid gap-1 text-sm">
          Envio desde
          <input
            name="dataEnvioInicio"
            type="date"
            defaultValue={valores.dataEnvioInicio ?? ""}
            className="rounded border p-2"
          />
        </label>
        <label className="grid gap-1 text-sm">
          Envio até
          <input
            name="dataEnvioFim"
            type="date"
            defaultValue={valores.dataEnvioFim ?? ""}
            className="rounded border p-2"
          />
        </label>
        <button
          type="submit"
          className="self-end rounded-md border px-4 py-2 text-sm focus-visible:outline-2 focus-visible:outline-offset-2"
        >
          Filtrar
        </button>
      </form>
      {!validacao.success ? (
        <div role="alert" className="rounded bg-red-50 p-3 text-red-900">
          Filtros inválidos:{" "}
          {validacao.error.issues.map((issue) => issue.message).join(" ")}
        </div>
      ) : null}
      {erro ? <ErroManutencao erro={erro} /> : null}
      {resposta ? (
        <section
          className="min-w-0 rounded-md border bg-white p-4"
          aria-labelledby="pedidos-title"
        >
          <h2 id="pedidos-title" className="mb-3 font-semibold">
            Pedidos ({resposta.meta.total})
          </h2>
          {resposta.dados.length ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <caption className="sr-only">
                  Pedidos de manutenção mais recentes primeiro
                </caption>
                <thead>
                  <tr className="border-b">
                    <th scope="col" className="p-2">
                      Referência
                    </th>
                    <th scope="col" className="p-2">
                      Envio
                    </th>
                    <th scope="col" className="p-2">
                      Situação
                    </th>
                    <th scope="col" className="p-2">
                      Itens
                    </th>
                    <th scope="col" className="p-2">
                      Ação
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {resposta.dados.map((pedido) => (
                    <tr key={pedido.id} className="border-b">
                      <td className="max-w-64 p-2 break-all">
                        {pedido.numeroRequisicao ?? pedido.id}
                      </td>
                      <td className="p-2">{pedido.dataEnvio}</td>
                      <td className="p-2">
                        {pedido.status === "CONCLUIDA"
                          ? "Concluída"
                          : "Em andamento"}
                      </td>
                      <td className="p-2">
                        {pedido.itensRetornados} retornados /{" "}
                        {pedido.itensPendentes} pendentes
                      </td>
                      <td className="p-2">
                        <Link
                          className="underline"
                          href={`/manutencoes/${pedido.id}`}
                        >
                          Abrir
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-sm">Nenhum pedido encontrado.</p>
          )}
          <nav
            aria-label="Páginas de pedidos"
            className="mt-4 flex gap-3 text-sm"
          >
            {pagina > 1 ? (
              <Link className="underline" href={hrefPagina(pagina - 1)}>
                Anterior
              </Link>
            ) : null}
            <span>
              Página {pagina} de {resposta.meta.ultimaPagina}
            </span>
            {pagina < resposta.meta.ultimaPagina ? (
              <Link className="underline" href={hrefPagina(pagina + 1)}>
                Próxima
              </Link>
            ) : null}
          </nav>
        </section>
      ) : null}
    </main>
  );
}
