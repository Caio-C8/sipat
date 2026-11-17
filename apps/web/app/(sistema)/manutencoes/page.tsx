import type { Metadata } from "next";
import { headers } from "next/headers";
import Link from "next/link";
import { Eye, FileText, Plus, Search, SlidersHorizontal } from "lucide-react";
import { ListarManutencoesQuerySchema } from "@repo/contracts";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PageHeader } from "@/components/shared/page-header";
import { PaginationSummary } from "@/components/shared/pagination-summary";
import { exigirIdentidadeAtual } from "@/lib/auth/server-session";
import { ErroManutencao } from "@/features/manutencoes/components/erro-manutencao";
import { serverManutencaoOperations } from "@/features/manutencoes/api/server-manutencao-operations";
import {
  classeStatusManutencao,
  formatarDataCivil,
  painelManutencao,
  rotuloStatusManutencao,
} from "@/features/manutencoes/apresentacao";

export const metadata: Metadata = { title: "Manutenções" };

export default async function ManutencoesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await exigirIdentidadeAtual();
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
  const hrefPagina = (p: number) =>
    `/manutencoes?${new URLSearchParams({ ...valores, pagina: String(p) }).toString()}`;

  return (
    <main className="grid min-w-0 gap-5 bg-[#f7f9fc] p-4 text-[#19355d] sm:p-6 lg:p-7">
      <PageHeader
        title="Manutenção"
        description="Acompanhe os pedidos, os atendimentos e o retorno de cada bem."
        actions={
          <Button
            asChild
            className="h-10 gap-2 bg-[#173d6b] px-5 hover:bg-[#0f315c]"
          >
            <Link prefetch={false} href="/manutencoes/nova">
              <Plus aria-hidden="true" className="size-4" /> Novo pedido
            </Link>
          </Button>
        }
      />

      <section className={painelManutencao} aria-label="Pesquisar pedidos">
        <form action="/manutencoes" method="get" className="grid gap-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-[#203b61]">
            <SlidersHorizontal
              aria-hidden="true"
              className="size-4 text-[#2863ec]"
            />
            Pesquisar pedido
          </div>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <label className="grid gap-2 text-xs font-medium text-[#526580] sm:col-span-2">
              Número do pedido ou patrimônio
              <Input
                name="busca"
                type="search"
                defaultValue={valores.busca ?? ""}
                maxLength={200}
                placeholder="Digite para pesquisar"
              />
            </label>
            <label className="grid gap-2 text-xs font-medium text-[#526580]">
              Situação do pedido
              <Select name="status" defaultValue={valores.status ?? ""}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Todas as situações" />
                </SelectTrigger>
                <SelectContent position="popper">
                  <SelectItem value="EM_ANDAMENTO">Em andamento</SelectItem>
                  <SelectItem value="CONCLUIDA">Concluída</SelectItem>
                </SelectContent>
              </Select>
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label className="grid gap-2 text-xs font-medium text-[#526580]">
                Envio desde
                <Input
                  name="dataEnvioInicio"
                  type="date"
                  defaultValue={valores.dataEnvioInicio ?? ""}
                />
              </label>
              <label className="grid gap-2 text-xs font-medium text-[#526580]">
                Envio até
                <Input
                  name="dataEnvioFim"
                  type="date"
                  defaultValue={valores.dataEnvioFim ?? ""}
                />
              </label>
            </div>
          </div>
          <div className="flex flex-wrap justify-end gap-3">
            <Button asChild variant="outline">
              <Link href="/manutencoes">Limpar</Link>
            </Button>
            <Button
              type="submit"
              className="gap-2 bg-[#173d6b] px-5 hover:bg-[#0f315c]"
            >
              <Search aria-hidden="true" className="size-4" /> Pesquisar
            </Button>
          </div>
        </form>
      </section>

      {!validacao.success ? (
        <Alert variant="destructive" tabIndex={-1}>
          <AlertDescription>
            Confira os filtros informados.{" "}
            {validacao.error.issues.map((issue) => issue.message).join(" ")}
          </AlertDescription>
        </Alert>
      ) : erro ? (
        <ErroManutencao erro={erro} />
      ) : resposta ? (
        <section className={painelManutencao} aria-labelledby="pedidos-title">
          <div className="mb-2 flex flex-wrap items-end justify-between gap-2 border-b border-[#e4eaf2] pb-4">
            <div>
              <h2 id="pedidos-title" className="font-bold">
                Pedidos de manutenção
              </h2>
              <p className="mt-1 text-xs text-[#526580]">
                Mais recentes primeiro.
              </p>
            </div>
            <p className="text-xs text-[#526580]">
              {resposta.meta.total} pedido(s)
            </p>
          </div>
          {resposta.dados.length ? (
            <div
              className="overflow-x-auto"
              role="region"
              aria-label="Lista de pedidos de manutenção"
              tabIndex={0}
            >
              <table className="w-full min-w-[52rem] text-left text-sm">
                <caption className="sr-only">
                  Pedidos de manutenção mais recentes primeiro
                </caption>
                <thead className="bg-[#f7f9fc] text-[11px] font-semibold tracking-wide text-[#526580] uppercase">
                  <tr>
                    <th scope="col" className="px-3 py-3">
                      Pedido
                    </th>
                    <th scope="col" className="px-3 py-3">
                      Atendimentos
                    </th>
                    <th scope="col" className="px-3 py-3">
                      Documento
                    </th>
                    <th scope="col" className="px-3 py-3">
                      Data de envio
                    </th>
                    <th scope="col" className="px-3 py-3">
                      Situação
                    </th>
                    <th scope="col" className="px-3 py-3 text-right">
                      Ação
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {resposta.dados.map((pedido) => (
                    <tr
                      key={pedido.id}
                      className="border-b border-[#e4eaf2] hover:bg-[#fbfcfe]"
                    >
                      <td className="max-w-64 px-3 py-4 align-top">
                        <strong>Pedido #{pedido.numeroPedido}</strong>
                        <p className="mt-1 text-xs text-[#526580]">
                          {pedido.totalItens} bem(ns) no pedido
                        </p>
                      </td>
                      <td className="px-3 py-4 align-top">
                        <strong>
                          {pedido.itensRetornados} de {pedido.totalItens}
                        </strong>
                        <p className="mt-1 text-xs text-[#526580]">
                          {pedido.itensPendentes} pendente(s)
                        </p>
                      </td>
                      <td className="px-3 py-4 align-top">
                        <span className="inline-flex items-center gap-2 text-xs text-[#526580]">
                          <FileText
                            aria-hidden="true"
                            className="size-4 text-[#2863ec]"
                          />
                          {pedido.temAnexoObservacao
                            ? "Anexo da observação"
                            : "Sem anexo"}
                        </span>
                      </td>
                      <td className="px-3 py-4 align-top">
                        {formatarDataCivil(pedido.dataEnvio)}
                      </td>
                      <td className="px-3 py-4 align-top">
                        <span
                          className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${classeStatusManutencao(pedido.status)}`}
                        >
                          {rotuloStatusManutencao(pedido.status)}
                        </span>
                      </td>
                      <td className="px-3 py-4 text-right align-top">
                        <Button asChild variant="outline" size="sm">
                          <Link
                            prefetch={false}
                            href={`/manutencoes/${pedido.id}`}
                          >
                            <Eye aria-hidden="true" className="size-3.5" />{" "}
                            Abrir
                          </Link>
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-10 text-center">
              <p className="font-semibold">Nenhum pedido encontrado</p>
              <p className="mt-1 text-sm text-[#526580]">
                Revise os filtros ou crie um novo pedido.
              </p>
            </div>
          )}
          <div className="mt-5 flex justify-end">
            <PaginationSummary meta={resposta.meta} href={hrefPagina} />
          </div>
        </section>
      ) : null}
    </main>
  );
}
