import type { Metadata } from "next";
import { headers } from "next/headers";
import Link from "next/link";
import { ListarInventariosQuerySchema } from "@repo/contracts";
import { PaginationSummary } from "@/components/shared/pagination-summary";
import { PageHeader } from "@/components/shared/page-header";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { serverInventarioOperations } from "@/features/inventarios/api/server-inventario-operations";
import { InventarioFilters } from "@/features/inventarios/components/inventario-filters";
import { isApiError } from "@/lib/api/core/api-error";
import { exigirIdentidadeAtual } from "@/lib/auth/server-session";

export const metadata: Metadata = { title: "Inventários" };
const rotulos = {
  PENDENTE: "Pendente",
  EM_ANDAMENTO: "Em andamento",
  FINALIZADO: "Finalizado",
} as const;
const data = (valor: string) =>
  new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: "America/Sao_Paulo",
  }).format(new Date(valor));

export default async function InventariosPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const identidade = await exigirIdentidadeAtual();
  const params = await searchParams;
  const busca = typeof params.busca === "string" ? params.busca : undefined;
  const status = typeof params.status === "string" ? params.status : undefined;
  const comissaoId =
    typeof params.comissaoId === "string" ? params.comissaoId : undefined;
  const pagina = typeof params.pagina === "string" ? params.pagina : "1";
  const validacao = ListarInventariosQuerySchema.safeParse({
    busca,
    status,
    comissaoId,
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
        {
          pagina,
          limite: "20",
          ...(busca ? { busca } : {}),
          ...(validacao.data.status ? { status: validacao.data.status } : {}),
          ...(comissaoId ? { comissaoId } : {}),
        },
        { cookie: (await headers()).get("cookie") ?? "" },
      );
    } catch (falha) {
      erro = isApiError(falha)
        ? falha.message
        : "Não foi possível consultar os inventários. Tente novamente.";
    }
  }
  const hrefPagina = (numero: number) => {
    const query = new URLSearchParams({ pagina: String(numero) });
    if (busca) query.set("busca", busca);
    if (status) query.set("status", status);
    if (comissaoId) query.set("comissaoId", comissaoId);
    return `/inventarios?${query}`;
  };
  return (
    <main className="grid min-w-0 gap-5 p-4 sm:p-7">
      <PageHeader
        title="Inventários"
        description="Consulte o andamento, as divergências e as correções registradas."
        actions={
          identidade.perfil === "DIRETOR_PATRIMONIO" ? (
            <Button size="lg" asChild>
              <Link href="/inventarios/novo">Abrir inventário</Link>
            </Button>
          ) : undefined
        }
      />
      <Card>
        <CardContent>
          <InventarioFilters
            buscaInicial={busca}
            statusInicial={status}
            comissaoInicial={comissaoId}
          />
        </CardContent>
      </Card>
      {!validacao.success || erro ? (
        <Alert variant="destructive">
          <AlertTitle>Não foi possível mostrar os inventários</AlertTitle>
          <AlertDescription>
            {erro || "Revise os filtros informados e tente novamente."}
          </AlertDescription>
        </Alert>
      ) : resposta ? (
        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle>Inventários registrados</CardTitle>
            <span className="text-sm text-muted-foreground">
              {resposta.meta.total} registros
            </span>
          </CardHeader>
          <CardContent className="grid gap-5">
            {resposta.dados.length ? (
              <div role="region" aria-label="Inventários" tabIndex={0}>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Inventário</TableHead>
                      <TableHead>Comissão</TableHead>
                      <TableHead>Progresso</TableHead>
                      <TableHead>Situação</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {resposta.dados.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="min-w-56 whitespace-normal">
                          <Link
                            className="font-semibold text-primary hover:underline"
                            href={`/inventarios/${item.id}`}
                          >
                            {item.nome}
                          </Link>
                          <p className="mt-1 text-xs text-muted-foreground">
                            Criado em {data(item.createdAt)}
                          </p>
                        </TableCell>
                        <TableCell className="min-w-48 whitespace-normal">
                          {item.comissao.nome}
                        </TableCell>
                        <TableCell className="min-w-56 whitespace-normal">
                          {item.progresso.itensVerificados} de{" "}
                          {item.progresso.totalItens} bens verificados
                          <p className="mt-1 text-xs text-muted-foreground">
                            {item.progresso.correcoesPendentes} correções
                            pendentes
                          </p>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {rotulos[item.status]}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex justify-end gap-2">
                            <Button variant="outline" asChild>
                              <Link href={`/inventarios/${item.id}`}>
                                Consultar
                              </Link>
                            </Button>
                            {identidade.perfil === "DIRETOR_PATRIMONIO" &&
                            item.status === "PENDENTE" ? (
                              <Button variant="ghost" asChild>
                                <Link href={`/inventarios/${item.id}/editar`}>
                                  Editar
                                </Link>
                              </Button>
                            ) : null}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <p className="py-12 text-center text-sm text-muted-foreground">
                Nenhum inventário encontrado. Ajuste os filtros e tente
                novamente.
              </p>
            )}
            <PaginationSummary meta={resposta.meta} href={hrefPagina} />
          </CardContent>
        </Card>
      ) : null}
    </main>
  );
}
