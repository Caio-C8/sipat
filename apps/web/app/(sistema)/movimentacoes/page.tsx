import type { Metadata } from "next";
import { headers } from "next/headers";
import Link from "next/link";
import { ArrowLeftRight, Eye, Plus } from "lucide-react";
import { ListarMovimentacoesQuerySchema } from "@repo/contracts";
import { exigirIdentidadeAtual } from "@/lib/auth/server-session";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
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
  const identidade = await exigirIdentidadeAtual();
  const cookie = (await headers()).get("cookie") ?? "";
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
        cookie,
      });
    } catch (e) {
      erro = e;
    }
  }
  function hrefPagina(pagina: number) {
    return `/movimentacoes?${new URLSearchParams({ ...valores, pagina: String(pagina) }).toString()}`;
  }
  return (
    <main className="grid min-w-0 gap-5 bg-background p-4 text-foreground sm:p-6 lg:p-7">
      <PageHeader
        title="Movimentações"
        description="Consulte as transferências entre setores e registre novas movimentações."
        actions={
          identidade.perfil === "DIRETOR_PATRIMONIO" ? (
            <Button asChild className="h-10 gap-2 px-5">
              <Link prefetch={false} href="/movimentacoes/nova">
                <Plus aria-hidden="true" className="size-4" />
                Nova movimentação
              </Link>
            </Button>
          ) : undefined
        }
      />
      <section
        className={painelMovimentacao}
        aria-label="Filtros de movimentações"
      >
        <FiltrosMovimentacoes key={JSON.stringify(valores)} valores={valores} />
      </section>
      {!validacao.success ? (
        <Alert variant="destructive">
          <AlertTitle>Filtros inválidos</AlertTitle>
          <AlertDescription>
            <ul className="list-disc pl-5">
              {validacao.error.issues.map((issue, i) => (
                <li key={i}>{issue.message}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
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
            <Table
              containerProps={{
                role: "region",
                "aria-label": "Lista de movimentações",
                tabIndex: 0,
              }}
            >
              <TableCaption className="sr-only">
                Transferências individuais, mais recentes primeiro
              </TableCaption>
              <TableHeader className="bg-muted text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                <TableRow>
                  {[
                    "Patrimônio / bem",
                    "Origem",
                    "Destino",
                    "Data e horário",
                    "Detalhes",
                  ].map((nome) => (
                    <TableHead key={nome} scope="col" className="px-3 py-3">
                      {nome}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {resposta.dados.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="max-w-sm px-3 py-4 align-top whitespace-normal wrap-anywhere">
                      <span className="text-xs text-muted-foreground">
                        {item.patrimonio.numeroPatrimonio}
                      </span>
                      <p className="font-semibold">
                        {item.patrimonio.descricao}
                      </p>
                      <Badge variant="secondary" className="mt-1">
                        {item.origemRegistro === "COMUM"
                          ? "Transferência comum"
                          : "Correção de inventário"}
                      </Badge>
                    </TableCell>
                    <TableCell className="px-3 py-4 align-top font-medium">
                      {item.setorOrigem.nome}
                    </TableCell>
                    <TableCell className="px-3 py-4 align-top font-medium">
                      {item.setorDestino.nome}
                    </TableCell>
                    <TableCell className="px-3 py-4 align-top">
                      <time dateTime={item.dataTransferencia}>
                        {formatarDataMovimentacao(item.dataTransferencia)}
                      </time>
                    </TableCell>
                    <TableCell className="px-3 py-4 align-top">
                      <Button
                        asChild
                        variant="outline"
                        className="gap-2 text-xs font-semibold"
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
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
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
          <div className="mt-5 grid gap-3 text-xs text-muted-foreground">
            <p>
              Cada bem possui seu próprio registro. Nomes dos cadastros são os
              atuais.
            </p>
            <PaginationSummary meta={resposta.meta} href={hrefPagina} />
          </div>
        </section>
      ) : null}
    </main>
  );
}
