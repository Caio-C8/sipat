import type { Metadata } from "next";
import { headers } from "next/headers";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Eye, Plus } from "lucide-react";
import { ListarReavaliacoesQuerySchema } from "@repo/contracts";
import { Button } from "@/components/ui/button";
import { obterIdentidadeAtual } from "@/lib/auth/server-session";
import { serverReavaliacaoOperations } from "@/features/reavaliacoes/api/server-reavaliacao-operations";
import { ErroReavaliacao } from "@/features/reavaliacoes/components/erro-reavaliacao";
import { FiltrosReavaliacoes } from "@/features/reavaliacoes/components/filtros-reavaliacoes";
import {
  formatarDataCivil,
  formatarDecimal,
  painelReavaliacao,
} from "@/features/reavaliacoes/presentation";

export const metadata: Metadata = { title: "Reavaliações" };

async function ReavaliacoesContent({
  parametros,
}: {
  parametros: Record<string, string | string[] | undefined>;
}) {
  const identidade = await obterIdentidadeAtual();
  if (!identidade) return null;
  const valores = Object.fromEntries(
    Object.entries(parametros).filter(
      ([, valor]) => typeof valor === "string" && valor !== "",
    ),
  ) as Record<string, string>;
  const validacao = ListarReavaliacoesQuerySchema.safeParse(valores);
  let resposta: Awaited<
    ReturnType<typeof serverReavaliacaoOperations.listar>
  > | null = null;
  let erro: unknown = null;
  if (validacao.success) {
    try {
      resposta = await serverReavaliacaoOperations.listar(valores, {
        cookie: (await headers()).get("cookie") ?? "",
      });
    } catch (e) {
      erro = e;
    }
  }
  const hrefPagina = (pagina: number) =>
    `/reavaliacoes?${new URLSearchParams({ ...valores, pagina: String(pagina) }).toString()}`;
  const consultaAtual = new URLSearchParams(valores).toString();
  const retornoDetalhe = consultaAtual
    ? `/reavaliacoes?${consultaAtual}`
    : "/reavaliacoes";
  return (
    <main className="grid min-w-0 gap-5 bg-[#f7f9fc] p-4 text-[#19355d] sm:p-6 lg:p-7">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Reavaliações</h1>
          <p className="mt-1 text-sm text-[#526580]">
            Consulte os registros e inicie uma nova reavaliação patrimonial.
          </p>
        </div>
        {identidade.perfil === "DIRETOR_PATRIMONIO" ? (
          <Button
            asChild
            className="h-10 gap-2 bg-[#173d6b] px-5 hover:bg-[#0f315c]"
          >
            <Link prefetch={false} href="/reavaliacoes/nova">
              <Plus aria-hidden="true" className="size-4" />
              Nova reavaliação
            </Link>
          </Button>
        ) : null}
      </header>
      <section
        className={painelReavaliacao}
        aria-label="Filtros de reavaliações"
      >
        <FiltrosReavaliacoes valores={valores} />
      </section>
      {!validacao.success ? (
        <div role="alert" className="rounded-md bg-red-50 p-4 text-red-900">
          Confira os filtros informados.
        </div>
      ) : erro ? (
        <ErroReavaliacao erro={erro} />
      ) : resposta ? (
        <section
          className={painelReavaliacao}
          aria-labelledby="registros-reavaliacao-title"
        >
          <div className="mb-2 flex flex-wrap items-end justify-between gap-2 border-b border-[#e4eaf2] pb-4">
            <div>
              <h2 id="registros-reavaliacao-title" className="font-bold">
                Reavaliações registradas
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
              aria-label="Lista de reavaliações"
              tabIndex={0}
            >
              <table className="w-full text-left text-sm">
                <caption className="sr-only">
                  Reavaliações mais recentes primeiro
                </caption>
                <thead className="bg-[#f7f9fc] text-[11px] font-semibold tracking-wide text-[#526580] uppercase">
                  <tr>
                    <th scope="col" className="px-3 py-3">
                      Patrimônio
                    </th>
                    <th scope="col" className="px-3 py-3">
                      Data
                    </th>
                    <th scope="col" className="px-3 py-3">
                      Líquido anterior
                    </th>
                    <th scope="col" className="px-3 py-3">
                      Novo bruto
                    </th>
                    <th scope="col" className="px-3 py-3">
                      Detalhes
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {resposta.dados.map((item) => (
                    <tr key={item.id} className="border-b border-[#e4eaf2]">
                      <td className="px-3 py-4 align-top">
                        <strong>
                          {item.patrimonio.numeroPatrimonio ??
                            "Número não registrado"}
                        </strong>
                        <p className="mt-1 text-xs text-[#526580]">
                          {item.patrimonio.descricao ??
                            "Descrição histórica não registrada"}
                        </p>
                      </td>
                      <td className="px-3 py-4 align-top">
                        {formatarDataCivil(item.dataReferencia)}
                      </td>
                      <td className="px-3 py-4 align-top">
                        {formatarDecimal(item.valorLiquidoAnterior)}
                      </td>
                      <td className="px-3 py-4 align-top font-semibold text-[#173d6b]">
                        {formatarDecimal(item.valorBrutoNovo)}
                      </td>
                      <td className="px-3 py-4 align-top">
                        <Link
                          prefetch={false}
                          className="inline-flex min-h-8 items-center gap-2 rounded-md border border-[#dce5f0] px-3 text-xs font-semibold text-[#203b61] transition hover:bg-[#f4f8ff] focus-visible:outline-2 focus-visible:outline-[#2863ec]"
                          href={`/reavaliacoes/${item.id}${consultaAtual ? `?retorno=${encodeURIComponent(retornoDetalhe)}` : ""}`}
                        >
                          <Eye aria-hidden="true" className="size-3.5" />
                          Detalhes
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="py-10 text-center text-sm text-[#526580]">
              Nenhuma reavaliação encontrada.
            </p>
          )}
          <nav
            aria-label="Paginação das reavaliações"
            className="mt-5 flex items-center justify-end gap-2 text-sm"
          >
            {resposta.meta.pagina > 1 ? (
              <Link
                prefetch={false}
                className="inline-flex min-h-9 items-center gap-1 rounded-md border border-[#dce5f0] px-3 font-semibold hover:bg-[#f4f8ff]"
                href={hrefPagina(resposta.meta.pagina - 1)}
              >
                <ChevronLeft aria-hidden="true" className="size-4" />
                Anterior
              </Link>
            ) : (
              <span className="inline-flex min-h-9 items-center gap-1 rounded-md border border-[#edf1f6] px-3 text-[#526580]">
                <ChevronLeft aria-hidden="true" className="size-4" /> Anterior
              </span>
            )}
            <span className="px-2 text-xs text-[#526580]">
              {resposta.meta.pagina} de {resposta.meta.ultimaPagina}
            </span>
            {resposta.meta.pagina < resposta.meta.ultimaPagina ? (
              <Link
                prefetch={false}
                className="inline-flex min-h-9 items-center gap-1 rounded-md border border-[#dce5f0] px-3 font-semibold hover:bg-[#f4f8ff]"
                href={hrefPagina(resposta.meta.pagina + 1)}
              >
                Próxima
                <ChevronRight aria-hidden="true" className="size-4" />
              </Link>
            ) : (
              <span className="inline-flex min-h-9 items-center gap-1 rounded-md border border-[#edf1f6] px-3 text-[#526580]">
                Próxima <ChevronRight aria-hidden="true" className="size-4" />
              </span>
            )}
          </nav>
        </section>
      ) : null}
    </main>
  );
}

export default async function ReavaliacoesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  return <ReavaliacoesContent parametros={await searchParams} />;
}
