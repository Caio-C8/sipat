import { headers } from "next/headers";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import {
  ReavaliacaoParamsSchema,
  type ReavaliacaoDetalhe,
} from "@repo/contracts";
import { exigirIdentidadeAtual } from "@/lib/auth/server-session";
import { isApiError } from "@/lib/api/core/api-error";
import { serverReavaliacaoOperations } from "../api/server-reavaliacao-operations";
import { formatarDataCivil, formatarDecimal } from "../presentation";
import { ErroReavaliacao } from "./erro-reavaliacao";
import { PageHeader } from "@/components/shared/page-header";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

function DetalheConteudo({ item }: { item: ReavaliacaoDetalhe }) {
  const linhas: [string, string | null, string][] = item.novo
    ? [
        [
          "Valor bruto",
          item.contabilAnterior?.valorBrutoAnterior ?? null,
          item.novo.valorBrutoNovo,
        ],
        [
          "Depreciação acumulada do ciclo",
          item.contabilAnterior?.depreciacaoAcumuladaAnterior ?? null,
          "0",
        ],
        ["Valor líquido", item.valorLiquidoAnterior, item.novo.valorBrutoNovo],
        [
          "Base de depreciação",
          item.anterior?.valorBaseAnterior ?? null,
          item.novo.valorBaseNova,
        ],
        [
          "Valor residual",
          item.anterior?.valorResidualAnterior ?? null,
          item.novo.valorResidualNovo,
        ],
      ]
    : [];

  return (
    <section className="grid gap-6 rounded-lg border border-border bg-card p-5 text-[#19355d] sm:p-7">
      <section
        className="rounded-md bg-[#eef5ff] p-4"
        aria-labelledby="patrimonio-reavaliado-title"
      >
        <p className="text-xs font-semibold tracking-wide text-[#52709a] uppercase">
          Patrimônio reavaliado
        </p>
        <h2 id="patrimonio-reavaliado-title" className="mt-1 text-lg font-bold">
          {item.patrimonio.descricao ?? "Descrição histórica não registrada"}
        </h2>
        <p className="mt-1 text-sm text-[#526580]">
          {item.patrimonio.numeroPatrimonio ??
            "Número histórico não registrado"}
        </p>
      </section>
      <section aria-labelledby="dados-registro-title">
        <h2 id="dados-registro-title" className="mb-4 font-bold">
          Dados do registro
        </h2>
        <dl className="grid gap-x-6 gap-y-4 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-xs text-[#526580]">Data de referência</dt>
            <dd className="mt-1 font-semibold">
              {formatarDataCivil(item.dataReferencia)}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-[#526580]">Comissão na data</dt>
            <dd className="mt-1 font-semibold">
              {item.comissao.nome ?? "Nome histórico não registrado"}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-[#526580]">Registrado por</dt>
            <dd className="mt-1 font-semibold">
              {item.registradoPor.nome ?? "Nome histórico não registrado"}
            </dd>
          </div>
        </dl>
      </section>
      <section
        className="border-t border-[#e4eaf2] pt-5"
        aria-labelledby="comparacao-title"
      >
        <h2 id="comparacao-title" className="mb-4 font-bold">
          Valores da reavaliação
        </h2>
        {item.novo ? (
          <>
            <Table
              className="min-w-[34rem]"
              containerProps={{
                role: "region",
                "aria-label": "Comparação de valores",
                tabIndex: 0,
              }}
            >
              <TableCaption className="sr-only">
                Valores anteriores e novos
              </TableCaption>
              <TableHeader className="bg-muted text-xs text-muted-foreground">
                <TableRow>
                  <TableHead scope="col" className="p-3">
                    Campo
                  </TableHead>
                  <TableHead scope="col" className="p-3">
                    Anterior
                  </TableHead>
                  <TableHead scope="col" className="p-3">
                    Novo ciclo
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {linhas.map(([nome, anterior, novo]) => (
                  <TableRow key={nome}>
                    <TableHead scope="row" className="p-3 font-medium">
                      {nome}
                    </TableHead>
                    <TableCell className="p-3">
                      {anterior === null
                        ? "Não havia parâmetro"
                        : formatarDecimal(anterior)}
                    </TableCell>
                    <TableCell className="p-3 font-semibold text-primary">
                      {formatarDecimal(novo)}
                    </TableCell>
                  </TableRow>
                ))}
                <TableRow>
                  <TableHead scope="row" className="p-3 font-medium">
                    Residual percentual
                  </TableHead>
                  <TableCell className="p-3">
                    {item.anterior?.percentualResidualAnterior
                      ? `${item.anterior.percentualResidualAnterior.replace(".", ",")}%`
                      : "—"}
                  </TableCell>
                  <TableCell className="p-3">
                    {item.novo.percentualResidualNovo
                      ? `${item.novo.percentualResidualNovo.replace(".", ",")}%`
                      : "—"}
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableHead scope="row" className="p-3 font-medium">
                    Vida útil
                  </TableHead>
                  <TableCell className="p-3">
                    {item.anterior
                      ? `${item.anterior.vidaUtilRestanteAnteriorMeses} meses restantes`
                      : "Não havia"}
                  </TableCell>
                  <TableCell className="p-3">
                    {item.novo.vidaUtilNovaMeses} meses
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
            <div className="mt-5 rounded-md border border-[#dbe8fb] bg-[#f4f8ff] p-4">
              <p className="text-xs text-[#526580]">Novo valor bruto</p>
              <p className="mt-1 text-xl font-bold text-[#2863ec]">
                {formatarDecimal(item.novo.valorBrutoNovo)}
              </p>
              <p className="mt-2 text-xs text-[#526580]">
                {item.anterior
                  ? "A depreciação anterior permanece no histórico; o novo ciclo começa com acumulado zero."
                  : "Este é o primeiro parâmetro de depreciação do patrimônio."}
              </p>
            </div>
          </>
        ) : (
          <p className="text-sm text-[#526580]">
            Este registro anterior à implantação não possui snapshots
            suficientes para uma comparação completa.
          </p>
        )}
      </section>
    </section>
  );
}

export async function ReavaliacaoDetalheServer({
  reavaliacaoId,
  retorno,
}: {
  reavaliacaoId: string;
  retorno: string;
}) {
  await exigirIdentidadeAtual();
  const parsed = ReavaliacaoParamsSchema.safeParse({ reavaliacaoId });
  if (!parsed.success) notFound();
  let item: ReavaliacaoDetalhe | null = null;
  let erroConsulta: unknown = null;
  try {
    item = (
      await serverReavaliacaoOperations.consultar(parsed.data.reavaliacaoId, {
        cookie: (await headers()).get("cookie") ?? "",
      })
    ).dados;
  } catch (erro) {
    if (isApiError(erro) && erro.status === 404) notFound();
    erroConsulta = erro;
  }
  if (!item) {
    return (
      <main className="grid min-w-0 gap-5 p-4 sm:p-7">
        <PageHeader
          title="Detalhes da reavaliação"
          description="Não foi possível carregar os dados deste registro."
          actions={<AcaoVoltar retorno={retorno} />}
        />
        <ErroReavaliacao erro={erroConsulta} />
      </main>
    );
  }
  return (
    <main className="grid min-w-0 gap-5 bg-[#f7f9fc] p-4 text-[#19355d] sm:p-7">
      <PageHeader
        title="Detalhes da reavaliação"
        description={
          <>
            Patrimônio {item.patrimonio.numeroPatrimonio ?? "sem número"} ·{" "}
            {item.patrimonio.descricao ?? "Descrição histórica não registrada"}
          </>
        }
        actions={<AcaoVoltar retorno={retorno} />}
      />
      <DetalheConteudo item={item} />
    </main>
  );
}

function AcaoVoltar({ retorno }: { retorno: string }) {
  return (
    <Link
      prefetch={false}
      href={retorno}
      className="inline-flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground"
    >
      <ChevronLeft aria-hidden="true" className="size-4" />
      Voltar às reavaliações
    </Link>
  );
}
