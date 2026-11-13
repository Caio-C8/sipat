import type { Metadata } from "next";
import { headers } from "next/headers";
import Link from "next/link";
import {
  ArrowLeftRight,
  ChevronLeft,
  ChevronRight,
  Eye,
  Plus,
} from "lucide-react";
import { ListarMovimentacoesQuerySchema } from "@repo/contracts";
import { obterIdentidadeAtual } from "@/lib/auth/server-session";
import { Button } from "@/components/ui/button";
import { serverMovimentacaoOperations } from "@/features/movimentacoes/api/server-movimentacao-operations";
import { FiltrosMovimentacoes } from "@/features/movimentacoes/components/filtros-movimentacoes";
import { ErroMovimentacao } from "@/features/movimentacoes/components/erro-movimentacao";
import {
  formatarDataMovimentacao,
  painelMovimentacao,
} from "@/features/movimentacoes/presentation";
export const metadata: Metadata = {
  title: "Movimentações",
  description: "Consulta de transferências patrimoniais entre setores.",
};
export default async function MovimentacoesPage({
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
  const validacao = ListarMovimentacoesQuerySchema.safeParse(
    Object.fromEntries(
      Object.entries(parametros).filter(
        ([, valor]) => valor !== undefined && valor !== "",
      ),
    ),
  );
  let resposta: Awaited<
    ReturnType<typeof serverMovimentacaoOperations.listar>
  > | null = null;
  let erro: unknown = null;
  if (validacao.success) {
    try {
      resposta = await serverMovimentacaoOperations.listar(valores, {
        cookie: (await headers()).get("cookie") ?? "",
      });
    } catch (e) {
      erro = e;
    }
  }
  function hrefPagina(pagina: number) {
    return `/movimentacoes?${new URLSearchParams({ ...valores, pagina: String(pagina) }).toString()}`;
  }
  return (
    <main className="grid min-w-0 gap-5 bg-[#f7f9fc] p-4 text-[#19355d] sm:p-6 lg:p-7">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Movimentações</h1>
          <p className="mt-1 text-sm text-[#526580]">
            Consulte as transferências entre setores e registre novas
            movimentações.
          </p>
        </div>
        {identidade.perfil === "DIRETOR_PATRIMONIO" ? (
          <Button
            asChild
            className="h-10 gap-2 bg-[#173d6b] px-5 hover:bg-[#0f315c]"
          >
            <Link prefetch={false} href="/movimentacoes/nova">
              <Plus aria-hidden="true" className="size-4" />
              Nova movimentação
            </Link>
          </Button>
        ) : null}
      </header>
      <section
        className={painelMovimentacao}
        aria-label="Filtros de movimentações"
      >
        <FiltrosMovimentacoes key={JSON.stringify(valores)} valores={valores} />
      </section>
      {!validacao.success ? (
        <section role="alert" className="rounded-md bg-red-50 p-4 text-red-900">
          <h2 className="font-semibold">Filtros inválidos</h2>
          <ul className="list-disc pl-5">
            {validacao.error.issues.map((issue, i) => (
              <li key={i}>{issue.message}</li>
            ))}
          </ul>
        </section>
      ) : erro ? (
        <ErroMovimentacao erro={erro} />
      ) : resposta ? (
        <section
          className={painelMovimentacao}
          aria-labelledby="registros-title"
        >
          <div className="mb-2 flex flex-wrap items-end justify-between gap-2 border-b border-[#e4eaf2] pb-4">
            <div>
              <h2 id="registros-title" className="font-bold">
                Movimentações registradas
              </h2>
              <p className="mt-1 text-xs text-[#526580]">
                Registros individuais, do mais recente para o mais antigo.
              </p>
            </div>
            <p className="text-xs text-[#526580]">
              {resposta.meta.total} registro(s)
            </p>
          </div>
          {resposta.dados.length ? (
            <div
              className="overflow-x-auto"
              role="region"
              aria-label="Lista de movimentações"
              tabIndex={0}
            >
              <table className="w-full text-left text-sm">
                <caption className="sr-only">
                  Transferências individuais, mais recentes primeiro
                </caption>
                <thead className="bg-[#f7f9fc] text-[11px] font-semibold tracking-wide text-[#526580] uppercase">
                  <tr>
                    {[
                      "Patrimônio / bem",
                      "Origem",
                      "Destino",
                      "Data e horário",
                      "Detalhes",
                    ].map((nome) => (
                      <th key={nome} scope="col" className="px-3 py-3">
                        {nome}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {resposta.dados.map((item) => (
                    <tr key={item.id} className="border-b border-[#e4eaf2]">
                      <td className="max-w-sm px-3 py-4 align-top wrap-anywhere">
                        <span className="text-xs text-[#526580]">
                          {item.patrimonio.numeroPatrimonio}
                        </span>
                        <p className="font-semibold">
                          {item.patrimonio.descricao}
                        </p>
                        <span className="mt-1 inline-block rounded bg-[#edf4fd] px-2 py-1 text-[11px] text-[#31577f]">
                          {item.origemRegistro === "COMUM"
                            ? "Transferência comum"
                            : "Correção de inventário"}
                        </span>
                      </td>
                      <td className="px-3 py-4 align-top font-medium">
                        {item.setorOrigem.nome}
                      </td>
                      <td className="px-3 py-4 align-top font-medium">
                        {item.setorDestino.nome}
                      </td>
                      <td className="px-3 py-4 align-top">
                        <time dateTime={item.dataTransferencia}>
                          {formatarDataMovimentacao(item.dataTransferencia)}
                        </time>
                        <p className="text-xs text-[#526580]">São Paulo</p>
                      </td>
                      <td className="px-3 py-4 align-top">
                        <Button
                          asChild
                          variant="outline"
                          className="gap-2 border-[#dce5f0] text-xs font-semibold text-[#203b61] hover:bg-[#f4f8ff]"
                        >
                          <Link
                            prefetch={false}
                            href={`/movimentacoes/${item.id}`}
                            aria-label={`Detalhes da transferência do patrimônio ${item.patrimonio.numeroPatrimonio}`}
                          >
                            <Eye aria-hidden="true" className="size-3.5" />
                            Detalhes
                          </Link>
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-14 text-center text-sm text-[#526580]">
              <ArrowLeftRight
                size={28}
                aria-hidden="true"
                className="mx-auto mb-3"
              />
              <p>Nenhuma movimentação encontrada para estes filtros.</p>
            </div>
          )}
          <div className="mt-5 flex flex-wrap items-center justify-between gap-3 text-xs text-[#526580]">
            <p>
              Cada bem possui seu próprio registro. Nomes dos cadastros são os
              atuais.
            </p>
            <nav
              aria-label="Paginação das movimentações"
              className="flex items-center gap-3"
            >
              {resposta.meta.pagina > 1 ? (
                <Button asChild variant="outline" className="gap-1">
                  <Link
                    prefetch={false}
                    href={hrefPagina(resposta.meta.pagina - 1)}
                  >
                    <ChevronLeft aria-hidden="true" className="size-4" />
                    Anterior
                  </Link>
                </Button>
              ) : (
                <Button disabled variant="outline" className="gap-1">
                  <ChevronLeft aria-hidden="true" className="size-4" />
                  Anterior
                </Button>
              )}
              <span>
                {resposta.meta.pagina} de {resposta.meta.ultimaPagina}
              </span>
              {resposta.meta.pagina < resposta.meta.ultimaPagina ? (
                <Button asChild variant="outline" className="gap-1">
                  <Link
                    prefetch={false}
                    href={hrefPagina(resposta.meta.pagina + 1)}
                  >
                    Próxima
                    <ChevronRight aria-hidden="true" className="size-4" />
                  </Link>
                </Button>
              ) : (
                <Button disabled variant="outline" className="gap-1">
                  Próxima
                  <ChevronRight aria-hidden="true" className="size-4" />
                </Button>
              )}
            </nav>
          </div>
        </section>
      ) : null}
    </main>
  );
}
