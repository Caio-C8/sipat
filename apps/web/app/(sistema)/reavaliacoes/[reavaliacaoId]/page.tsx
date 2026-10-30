import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ReavaliacaoParamsSchema } from "@repo/contracts";
import { obterIdentidadeAtual } from "@/lib/auth/server-session";
import { isApiError } from "@/lib/api/core/api-error";
import { serverReavaliacaoOperations } from "@/features/reavaliacoes/api/server-reavaliacao-operations";
import { ErroReavaliacao } from "@/features/reavaliacoes/components/erro-reavaliacao";
import {
  formatarDataCivil,
  formatarDecimal,
  painelReavaliacao,
} from "@/features/reavaliacoes/presentation";

export const metadata: Metadata = { title: "Detalhes da reavaliação" };

export default async function ReavaliacaoDetalhePage({
  params,
}: {
  params: Promise<{ reavaliacaoId: string }>;
}) {
  if (!(await obterIdentidadeAtual())) return null;
  const parsed = ReavaliacaoParamsSchema.safeParse(await params);
  if (!parsed.success) notFound();
  let resposta: Awaited<
    ReturnType<typeof serverReavaliacaoOperations.consultar>
  >;
  try {
    resposta = await serverReavaliacaoOperations.consultar(
      parsed.data.reavaliacaoId,
      {
        cookie: (await headers()).get("cookie") ?? "",
      },
    );
  } catch (erro) {
    if (isApiError(erro) && erro.status === 404) notFound();
    return (
      <main className="p-4 sm:p-7">
        <h1 className="mb-4 text-2xl font-bold">Detalhes da reavaliação</h1>
        <ErroReavaliacao erro={erro} />
      </main>
    );
  }
  const item = resposta.dados;
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
    <main className="grid min-w-0 gap-5 p-4 text-[#19355d] sm:p-7">
      <header>
        <Link
          prefetch={false}
          href="/reavaliacoes"
          className="text-sm underline"
        >
          Voltar às reavaliações
        </Link>
        <h1 className="mt-4 text-2xl font-bold">Detalhes da reavaliação</h1>
        <p className="mt-2 text-sm">
          Patrimônio{" "}
          {item.patrimonio.numeroPatrimonio ?? "sem número histórico"} ·{" "}
          {item.patrimonio.descricao ?? "descrição histórica não registrada"}
        </p>
      </header>
      <section
        className={painelReavaliacao}
        aria-labelledby="dados-registro-title"
      >
        <h2 id="dados-registro-title" className="mb-4 font-bold">
          Registro individual
        </h2>
        <dl className="grid gap-4 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-[#526580]">Data de referência</dt>
            <dd className="font-semibold">
              {formatarDataCivil(item.dataReferencia)}
            </dd>
          </div>
          <div>
            <dt className="text-[#526580]">Comissão na data</dt>
            <dd className="font-semibold">
              {item.comissao.nome ?? "Nome histórico não registrado"}
            </dd>
          </div>
          <div>
            <dt className="text-[#526580]">Registrado por</dt>
            <dd className="font-semibold">
              {item.registradoPor.nome ?? "Nome histórico não registrado"}
            </dd>
          </div>
          <div>
            <dt className="text-[#526580]">Identificador</dt>
            <dd className="break-all font-mono text-xs">{item.id}</dd>
          </div>
        </dl>
      </section>
      <section className={painelReavaliacao} aria-labelledby="comparacao-title">
        <h2 id="comparacao-title" className="mb-4 font-bold">
          Comparação contábil
        </h2>
        {item.novo ? (
          <>
            <div
              className="overflow-x-auto"
              role="region"
              aria-label="Comparação de valores"
              tabIndex={0}
            >
              <table className="w-full text-left text-sm">
                <caption className="sr-only">
                  Valores anteriores e novos
                </caption>
                <thead className="bg-[#f7f9fc]">
                  <tr>
                    <th scope="col" className="p-3">
                      Campo
                    </th>
                    <th scope="col" className="p-3">
                      Anterior
                    </th>
                    <th scope="col" className="p-3">
                      Novo ciclo
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {linhas.map(([nome, anterior, novo]) => (
                    <tr key={nome} className="border-b">
                      <th scope="row" className="p-3 font-medium">
                        {nome}
                      </th>
                      <td className="p-3">
                        {anterior === null
                          ? "Não havia parâmetro"
                          : formatarDecimal(anterior)}
                      </td>
                      <td className="p-3">{formatarDecimal(novo)}</td>
                    </tr>
                  ))}
                  <tr className="border-b">
                    <th scope="row" className="p-3 font-medium">
                      Residual percentual
                    </th>
                    <td className="p-3">
                      {item.anterior?.percentualResidualAnterior
                        ? `${item.anterior!.percentualResidualAnterior!.replace(".", ",")}%`
                        : "—"}
                    </td>
                    <td className="p-3">
                      {item.novo.percentualResidualNovo
                        ? `${item.novo.percentualResidualNovo.replace(".", ",")}%`
                        : "—"}
                    </td>
                  </tr>
                  <tr className="border-b">
                    <th scope="row" className="p-3 font-medium">
                      Vida útil inicial
                    </th>
                    <td className="p-3">
                      {item.anterior
                        ? `${item.anterior.vidaUtilInicialAnteriorMeses} meses`
                        : "Não havia"}
                    </td>
                    <td className="p-3">{item.novo.vidaUtilNovaMeses} meses</td>
                  </tr>
                  <tr className="border-b">
                    <th scope="row" className="p-3 font-medium">
                      Depreciações realizadas no parâmetro
                    </th>
                    <td className="p-3">
                      {item.anterior?.quantidadeDepreciacoesAnteriores ??
                        "Não havia"}
                    </td>
                    <td className="p-3">0 no início</td>
                  </tr>
                  <tr>
                    <th scope="row" className="p-3 font-medium">
                      Vida útil restante no momento
                    </th>
                    <td className="p-3">
                      {item.anterior
                        ? `${item.anterior.vidaUtilRestanteAnteriorMeses} meses`
                        : "Não havia"}
                    </td>
                    <td className="p-3">{item.novo.vidaUtilNovaMeses} meses</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="mt-4 text-xs text-[#526580]">
              {item.anterior
                ? "A depreciação anterior permanece no histórico. O acumulado exibido para o novo ciclo começa em zero."
                : "Este é o primeiro parâmetro de depreciação do patrimônio. Não havia parâmetro anterior."}
            </p>
          </>
        ) : (
          <p className="text-sm text-[#526580]">
            Este registro anterior à implantação não possui snapshots
            suficientes para uma comparação completa. Nenhum valor histórico foi
            inventado.
          </p>
        )}
      </section>
    </main>
  );
}
