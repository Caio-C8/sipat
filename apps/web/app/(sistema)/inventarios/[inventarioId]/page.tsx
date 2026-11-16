import type { Metadata } from "next";
import { headers } from "next/headers";
import Link from "next/link";
import {
  InventarioParamsSchema,
  ListarItensInventarioQuerySchema,
} from "@repo/contracts";
import { PaginationSummary } from "@/components/shared/pagination-summary";
import { PageHeader } from "@/components/shared/page-header";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { serverInventarioOperations } from "@/features/inventarios/api/server-inventario-operations";
import { FinalizarInventarioDialog } from "@/features/inventarios/components/finalizar-inventario-dialog";
import { ResolverCorrecaoDialog } from "@/features/inventarios/components/resolver-correcao-dialog";
import { isApiError } from "@/lib/api/core/api-error";
import { exigirIdentidadeAtual } from "@/lib/auth/server-session";

export const metadata: Metadata = { title: "Detalhe do inventário" };
const data = (valor: string | null) =>
  valor
    ? new Intl.DateTimeFormat("pt-BR", {
        dateStyle: "short",
        timeStyle: "short",
        timeZone: "America/Sao_Paulo",
      }).format(new Date(valor))
    : "—";

export default async function InventarioDetalhePage({
  params,
  searchParams,
}: {
  params: Promise<{ inventarioId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const identidade = await exigirIdentidadeAtual();
  const { inventarioId } = await params;
  if (!InventarioParamsSchema.safeParse({ inventarioId }).success)
    return (
      <main className="p-7">
        <Alert variant="destructive">
          <AlertTitle>Inventário não encontrado</AlertTitle>
          <AlertDescription>
            Confira o endereço ou volte para a lista de inventários.
          </AlertDescription>
        </Alert>
      </main>
    );
  const tela = await searchParams;
  const visao = typeof tela.visao === "string" ? tela.visao : "pendentes";
  const busca = typeof tela.busca === "string" ? tela.busca : undefined;
  const pagina = typeof tela.pagina === "string" ? tela.pagina : "1";
  const query = {
    pagina,
    limite: "50",
    ...(busca ? { busca } : {}),
    ...(visao === "pendentes"
      ? { statusCorrecao: "PENDENTE" as const }
      : visao === "nao-localizados"
        ? { situacao: "NAO_LOCALIZADO" as const }
        : {}),
  };
  const queryValidada = ListarItensInventarioQuerySchema.safeParse(query);
  let detalhe: Awaited<
    ReturnType<typeof serverInventarioOperations.consultar>
  > | null = null;
  let itens: Awaited<
    ReturnType<typeof serverInventarioOperations.itens>
  > | null = null;
  let erro = "";
  try {
    if (!queryValidada.success) throw new Error("Filtros inválidos.");
    const cookie = (await headers()).get("cookie") ?? "";
    [detalhe, itens] = await Promise.all([
      serverInventarioOperations.consultar(inventarioId, { cookie }),
      serverInventarioOperations.itens(inventarioId, query, { cookie }),
    ]);
  } catch (falha) {
    erro = isApiError(falha)
      ? falha.message
      : "Não foi possível consultar este inventário. Tente novamente.";
  }
  const hrefVisao = (v: string, p = "1") =>
    `/inventarios/${inventarioId}?${new URLSearchParams({ visao: v, ...(busca ? { busca } : {}), pagina: p })}`;
  return (
    <main className="grid min-w-0 gap-5 p-4 sm:p-7">
      <Link
        className="text-sm font-medium text-muted-foreground hover:underline"
        href="/inventarios"
      >
        ← Todos os inventários
      </Link>
      {erro ? (
        <Alert variant="destructive">
          <AlertTitle>Não foi possível mostrar o inventário</AlertTitle>
          <AlertDescription>{erro}</AlertDescription>
        </Alert>
      ) : detalhe && itens ? (
        (() => {
          const inventario = detalhe.dados;
          return (
            <>
              <PageHeader
                title={
                  <span className="flex flex-wrap items-center gap-3">
                    <span>{inventario.nome}</span>
                    <Badge variant="outline">
                      {inventario.status === "FINALIZADO"
                        ? "Finalizado"
                        : inventario.status === "EM_ANDAMENTO"
                          ? "Em andamento"
                          : "Pendente"}
                    </Badge>
                  </span>
                }
                description={`${inventario.comissao.nome} · Criado em ${data(inventario.createdAt)}`}
                actions={
                  identidade.perfil === "DIRETOR_PATRIMONIO" ? (
                    <div className="flex flex-wrap items-start justify-end gap-3">
                      {inventario.status === "PENDENTE" ? (
                        <Button variant="outline" asChild>
                          <Link href={`/inventarios/${inventario.id}/editar`}>
                            Editar dados
                          </Link>
                        </Button>
                      ) : null}
                      <FinalizarInventarioDialog inventario={inventario} />
                    </div>
                  ) : undefined
                }
              />
              {inventario.status === "FINALIZADO" ? (
                <Alert>
                  <AlertTitle>Inventário finalizado</AlertTitle>
                  <AlertDescription>
                    Os dados e resultados permanecem disponíveis somente para
                    consulta.
                  </AlertDescription>
                </Alert>
              ) : null}
              <section
                className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
                aria-label="Resumo do inventário"
              >
                {[
                  [
                    "Setores concluídos",
                    `${inventario.progresso.setoresConcluidos} de ${inventario.progresso.totalSetores}`,
                  ],
                  ["Bens incluídos", String(inventario.progresso.totalItens)],
                  [
                    "Bens verificados",
                    String(inventario.progresso.itensVerificados),
                  ],
                  [
                    "Correções pendentes",
                    String(inventario.progresso.correcoesPendentes),
                  ],
                ].map(([rotulo, valor]) => (
                  <Card key={rotulo}>
                    <CardContent>
                      <span className="text-sm text-muted-foreground">
                        {rotulo}
                      </span>
                      <p className="mt-1 text-2xl font-bold">{valor}</p>
                    </CardContent>
                  </Card>
                ))}
              </section>
              <Card>
                <CardHeader>
                  <CardTitle>Itens do inventário</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-5">
                  <div className="flex flex-wrap items-end justify-between gap-3">
                    <nav
                      className="flex flex-wrap gap-2"
                      aria-label="Filtros de itens"
                    >
                      {(
                        [
                          ["pendentes", "Correções pendentes"],
                          ["todos", "Todos os itens"],
                          ["nao-localizados", "Não localizados"],
                        ] as const
                      ).map(([valor, rotulo]) => (
                        <Button
                          key={valor}
                          variant={visao === valor ? "secondary" : "ghost"}
                          asChild
                        >
                          <Link
                            aria-current={visao === valor ? "page" : undefined}
                            href={hrefVisao(valor)}
                          >
                            {rotulo}
                          </Link>
                        </Button>
                      ))}
                    </nav>
                    <form
                      action={`/inventarios/${inventarioId}`}
                      method="get"
                      className="flex gap-2"
                    >
                      <input type="hidden" name="visao" value={visao} />
                      <label className="sr-only" htmlFor="busca-itens">
                        Buscar bens
                      </label>
                      <Input
                        id="busca-itens"
                        name="busca"
                        defaultValue={busca ?? ""}
                        placeholder="Patrimônio ou descrição"
                        className="w-64"
                      />
                      <Button variant="outline">Buscar</Button>
                    </form>
                  </div>
                  {itens.dados.length ? (
                    <div
                      role="region"
                      aria-label="Itens do inventário"
                      tabIndex={0}
                    >
                      <Table className="min-w-[900px]">
                        <TableHeader>
                          <TableRow>
                            <TableHead>Patrimônio / bem</TableHead>
                            <TableHead>Resultado</TableHead>
                            <TableHead>Setor cadastrado</TableHead>
                            <TableHead>Setor encontrado</TableHead>
                            <TableHead>Correção</TableHead>
                            <TableHead>Ação</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {itens.dados.map((item) => {
                            const corrigivel =
                              item.situacao === "DIVERGENCIA" ||
                              item.situacao === "NAO_LOCALIZADO";
                            const setorEncontrado =
                              item.situacao === "DIVERGENCIA"
                                ? item.setorEncontrado.nome
                                : item.situacao === "NAO_LOCALIZADO"
                                  ? (item.localizacaoPosterior?.setorEncontrado
                                      .nome ?? "—")
                                  : "—";
                            const estado =
                              item.situacao === null
                                ? "Aguardando conferência"
                                : item.situacao === "DIVERGENCIA"
                                  ? item.statusCorrecao === "PENDENTE"
                                    ? "Pendente"
                                    : "Corrigido"
                                  : item.situacao === "NAO_LOCALIZADO"
                                    ? item.localizacaoPosterior
                                        ?.statusCorrecao === "PENDENTE"
                                      ? "Localizado depois · pendente"
                                      : item.localizacaoPosterior
                                        ? "Localizado depois · corrigido"
                                        : "Não localizado"
                                    : "Correto";
                            return (
                              <TableRow key={item.id}>
                                <TableCell className="min-w-64 whitespace-normal">
                                  <span className="text-xs text-muted-foreground">
                                    {item.patrimonio.numeroPatrimonio}
                                  </span>
                                  <strong className="mt-1 block">
                                    {item.patrimonio.descricao}
                                  </strong>
                                </TableCell>
                                <TableCell>
                                  {item.situacao === "DIVERGENCIA"
                                    ? "Setor divergente"
                                    : item.situacao === "NAO_LOCALIZADO"
                                      ? "Não localizado"
                                      : item.situacao === "CORRETO"
                                        ? "Correto"
                                        : "Pendente"}
                                </TableCell>
                                <TableCell>{item.setorEsperado.nome}</TableCell>
                                <TableCell>{setorEncontrado}</TableCell>
                                <TableCell>{estado}</TableCell>
                                <TableCell>
                                  {corrigivel ? (
                                    <ResolverCorrecaoDialog
                                      inventarioId={inventarioId}
                                      item={item}
                                      bloqueado={
                                        inventario.status === "FINALIZADO" ||
                                        identidade.perfil !==
                                          "DIRETOR_PATRIMONIO"
                                      }
                                    />
                                  ) : (
                                    "—"
                                  )}
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </div>
                  ) : (
                    <p className="py-12 text-center text-sm text-muted-foreground">
                      Nenhum item encontrado nesta consulta.
                    </p>
                  )}
                  <PaginationSummary
                    meta={itens.meta}
                    href={(p) => hrefVisao(visao, String(p))}
                  />
                </CardContent>
              </Card>
            </>
          );
        })()
      ) : null}
    </main>
  );
}
