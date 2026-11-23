import type { Metadata } from "next";
import { headers } from "next/headers";
import Link from "next/link";
import { Eye, Plus } from "lucide-react";
import { ListarReavaliacoesQuerySchema } from "@repo/contracts";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PageHeader } from "@/components/shared/page-header";
import { PaginationSummary } from "@/components/shared/pagination-summary";
import { exigirIdentidadeAtual } from "@/lib/auth/server-session";
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
  const identidade = await exigirIdentidadeAtual();
  const cookie = (await headers()).get("cookie") ?? "";
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
        cookie,
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
    <main className="grid min-w-0 gap-5 bg-background p-4 text-foreground sm:p-6 lg:p-7">
      <PageHeader
        title="Reavaliações"
        description="Consulte os registros e inicie uma nova reavaliação patrimonial."
        actions={
          identidade.perfil === "DIRETOR_PATRIMONIO" ? (
            <Button asChild className="h-10 gap-2 px-5">
              <Link prefetch={false} href="/reavaliacoes/nova">
                <Plus aria-hidden="true" className="size-4" />
                Nova reavaliação
              </Link>
            </Button>
          ) : undefined
        }
      />
      <section
        className={painelReavaliacao}
        aria-label="Filtros de reavaliações"
      >
        <FiltrosReavaliacoes valores={valores} />
      </section>
      {!validacao.success ? (
        <Alert variant="destructive">
          <AlertDescription>
            Confira os filtros informados e tente novamente.
          </AlertDescription>
        </Alert>
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
            <Table
              containerProps={{
                role: "region",
                "aria-label": "Lista de reavaliações",
                tabIndex: 0,
              }}
            >
              <TableCaption className="sr-only">
                Reavaliações mais recentes primeiro
              </TableCaption>
              <TableHeader className="bg-muted text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                <TableRow>
                  <TableHead scope="col" className="px-3 py-3">
                    Patrimônio
                  </TableHead>
                  <TableHead scope="col" className="px-3 py-3">
                    Data
                  </TableHead>
                  <TableHead scope="col" className="px-3 py-3">
                    Líquido anterior
                  </TableHead>
                  <TableHead scope="col" className="px-3 py-3">
                    Novo bruto
                  </TableHead>
                  <TableHead scope="col" className="px-3 py-3">
                    Detalhes
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {resposta.dados.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="px-3 py-4 align-top">
                      <strong>
                        {item.patrimonio.numeroPatrimonio ??
                          "Número não registrado"}
                      </strong>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {item.patrimonio.descricao ??
                          "Descrição histórica não registrada"}
                      </p>
                    </TableCell>
                    <TableCell className="px-3 py-4 align-top">
                      {formatarDataCivil(item.dataReferencia)}
                    </TableCell>
                    <TableCell className="px-3 py-4 align-top">
                      {formatarDecimal(item.valorLiquidoAnterior)}
                    </TableCell>
                    <TableCell className="px-3 py-4 align-top font-semibold text-primary">
                      {formatarDecimal(item.valorBrutoNovo)}
                    </TableCell>
                    <TableCell className="px-3 py-4 align-top">
                      <Button asChild variant="outline" size="sm">
                        <Link
                          prefetch={false}
                          href={`/reavaliacoes/${item.id}${consultaAtual ? `?retorno=${encodeURIComponent(retornoDetalhe)}` : ""}`}
                        >
                          <Eye aria-hidden="true" className="size-3.5" />
                          Detalhes
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="py-10 text-center text-sm text-[#526580]">
              Nenhuma reavaliação encontrada.
            </p>
          )}
          <div className="mt-5">
            <PaginationSummary meta={resposta.meta} href={hrefPagina} />
          </div>
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
