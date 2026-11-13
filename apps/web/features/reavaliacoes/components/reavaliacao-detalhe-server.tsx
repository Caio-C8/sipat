import { headers } from "next/headers";
import { notFound } from "next/navigation";
import {
  ReavaliacaoParamsSchema,
  type ReavaliacaoDetalhe,
} from "@repo/contracts";
import { obterIdentidadeAtual } from "@/lib/auth/server-session";
import { isApiError } from "@/lib/api/core/api-error";
import { serverReavaliacaoOperations } from "../api/server-reavaliacao-operations";
import { formatarDataCivil, formatarDecimal } from "../presentation";
import { ErroReavaliacao } from "./erro-reavaliacao";
import { ReavaliacaoDetalheDrawer } from "./reavaliacao-detalhe-drawer";

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
    <div className="grid gap-6 p-5 text-[#19355d] sm:p-7">
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
          <div>
            <dt className="text-xs text-[#526580]">Identificador</dt>
            <dd className="mt-1 break-all font-mono text-xs">{item.id}</dd>
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
            <div
              className="overflow-x-auto"
              role="region"
              aria-label="Comparação de valores"
              tabIndex={0}
            >
              <table className="w-full min-w-[34rem] text-left text-sm">
                <caption className="sr-only">
                  Valores anteriores e novos
                </caption>
                <thead className="bg-[#f7f9fc] text-xs text-[#526580]">
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
                    <tr key={nome} className="border-b border-[#e4eaf2]">
                      <th scope="row" className="p-3 font-medium">
                        {nome}
                      </th>
                      <td className="p-3">
                        {anterior === null
                          ? "Não havia parâmetro"
                          : formatarDecimal(anterior)}
                      </td>
                      <td className="p-3 font-semibold text-[#173d6b]">
                        {formatarDecimal(novo)}
                      </td>
                    </tr>
                  ))}
                  <tr className="border-b border-[#e4eaf2]">
                    <th scope="row" className="p-3 font-medium">
                      Residual percentual
                    </th>
                    <td className="p-3">
                      {item.anterior?.percentualResidualAnterior
                        ? `${item.anterior.percentualResidualAnterior.replace(".", ",")}%`
                        : "—"}
                    </td>
                    <td className="p-3">
                      {item.novo.percentualResidualNovo
                        ? `${item.novo.percentualResidualNovo.replace(".", ",")}%`
                        : "—"}
                    </td>
                  </tr>
                  <tr>
                    <th scope="row" className="p-3 font-medium">
                      Vida útil
                    </th>
                    <td className="p-3">
                      {item.anterior
                        ? `${item.anterior.vidaUtilRestanteAnteriorMeses} meses restantes`
                        : "Não havia"}
                    </td>
                    <td className="p-3">{item.novo.vidaUtilNovaMeses} meses</td>
                  </tr>
                </tbody>
              </table>
            </div>
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
    </div>
  );
}

export async function ReavaliacaoDetalheServer({
  reavaliacaoId,
  interceptado,
  retorno,
}: {
  reavaliacaoId: string;
  interceptado: boolean;
  retorno: string;
}) {
  if (!(await obterIdentidadeAtual())) return null;
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
      <ReavaliacaoDetalheDrawer
        interceptado={interceptado}
        patrimonio="não identificado"
        retorno={retorno}
      >
        <div className="p-6">
          <ErroReavaliacao erro={erroConsulta} />
        </div>
      </ReavaliacaoDetalheDrawer>
    );
  }
  return (
    <ReavaliacaoDetalheDrawer
      interceptado={interceptado}
      patrimonio={item.patrimonio.numeroPatrimonio ?? "sem número histórico"}
      retorno={retorno}
    >
      <DetalheConteudo item={item} />
    </ReavaliacaoDetalheDrawer>
  );
}
