import type { Metadata } from "next";
import { headers } from "next/headers";
import Link from "next/link";
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

export default async function ReavaliacoesPage({
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
  return (
    <main className="grid min-w-0 gap-5 p-4 text-[#19355d] sm:p-7">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Reavaliações</h1>
          <p className="mt-2 text-sm text-[#526580]">
            Consulte os registros individuais de reavaliação patrimonial.
          </p>
        </div>
        {identidade.perfil === "DIRETOR_PATRIMONIO" ? (
          <Button asChild>
            <Link prefetch={false} href="/reavaliacoes/nova">
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
          <div className="mb-4 flex flex-wrap justify-between gap-2">
            <h2 id="registros-reavaliacao-title" className="font-bold">
              Registros
            </h2>
            <p className="text-sm">{resposta.meta.total} registro(s)</p>
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
                <thead className="bg-[#f7f9fc] text-xs text-[#526580]">
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
                      <td className="px-3 py-4">
                        <strong>
                          {item.patrimonio.numeroPatrimonio ??
                            "Número não registrado"}
                        </strong>
                        <p>
                          {item.patrimonio.descricao ??
                            "Descrição histórica não registrada"}
                        </p>
                      </td>
                      <td className="px-3 py-4">
                        {formatarDataCivil(item.dataReferencia)}
                      </td>
                      <td className="px-3 py-4">
                        {formatarDecimal(item.valorLiquidoAnterior)}
                      </td>
                      <td className="px-3 py-4">
                        {formatarDecimal(item.valorBrutoNovo)}
                      </td>
                      <td className="px-3 py-4">
                        <Link
                          prefetch={false}
                          className="underline"
                          href={`/reavaliacoes/${item.id}`}
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
            <p className="py-10 text-center text-sm text-[#526580]">
              Nenhuma reavaliação encontrada.
            </p>
          )}
          <nav
            aria-label="Paginação das reavaliações"
            className="mt-5 flex items-center justify-end gap-3 text-sm"
          >
            {resposta.meta.pagina > 1 ? (
              <Link
                prefetch={false}
                className="underline"
                href={hrefPagina(resposta.meta.pagina - 1)}
              >
                Anterior
              </Link>
            ) : (
              <span className="text-[#526580]">Anterior</span>
            )}
            <span>
              {resposta.meta.pagina} de {resposta.meta.ultimaPagina}
            </span>
            {resposta.meta.pagina < resposta.meta.ultimaPagina ? (
              <Link
                prefetch={false}
                className="underline"
                href={hrefPagina(resposta.meta.pagina + 1)}
              >
                Próxima
              </Link>
            ) : (
              <span className="text-[#526580]">Próxima</span>
            )}
          </nav>
        </section>
      ) : null}
    </main>
  );
}
