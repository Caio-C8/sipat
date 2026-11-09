import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { Plus, Search } from "lucide-react";
import { ListarUsuariosQuerySchema } from "@repo/contracts";
import { Button } from "@/components/ui/button";
import { serverUsuarioOperations } from "@/features/usuarios/api/server-usuario-operations";
import { obterIdentidadeAtual } from "@/lib/auth/server-session";
import { isApiError } from "@/lib/api/core/api-error";

export const metadata: Metadata = {
  title: "Usuários",
  description: "Consulta e gestão dos acessos ao SIPAT.",
};

const campo =
  "min-h-10 w-full rounded-md border border-[#dce5f0] bg-white px-3 text-sm text-[#17253d] focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[#2863ec]";
const perfil = (valor: string) =>
  valor === "ADMINISTRADOR" ? "Administrador" : "Diretor de patrimônio";
const status = (ativo: boolean) => (ativo ? "Ativo" : "Inativo");

export default async function UsuariosPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const identidade = await obterIdentidadeAtual();
  if (!identidade || identidade.perfil !== "ADMINISTRADOR")
    redirect("/dashboard");
  const recebidos = await searchParams;
  const valores = Object.fromEntries(
    Object.entries(recebidos).filter(
      ([, valor]) => typeof valor === "string" && valor !== "",
    ),
  ) as Record<string, string>;
  const query = ListarUsuariosQuerySchema.safeParse(valores);
  const pagina = query.success ? query.data.pagina : 1;
  let resposta;
  let erro = "";
  if (!query.success)
    erro = "Os filtros informados são inválidos. Revise e tente novamente.";
  else {
    try {
      resposta = await serverUsuarioOperations.listar(valores, {
        cookie: (await headers()).get("cookie") ?? "",
      });
    } catch (falha) {
      erro = isApiError(falha)
        ? falha.message
        : "Não foi possível consultar os usuários. Tente novamente.";
    }
  }
  const hrefPagina = (numero: number) =>
    `/usuarios?${new URLSearchParams({ ...valores, pagina: String(numero) }).toString()}`;
  return (
    <main className="mx-auto grid w-full min-w-0 max-w-[1900px] gap-5 px-4 py-5 text-[#17253d] sm:px-7 sm:py-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[#111d34] sm:text-3xl">
            Usuários
          </h1>
          <p className="mt-1 text-sm text-[#7188a5]">
            Defina quem pode acessar o sistema e quais operações estão
            disponíveis.
          </p>
        </div>
        <Button
          asChild
          className="min-h-10 bg-[#203b61] px-4 text-white hover:bg-[#31537f]"
        >
          <Link href="/usuarios/novo">
            <Plus /> Cadastrar usuário
          </Link>
        </Button>
      </header>
      <section className="rounded-lg border border-[#dfe7f1] bg-white p-5">
        <form className="grid gap-4 md:grid-cols-[minmax(220px,1fr)_minmax(180px,0.5fr)_minmax(160px,0.4fr)_auto] md:items-end">
          <label className="text-xs font-medium text-[#425875]">
            Nome ou e-mail
            <input
              className={`${campo} mt-1`}
              name="busca"
              defaultValue={valores.busca}
              maxLength={150}
              placeholder="Buscar usuário"
            />
          </label>
          <label className="text-xs font-medium text-[#425875]">
            Perfil
            <select
              className={`${campo} mt-1`}
              name="perfil"
              defaultValue={valores.perfil ?? ""}
            >
              <option value="">Todos os perfis</option>
              <option value="ADMINISTRADOR">Administrador</option>
              <option value="DIRETOR_PATRIMONIO">Diretor de patrimônio</option>
            </select>
          </label>
          <label className="text-xs font-medium text-[#425875]">
            Situação
            <select
              className={`${campo} mt-1`}
              name="ativo"
              defaultValue={valores.ativo ?? ""}
            >
              <option value="">Todas</option>
              <option value="true">Ativo</option>
              <option value="false">Inativo</option>
            </select>
          </label>
          <Button type="submit" variant="outline" className="min-h-10 px-5">
            <Search /> Consultar
          </Button>
        </form>
      </section>
      <section
        className="min-h-[280px] rounded-lg border border-[#dfe7f1] bg-white p-5"
        aria-labelledby="lista-heading"
      >
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <h2 id="lista-heading" className="text-lg font-bold">
            Usuários cadastrados
          </h2>
          {resposta ? (
            <span className="text-sm text-[#7188a5]">
              {resposta.meta.total}{" "}
              {resposta.meta.total === 1 ? "usuário" : "usuários"}
            </span>
          ) : null}
        </div>
        {erro ? (
          <p
            role="alert"
            className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-900"
          >
            {erro}
          </p>
        ) : resposta && resposta.dados.length === 0 ? (
          <p
            role="status"
            className="rounded-md bg-[#f7f9fc] p-8 text-center text-sm text-[#7188a5]"
          >
            Nenhum usuário corresponde aos filtros informados.
          </p>
        ) : resposta ? (
          <div
            className="overflow-x-auto"
            role="region"
            aria-label="Usuários cadastrados"
            tabIndex={0}
          >
            <table className="w-full min-w-[780px] text-left text-sm">
              <thead className="bg-[#f7f9fc] text-xs uppercase text-[#7188a5]">
                <tr>
                  <th className="p-3">Usuário / e-mail</th>
                  <th className="p-3">Perfil</th>
                  <th className="p-3">Situação</th>
                  <th className="p-3 text-right">Ação</th>
                </tr>
              </thead>
              <tbody>
                {resposta.dados.map((usuario) => (
                  <tr
                    key={usuario.id}
                    className="border-b border-[#e4ebf4] hover:bg-[#f9fbfd]"
                  >
                    <td className="p-3">
                      <strong className="text-[#203b61]">{usuario.nome}</strong>
                      <small className="mt-1 block text-[#7188a5]">
                        {usuario.email}
                      </small>
                    </td>
                    <td className="p-3">{perfil(usuario.perfil)}</td>
                    <td className="p-3">
                      <span
                        className={`inline-flex min-w-24 items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${usuario.ativo ? "bg-[#e9fbf3] text-[#08795c]" : "bg-slate-100 text-slate-600"}`}
                      >
                        <span aria-hidden="true">●</span>
                        {status(usuario.ativo)}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      <Button
                        asChild
                        variant="outline"
                        className="min-h-10 px-5"
                      >
                        <Link href={`/usuarios/${usuario.id}`}>Consultar</Link>
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
        {resposta && resposta.meta.ultimaPagina > 1 ? (
          <nav
            aria-label="Paginação de usuários"
            className="mt-5 flex items-center justify-between text-sm"
          >
            <span>
              Página {pagina} de {resposta.meta.ultimaPagina}
            </span>
            <span className="flex gap-4">
              {pagina > 1 ? (
                <Link className="underline" href={hrefPagina(pagina - 1)}>
                  Anterior
                </Link>
              ) : null}
              {pagina < resposta.meta.ultimaPagina ? (
                <Link className="underline" href={hrefPagina(pagina + 1)}>
                  Próxima
                </Link>
              ) : null}
            </span>
          </nav>
        ) : null}
      </section>
      <aside className="rounded-lg bg-[#eef5ff] p-4 text-sm text-[#38577f]">
        <strong>Uma conta para computador e celular</strong>
        <p className="mt-1">
          O perfil define as operações disponíveis ao usuário nas duas versões.
        </p>
      </aside>
    </main>
  );
}
