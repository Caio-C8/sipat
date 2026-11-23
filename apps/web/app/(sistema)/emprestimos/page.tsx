import type { Metadata } from "next";
import { headers } from "next/headers";
import Link from "next/link";
import {
  ListarEmprestimosQuerySchema,
  type ListarEmprestimosQueryInput,
} from "@repo/contracts";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
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
import { exigirIdentidadeAtual } from "@/lib/auth/server-session";
import { serverEmprestimoOperations } from "@/features/emprestimos/api/server-emprestimo-operations";
import {
  botaoPrimarioEmprestimo,
  dataExibicao,
  mensagemEmprestimo,
  painelEmprestimo,
  situacaoEmprestimo,
} from "@/features/emprestimos/apresentacao";
import { FiltrosEmprestimos } from "@/features/emprestimos/components/filtros-emprestimos";

export const metadata: Metadata = { title: "Empréstimos" };
type Parametros = Record<string, string | string[] | undefined>;

export default async function EmprestimosPage({
  searchParams,
}: {
  searchParams: Promise<Parametros>;
}) {
  const identidade = await exigirIdentidadeAtual();
  const cookie = (await headers()).get("cookie") ?? "";
  const entrada = Object.fromEntries(
    Object.entries(await searchParams).filter(
      ([, valor]) => typeof valor === "string" && valor !== "",
    ),
  ) as Record<string, string>;
  const filtros = { ...entrada };
  if (!filtros.situacao && filtros.aba === "historico") {
    filtros.situacao = "CONCLUIDO";
  } else if (!filtros.situacao && filtros.aba === "andamento") {
    filtros.situacao = "EM_ANDAMENTO";
  }
  delete filtros.aba;
  if (filtros.situacao === "CONCLUIDO") delete filtros.somenteAtrasados;
  const query: ListarEmprestimosQueryInput = { ...filtros };
  const validacao = ListarEmprestimosQuerySchema.safeParse(query);
  let resposta: Awaited<
    ReturnType<typeof serverEmprestimoOperations.listar>
  > | null = null;
  let erro: unknown = null;
  if (validacao.success) {
    try {
      resposta = await serverEmprestimoOperations.listar(query, {
        cookie,
      });
    } catch (e) {
      erro = e;
    }
  }
  const consulta = new URLSearchParams(filtros);
  const hrefPagina = (pagina: number) => {
    const proxima = new URLSearchParams(consulta);
    proxima.set("pagina", String(pagina));
    return `/emprestimos?${proxima}`;
  };
  return (
    <main className="grid min-w-0 gap-5 p-4 text-[#19355d] sm:p-7">
      <PageHeader
        title="Empréstimos"
        description="Acompanhe os bens emprestados e as devoluções registradas."
        actions={
          identidade.perfil === "DIRETOR_PATRIMONIO" ? (
            <Button asChild className={botaoPrimarioEmprestimo}>
              <Link prefetch={false} href="/emprestimos/nova">
                Novo empréstimo
              </Link>
            </Button>
          ) : undefined
        }
      />
      <FiltrosEmprestimos filtros={filtros} />
      {!validacao.success ? (
        <Alert variant="destructive">
          <AlertDescription>
            Confira os filtros informados e tente novamente.
          </AlertDescription>
        </Alert>
      ) : erro ? (
        <Alert variant="destructive">
          <AlertDescription>{mensagemEmprestimo(erro)}</AlertDescription>
        </Alert>
      ) : (
        resposta && (
          <section
            className={painelEmprestimo}
            aria-labelledby="lista-emprestimos-title"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 id="lista-emprestimos-title" className="font-bold">
                {filtros.situacao === "EM_ANDAMENTO"
                  ? "Empréstimos em andamento"
                  : filtros.situacao === "CONCLUIDO"
                    ? "Empréstimos finalizados"
                    : "Todos os empréstimos"}
              </h2>
              <p className="text-sm text-[#526580]">
                {resposta.meta.total} registro(s)
              </p>
            </div>
            {resposta.dados.length ? (
              <Table
                className="min-w-[780px]"
                containerClassName="mt-4"
                containerProps={{
                  role: "region",
                  "aria-label": "Lista de empréstimos",
                  tabIndex: 0,
                }}
              >
                <TableCaption className="sr-only">
                  Empréstimos mais recentes primeiro
                </TableCaption>
                <TableHeader className="bg-muted text-xs uppercase text-muted-foreground">
                  <TableRow>
                    {[
                      "Destinatário",
                      "Agrupamento",
                      "Bens pendentes",
                      "Devolução prevista",
                      "Situação",
                      "Ação",
                    ].map((titulo) => (
                      <TableHead scope="col" className="p-3" key={titulo}>
                        {titulo}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {resposta.dados.map((item) => {
                    const situacao = situacaoEmprestimo(item);
                    const detalhe = new URLSearchParams({
                      origem: consulta.toString(),
                    });
                    return (
                      <TableRow key={item.id}>
                        <TableCell className="p-3 whitespace-normal">
                          <strong className="break-words">
                            {item.destinatario ?? "Não informado"}
                          </strong>
                        </TableCell>
                        <TableCell className="p-3">
                          {item.modoAgrupamento === "EM_GRUPO"
                            ? "Em grupo"
                            : item.modoAgrupamento === "SEPARADAMENTE"
                              ? "Separadamente"
                              : "Não informado"}
                        </TableCell>
                        <TableCell className="p-3 font-semibold">
                          {item.pendentes} de {item.total}
                        </TableCell>
                        <TableCell className="p-3">
                          {dataExibicao(item.dataPrevistaDevolucao)}
                        </TableCell>
                        <TableCell className="p-3">
                          <Badge
                            variant={
                              item.situacao === "CONCLUIDO"
                                ? "secondary"
                                : item.emAtraso
                                  ? "outline"
                                  : "default"
                            }
                          >
                            {situacao.texto}
                          </Badge>
                        </TableCell>
                        <TableCell className="p-3">
                          <Button asChild variant="outline" size="sm">
                            <Link
                              prefetch={false}
                              href={`/emprestimos/${item.id}?${detalhe}`}
                            >
                              Abrir
                            </Link>
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            ) : (
              <p className="mt-4 rounded-lg bg-[#f7f9fc] p-5 text-sm">
                Nenhum empréstimo encontrado para esta consulta.
              </p>
            )}
            <div className="mt-5">
              <PaginationSummary meta={resposta.meta} href={hrefPagina} />
            </div>
          </section>
        )
      )}
    </main>
  );
}
