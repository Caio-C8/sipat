import Link from "next/link";
import { Eye, Plus } from "lucide-react";
import type { RelatorioTabularResponse } from "@repo/contracts";
import { Button } from "@/components/ui/button";
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
import { FiltrosBaixas } from "./filtros-baixas";
import {
  formatarDataBaixa,
  formatarInstanteBaixa,
  rotulosTipoBaixa,
} from "../apresentacao";

type RespostaBaixas = Extract<RelatorioTabularResponse, { tipo: "baixas" }>;

export function BaixasLista({
  resposta,
  valores,
  diretor,
}: {
  resposta: RespostaBaixas;
  valores: Record<string, string>;
  diretor: boolean;
}) {
  const temFiltros = [
    "inicio",
    "fim",
    "tipo",
    "patrimonioId",
    "comissaoId",
  ].some((campo) => Boolean(valores[campo]));
  const hrefPagina = (pagina: number) =>
    `/baixas?${new URLSearchParams({ ...valores, pagina: String(pagina) }).toString()}`;
  return (
    <main className="mx-auto grid w-full max-w-[1900px] gap-5 p-4 text-foreground sm:p-7">
      <PageHeader
        title="Baixa"
        description="Consulte registros patrimoniais baixados e seus dados de auditoria."
        actions={
          diretor ? (
            <Button asChild>
              <Link href="/baixas/nova">
                <Plus aria-hidden="true" /> Registrar baixa
              </Link>
            </Button>
          ) : undefined
        }
      />
      <FiltrosBaixas valores={valores} />
      <section
        className="min-w-0 rounded-lg border border-border bg-card"
        aria-labelledby="titulo-baixas"
      >
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border p-4 sm:p-5">
          <div>
            <h2 id="titulo-baixas" className="font-bold">
              Baixas registradas
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {resposta.meta.total}{" "}
              {resposta.meta.total === 1
                ? "registro encontrado"
                : "registros encontrados"}
            </p>
          </div>
          <p className="text-sm">
            Página {resposta.meta.pagina} de {resposta.meta.ultimaPagina}
          </p>
        </div>
        {resposta.dados.length === 0 ? (
          <div className="p-8 text-center">
            <p role="status" className="font-semibold">
              {temFiltros
                ? "Nenhuma baixa corresponde aos filtros."
                : "Nenhuma baixa foi registrada."}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {temFiltros
                ? "Revise os filtros informados e tente novamente."
                : "Os registros aparecerão aqui após a primeira baixa."}
            </p>
          </div>
        ) : (
          <Table
            className="min-w-[980px]"
            containerProps={{
              tabIndex: 0,
              role: "region",
              "aria-label": "Tabela de baixas registradas",
            }}
          >
            <TableHeader className="bg-muted text-xs uppercase tracking-wide text-muted-foreground">
              <TableRow>
                <TableHead className="p-4" scope="col">
                  Patrimônio
                </TableHead>
                <TableHead className="p-4" scope="col">
                  Data e tipo
                </TableHead>
                <TableHead className="p-4" scope="col">
                  Comissão
                </TableHead>
                <TableHead className="p-4" scope="col">
                  Motivo
                </TableHead>
                <TableHead className="p-4" scope="col">
                  Registro
                </TableHead>
                <TableHead className="p-4 text-right" scope="col">
                  Ação
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {resposta.dados.map((baixa) => (
                <TableRow key={baixa.id} className="align-top">
                  <TableCell className="p-4 whitespace-normal">
                    <strong className="block">{baixa.numeroPatrimonio}</strong>
                    <span className="mt-1 block max-w-64 break-words text-muted-foreground">
                      {baixa.descricao}
                    </span>
                  </TableCell>
                  <TableCell className="p-4">
                    <span className="block">
                      {formatarDataBaixa(baixa.dataBaixa)}
                    </span>
                    <span className="mt-1 block text-muted-foreground">
                      {rotulosTipoBaixa[baixa.tipo] ?? baixa.tipo}
                    </span>
                  </TableCell>
                  <TableCell className="p-4">{baixa.comissao}</TableCell>
                  <TableCell className="max-w-80 break-words p-4 whitespace-normal">
                    {baixa.motivo}
                  </TableCell>
                  <TableCell className="p-4">
                    <span className="block">{baixa.autor}</span>
                    <span className="mt-1 block text-muted-foreground">
                      {formatarInstanteBaixa(baixa.registroEm)}
                    </span>
                  </TableCell>
                  <TableCell className="p-4 text-right">
                    <Button asChild size="sm" variant="outline">
                      <Link
                        href={`/baixas/${baixa.patrimonioId}?retorno=${encodeURIComponent(`/baixas?${new URLSearchParams(valores).toString()}`)}`}
                      >
                        <Eye aria-hidden="true" /> Ver detalhe
                      </Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
        <div className="border-t border-border p-4">
          <PaginationSummary meta={resposta.meta} href={hrefPagina} />
        </div>
      </section>
    </main>
  );
}
