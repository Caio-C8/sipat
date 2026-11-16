import Link from "next/link";
import { Search } from "lucide-react";
import type { ListarPatrimoniosResponse } from "@repo/contracts";
import { formatBrl, subtractDecimal } from "@/lib/format/decimal";
import { PaginationSummary } from "@/components/shared/pagination-summary";
import { PageHeader } from "@/components/shared/page-header";
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
import {
  PatrimonioFiltros,
  type OpcaoFiltroPatrimonio,
} from "./patrimonio-filtros";

const pagina =
  "mx-auto grid w-full min-w-0 max-w-[1900px] gap-4 px-4 py-4 text-foreground sm:px-7 sm:py-6";
const rotulosStatus: Record<string, string> = {
  ATIVO: "Ativo",
  BAIXADO: "Baixado",
  EMPRESTADO: "Emprestado",
  EM_MANUTENCAO: "Em manutenção",
};

export function PatrimonioLista({
  resposta,
  valores,
  podeCadastrar,
  setores,
  especies,
  naturezas,
}: {
  resposta: ListarPatrimoniosResponse;
  valores: Record<string, string>;
  podeCadastrar: boolean;
  setores: readonly OpcaoFiltroPatrimonio[];
  especies: readonly OpcaoFiltroPatrimonio[];
  naturezas: readonly OpcaoFiltroPatrimonio[];
}) {
  const hrefPagina = (numero: number) =>
    `/patrimonios?${new URLSearchParams({ ...valores, pagina: String(numero) }).toString()}`;
  return (
    <main className={pagina}>
      <PageHeader
        title="Consultar patrimônio"
        description="Encontre um bem e acompanhe seus dados e ocorrências em um só lugar."
        actions={
          podeCadastrar ? (
            <Button asChild size="lg">
              <Link href="/patrimonios/novo">+ Novo patrimônio</Link>
            </Button>
          ) : undefined
        }
      />
      <Card asChild className="min-w-0 gap-4">
        <section aria-labelledby="pesquisa-title">
          <CardHeader>
            <CardTitle id="pesquisa-title" className="flex items-center gap-2">
              <Search className="size-4 text-interactive" /> Pesquisar
              patrimônio
            </CardTitle>
          </CardHeader>
          <CardContent>
            <PatrimonioFiltros
              valores={valores}
              setoresIniciais={setores}
              especiesIniciais={especies}
              naturezasIniciais={naturezas}
            />
          </CardContent>
        </section>
      </Card>
      <Card asChild className="min-w-0 gap-4">
        <section aria-labelledby="resultados-title">
          <CardHeader className="flex-row flex-wrap items-center justify-between gap-2">
            <CardTitle id="resultados-title">Resultados da pesquisa</CardTitle>
            <span className="text-sm text-muted-foreground">
              {resposta.meta.total}{" "}
              {resposta.meta.total === 1
                ? "patrimônio encontrado"
                : "patrimônios encontrados"}
            </span>
          </CardHeader>
          <CardContent>
            {resposta.dados.length === 0 ? (
              <p
                role="status"
                className="rounded-lg bg-muted p-8 text-center text-sm text-muted-foreground"
              >
                Nenhum bem corresponde aos filtros informados.
              </p>
            ) : (
              <Table
                className="min-w-[850px]"
                containerProps={{
                  role: "region",
                  "aria-label": "Patrimônios encontrados",
                  tabIndex: 0,
                }}
              >
                <TableHeader className="bg-muted text-xs uppercase text-muted-foreground">
                  <TableRow>
                    <TableHead>Patrimônio</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead>Setor / responsável</TableHead>
                    <TableHead>Situação</TableHead>
                    <TableHead>Valor atual</TableHead>
                    <TableHead>Ação</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {resposta.dados.map((item) => {
                    const liquido = subtractDecimal(
                      item.situacaoContabil.valorBrutoAtual,
                      item.situacaoContabil.depreciacaoAcumuladaAtual,
                    );
                    return (
                      <TableRow key={item.id}>
                        <TableCell className="font-semibold whitespace-normal">
                          {item.numeroPatrimonio}
                          <small className="mt-1 block font-normal text-muted-foreground">
                            {item.tipoNumeroPatrimonial === "OFICIAL"
                              ? "Numeração oficial"
                              : "Numeração não oficial (S/P)"}
                          </small>
                        </TableCell>
                        <TableCell className="whitespace-normal">
                          <strong>{item.descricao}</strong>
                          <small className="mt-1 block text-muted-foreground">
                            {item.especie.nome} · {item.especie.natureza.nome}
                          </small>
                        </TableCell>
                        <TableCell className="whitespace-normal">
                          {item.setorAtual.nome}
                          <small className="mt-1 block text-muted-foreground">
                            {item.setorAtual.responsavel.nome}
                          </small>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {rotulosStatus[item.status]}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-semibold">
                          {formatBrl(liquido)}
                        </TableCell>
                        <TableCell>
                          <Button asChild variant="link" className="px-0">
                            <Link href={`/patrimonios/${item.id}`}>
                              Ver ficha
                            </Link>
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
            <div className="mt-5">
              <PaginationSummary meta={resposta.meta} href={hrefPagina} />
            </div>
          </CardContent>
        </section>
      </Card>
    </main>
  );
}
