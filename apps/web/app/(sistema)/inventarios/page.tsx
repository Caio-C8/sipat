import type { Metadata } from "next";
import { headers } from "next/headers";
import Link from "next/link";
import { ListarInventariosQuerySchema } from "@repo/contracts";
import { AbrirInventarioDialog } from "@/features/inventarios/components/abrir-inventario-dialog";
import { serverInventarioOperations } from "@/features/inventarios/api/server-inventario-operations";
import { isApiError } from "@/lib/api/core/api-error";
import { obterIdentidadeAtual } from "@/lib/auth/server-session";

export const metadata: Metadata = { title: "Inventários" };

const painel = "rounded-xl border border-[#dfe7f1] bg-white p-5";
const data = (valor: string | null) =>
  valor
    ? new Intl.DateTimeFormat("pt-BR", {
        dateStyle: "short",
        timeStyle: "short",
        timeZone: "America/Sao_Paulo",
      }).format(new Date(valor))
    : "—";
const rotulos: Record<string, string> = {
  PENDENTE: "Pendente",
  EM_ANDAMENTO: "Em andamento",
  FINALIZADO: "Finalizado",
};

export default async function InventariosPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const identidade = await obterIdentidadeAtual();
  if (!identidade) return null;
  const params = await searchParams;
  const busca = typeof params.busca === "string" ? params.busca : undefined;
  const status = typeof params.status === "string" ? params.status : undefined;
  const pagina = typeof params.pagina === "string" ? params.pagina : "1";
  const validacao = ListarInventariosQuerySchema.safeParse({
    busca,
    status,
    pagina,
    limite: "20",
  });
  let resposta: Awaited<
    ReturnType<typeof serverInventarioOperations.listar>
  > | null = null;
  let erro = "";
  if (validacao.success) {
    try {
      resposta = await serverInventarioOperations.listar(
        { busca, status: validacao.data.status, pagina, limite: "20" },
        { cookie: (await headers()).get("cookie") ?? "" },
      );
    } catch (falha) {
      erro = isApiError(falha)
        ? falha.message
        : "Não foi possível consultar os inventários.";
    }
  }
  const hrefPagina = (n: number) =>
    `/inventarios?${new URLSearchParams({ ...(busca ? { busca } : {}), ...(status ? { status } : {}), pagina: String(n) }).toString()}`;
  return (
    <main className="grid min-w-0 gap-5 p-4 text-[#17253d] sm:p-7">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Inventários</h1>
          <p className="mt-2 text-sm text-[#627996]">
            Consulte inventários, acompanhe divergências e registre correções.
          </p>
        </div>
        {identidade.perfil === "DIRETOR_PATRIMONIO" && (
          <AbrirInventarioDialog />
        )}
      </header>
      <form
        action="/inventarios"
        method="get"
        className={`${painel} grid gap-4 sm:grid-cols-[1fr_220px_auto]`}
        aria-label="Filtros de inventários"
      >
        <label className="text-sm">
          Buscar inventário
          <input
            name="busca"
            defaultValue={busca ?? ""}
            className="mt-1 w-full rounded-md border border-[#d8e1ed] px-3 py-2.5"
            placeholder="Nome ou comissão"
          />
        </label>
        <label className="text-sm">
          Situação
          <select
            name="status"
            defaultValue={status ?? ""}
            className="mt-1 w-full rounded-md border border-[#d8e1ed] bg-white px-3 py-2.5"
          >
            <option value="">Todas</option>
            <option value="PENDENTE">Pendente</option>
            <option value="EM_ANDAMENTO">Em andamento</option>
            <option value="FINALIZADO">Finalizado</option>
          </select>
        </label>
        <button className="self-end rounded-md border border-[#d8e1ed] px-5 py-2.5 text-sm font-semibold text-[#203e66]">
          Consultar
        </button>
      </form>
      {!validacao.success ? (
        <p role="alert" className="rounded-md bg-red-50 p-4 text-red-900">
          Os filtros informados são inválidos.
        </p>
      ) : erro ? (
        <p role="alert" className="rounded-md bg-red-50 p-4 text-red-900">
          {erro}
        </p>
      ) : resposta ? (
        <section
          className={`${painel} min-h-[420px]`}
          aria-labelledby="lista-inventarios-title"
        >
          <div className="flex flex-wrap justify-between gap-2">
            <h2 id="lista-inventarios-title" className="text-lg font-bold">
              Inventários registrados
            </h2>
            <span className="text-sm text-[#627996]">
              {resposta.meta.total} registros
            </span>
          </div>
          {resposta.dados.length ? (
            <div
              className="mt-5 overflow-x-auto"
              role="region"
              aria-label="Inventários"
              tabIndex={0}
            >
              <table className="w-full min-w-[760px] text-left text-sm">
                <thead className="bg-[#f6f8fb] text-xs uppercase text-[#627996]">
                  <tr>
                    <th className="p-3">Inventário</th>
                    <th className="p-3">Comissão</th>
                    <th className="p-3">Progresso</th>
                    <th className="p-3">Situação</th>
                    <th className="p-3">Ação</th>
                  </tr>
                </thead>
                <tbody>
                  {resposta.dados.map((item) => (
                    <tr key={item.id} className="border-b border-[#e4eaf2]">
                      <td className="p-4">
                        <Link
                          className="font-bold text-[#203e66] hover:underline"
                          href={`/inventarios/${item.id}`}
                        >
                          {item.nome}
                        </Link>
                        <p className="mt-1 text-xs text-[#627996]">
                          Criado {data(item.createdAt)}
                        </p>
                      </td>
                      <td className="p-4">{item.comissao.nome}</td>
                      <td className="p-4">
                        {item.progresso.itensVerificados} de{" "}
                        {item.progresso.totalItens} bens verificados
                        <p className="mt-1 text-xs text-[#627996]">
                          {item.progresso.correcoesPendentes} correções
                          pendentes
                        </p>
                      </td>
                      <td className="p-4">{rotulos[item.status]}</td>
                      <td className="p-4">
                        <Link
                          className="rounded-md border border-[#d8e1ed] px-4 py-2 font-semibold text-[#203e66]"
                          href={`/inventarios/${item.id}`}
                        >
                          Consultar
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="py-12 text-center text-sm text-[#627996]">
              Nenhum inventário encontrado.
            </p>
          )}
          <nav className="mt-5 flex justify-between" aria-label="Paginação">
            {resposta.meta.pagina > 1 ? (
              <Link
                className="underline"
                href={hrefPagina(resposta.meta.pagina - 1)}
              >
                Anterior
              </Link>
            ) : (
              <span />
            )}
            {resposta.meta.pagina < resposta.meta.ultimaPagina && (
              <Link
                className="underline"
                href={hrefPagina(resposta.meta.pagina + 1)}
              >
                Próxima
              </Link>
            )}
          </nav>
        </section>
      ) : null}
      <aside className="rounded-lg bg-[#eef5ff] p-4 text-sm text-[#35577e]">
        <strong className="block text-[#203e66]">
          Conferência no aplicativo móvel
        </strong>
        Esta interface permite abrir e consultar inventários e resolver
        divergências. A conferência presencial e a conclusão dos setores são
        realizadas no aplicativo móvel.
      </aside>
    </main>
  );
}
