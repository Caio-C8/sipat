import type { Metadata } from "next";
import { headers } from "next/headers";
import Link from "next/link";
import { queryRelatorio } from "@repo/contracts";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PageHeader } from "@/components/shared/page-header";
import { PaginationSummary } from "@/components/shared/pagination-summary";
import { exigirIdentidadeAtual } from "@/lib/auth/server-session";
import { formatBrl } from "@/lib/format/decimal";
import { serverRelatorios } from "@/features/relatorios/api/server";
import { mensagemRelatorio } from "@/features/relatorios/apresentacao";
import { FiltrosDepreciacoes } from "@/features/depreciacoes/components/filtros-depreciacoes";

export const metadata: Metadata = { title: "Depreciações" };
type Parametros = Record<string, string | string[] | undefined>;

function formatarCompetencia(competencia: string) {
  const [ano, mes] = competencia.split("-");
  return `${mes}/${ano}`;
}

export default async function DepreciacoesPage({
  searchParams,
}: {
  searchParams: Promise<Parametros>;
}) {
  const identidade = await exigirIdentidadeAtual();
  const cookie = (await headers()).get("cookie") ?? "";
  const recebidos = Object.fromEntries(
    Object.entries(await searchParams).filter(
      ([, valor]) => typeof valor === "string" && valor !== "",
    ),
  ) as Record<string, string>;
  const valores = {
    ...recebidos,
    limite: recebidos.limite ?? "20",
  };
  const validacao = queryRelatorio("depreciacoes").safeParse(valores);
  let resposta: Awaited<
    ReturnType<typeof serverRelatorios.listar.depreciacoes>
  > | null = null;
  let erro: unknown = null;
  if (validacao.success) {
    try {
      resposta = await serverRelatorios.listar.depreciacoes(valores, {
        cookie,
      });
    } catch (falha) {
      erro = falha;
    }
  }

  const consulta = new URLSearchParams(valores);
  const hrefPagina = (pagina: number) => {
    const proxima = new URLSearchParams(consulta);
    proxima.set("pagina", String(pagina));
    return `/depreciacoes?${proxima}`;
  };

  return (
    <main className="grid min-w-0 gap-5 p-4 text-foreground sm:p-7">
      <PageHeader
        title="Depreciações"
        description="Consulte os valores processados por competência e patrimônio."
        actions={
          identidade.perfil === "DIRETOR_PATRIMONIO" ? (
            <Button asChild>
              <Link href="/depreciacao">Processar depreciações</Link>
            </Button>
          ) : undefined
        }
      />
      <FiltrosDepreciacoes valores={valores} />
      {!validacao.success ? (
        <Alert variant="destructive">
          <AlertDescription>
            Não foi possível aplicar os filtros. A competência deve ser um mês
            válido e as opções selecionadas precisam continuar disponíveis.
          </AlertDescription>
        </Alert>
      ) : erro ? (
        <Alert variant="destructive">
          <AlertDescription>{mensagemRelatorio(erro)}</AlertDescription>
        </Alert>
      ) : resposta ? (
        <section
          className="rounded-lg border border-border bg-card p-4 sm:p-5"
          aria-labelledby="depreciacoes-processadas"
        >
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 id="depreciacoes-processadas" className="font-bold">
                Depreciações processadas
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {resposta.resumo.bensDistintos} bem(ns) ·{" "}
                {resposta.resumo.quotas
                  ? formatBrl(resposta.resumo.quotas)
                  : "Sem quota total"}{" "}
                depreciados no período
              </p>
            </div>
            <p className="text-sm text-muted-foreground">
              {resposta.meta.total} registro(s)
            </p>
          </div>
          {resposta.dados.length ? (
            <Table
              className="min-w-[900px]"
              containerClassName="mt-4"
              containerProps={{
                role: "region",
                "aria-label": "Depreciações processadas",
                tabIndex: 0,
              }}
            >
              <TableHeader className="bg-muted text-xs uppercase text-muted-foreground">
                <TableRow>
                  {[
                    "Patrimônio / bem",
                    "Competência",
                    "Valor anterior",
                    "Depreciado",
                    "Valor posterior",
                    "Comissão / autor",
                  ].map((titulo) => (
                    <TableHead key={titulo} scope="col" className="p-3">
                      {titulo}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {resposta.dados.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="max-w-80 p-3 whitespace-normal">
                      <Link
                        href={`/patrimonios/${item.patrimonioId}`}
                        className="font-semibold text-interactive hover:underline"
                      >
                        {item.numeroPatrimonio}
                      </Link>
                      <p className="mt-1 text-muted-foreground">
                        {item.descricao}
                      </p>
                    </TableCell>
                    <TableCell className="p-3 font-semibold">
                      {formatarCompetencia(item.competencia)}
                    </TableCell>
                    <TableCell className="p-3">
                      {formatBrl(item.valorContabilAnterior)}
                    </TableCell>
                    <TableCell className="p-3 font-semibold text-interactive">
                      {formatBrl(item.valorDepreciado)}
                    </TableCell>
                    <TableCell className="p-3">
                      {formatBrl(item.valorContabilNovo)}
                    </TableCell>
                    <TableCell className="p-3 whitespace-normal">
                      <strong>{item.comissao}</strong>
                      <p className="mt-1 text-muted-foreground">{item.autor}</p>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="mt-4 rounded-lg bg-muted p-5 text-sm">
              Nenhuma depreciação encontrada para os filtros informados.
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
