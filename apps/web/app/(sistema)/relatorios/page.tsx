import type { Metadata } from "next";
import { headers } from "next/headers";
import Link from "next/link";
import {
  TipoRelatorioSchema,
  queryRelatorio,
  type RelatorioTabularResponse,
  type EventosFichaResponse,
  type FichaResponse,
} from "@repo/contracts";
import { obterIdentidadeAtual } from "@/lib/auth/server-session";
import { serverRelatorios } from "@/features/relatorios/api/server";
import { FormularioRelatorios } from "@/features/relatorios/components/formulario";
import { DownloadRelatorio } from "@/features/relatorios/components/download";
import {
  DadosRegistro,
  mensagemRelatorio,
  painel,
  valor,
} from "@/features/relatorios/apresentacao";
export const metadata: Metadata = { title: "Relatórios" };
export default async function RelatoriosPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const identidade = await obterIdentidadeAtual();
  if (!identidade) return null;
  const params = await searchParams;
  const valores = Object.fromEntries(
    Object.entries(params).filter(([, v]) => typeof v === "string" && v !== ""),
  ) as Record<string, string>;
  const tipoValidado = TipoRelatorioSchema.safeParse(
    valores.tipo ?? "patrimonios",
  );
  const tipo = tipoValidado.success ? tipoValidado.data : "patrimonios";
  const opcoes = { cookie: (await headers()).get("cookie") ?? "" };
  let catalogo;
  try {
    catalogo = await serverRelatorios.catalogo(opcoes);
  } catch (e) {
    return (
      <main className="p-6">
        <h1 className="text-2xl font-bold">Relatórios</h1>
        <p role="alert" className="mt-4">
          {mensagemRelatorio(e)}
        </p>
      </main>
    );
  }
  const { tipo: _tipo, consultar: _consultar, ...qOriginal } = valores;
  void _tipo;
  void _consultar;
  const q = { ...qOriginal };
  if (tipo === "ficha-bem") delete q.patrimonioId;
  let resposta: RelatorioTabularResponse | EventosFichaResponse | null = null;
  let ficha: FichaResponse | null = null;
  let erro = "";
  if (valores.consultar === "1") {
    const parsed = queryRelatorio(tipo).safeParse(q);
    if (!tipoValidado.success)
      erro = "Selecione um tipo de relatório disponível.";
    else if (!parsed.success)
      erro = parsed.error.issues
        .map((i) => `${i.path.join(".")}: ${i.message}`)
        .join("; ");
    else
      try {
        if (tipo === "ficha-bem") {
          const id = valores.patrimonioId ?? "";
          [ficha, resposta] = await Promise.all([
            serverRelatorios.ficha(id, opcoes),
            serverRelatorios.eventos(id, q, opcoes),
          ]);
        } else resposta = await serverRelatorios.consultar(tipo, q, opcoes);
      } catch (e) {
        erro = mensagemRelatorio(e);
      }
  }
  const pdfQuery = { ...q };
  delete pdfQuery.pagina;
  delete pdfQuery.limite;
  const hrefPagina = (pagina: number) =>
    `/relatorios?${new URLSearchParams({ ...valores, pagina: String(pagina) }).toString()}`;
  const diaAtual = new Intl.DateTimeFormat("sv-SE", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
  return (
    <main className="grid min-w-0 gap-5 p-4 text-[#19355d] sm:p-7">
      <header>
        <h1 className="text-2xl font-bold">Relatórios patrimoniais</h1>
        <p className="mt-2 text-sm text-slate-600">
          Consulte registros reais, confira a prévia e exporte o conjunto
          filtrado.
        </p>
      </header>
      <FormularioRelatorios
        key={JSON.stringify(valores)}
        catalogo={catalogo}
        tipoInicial={tipo}
        valores={valores}
        diaAtual={diaAtual}
      >
        {erro && (
          <div role="alert" className={`${painel} border-red-200 text-red-800`}>
            <h2 className="font-semibold">Não foi possível gerar a prévia</h2>
            <p className="mt-2 text-sm">{erro}</p>
          </div>
        )}
        {resposta && (
          <section
            className={`${painel} grid min-w-0 gap-4`}
            aria-labelledby="titulo-previa"
          >
            <h2 id="titulo-previa" tabIndex={-1} className="text-xl font-bold">
              Prévia —{" "}
              {catalogo.dados.tipos.find((t) => t.tipo === tipo)?.titulo}
            </h2>
            <p className="text-sm">
              {resposta.meta.total} registros no conjunto filtrado. Página{" "}
              {resposta.meta.pagina} de {resposta.meta.ultimaPagina};{" "}
              {resposta.dados.length} registros nesta página.
            </p>
            <p className="break-words text-xs text-slate-600">
              Consulta {resposta.consulta.id} —{" "}
              {new Intl.DateTimeFormat("pt-BR", {
                timeZone: "America/Sao_Paulo",
                dateStyle: "short",
                timeStyle: "medium",
              }).format(new Date(resposta.consulta.instante))}{" "}
              (São Paulo).
            </p>
            <p className="text-sm">{resposta.consulta.criterioTemporal}</p>
            <p className="text-sm">Ordenação: {resposta.consulta.ordenacao}</p>
            {resposta.consulta.avisos.map((a, i) => (
              <p
                key={i}
                className="rounded bg-amber-50 p-2 text-sm text-amber-950"
              >
                {a}
              </p>
            ))}
            <h3 className="font-semibold">Totais do conjunto filtrado</h3>
            <DadosRegistro dados={resposta.resumo} />
            {ficha && (
              <details className="rounded-md border p-3" open>
                <summary className="cursor-pointer font-semibold">
                  Cadastro atual do bem
                </summary>
                <div className="mt-3">
                  <DadosRegistro dados={ficha.dados.cadastro} />
                </div>
              </details>
            )}
            {resposta.dados.length === 0 ? (
              <p role="status">Nenhum registro corresponde aos filtros.</p>
            ) : (
              <div
                className="min-w-0 overflow-x-auto rounded-md border"
                tabIndex={0}
                role="region"
                aria-label="Resultados do relatório"
              >
                <table className="w-full text-left text-sm">
                  <caption className="p-3 text-left">
                    Valores monetários em R$, com sete casas decimais. Abra os
                    campos para conferir o registro completo.
                  </caption>
                  <thead className="bg-slate-100">
                    <tr>
                      <th scope="col" className="p-3">
                        Identificação
                      </th>
                      <th scope="col" className="p-3">
                        Descrição / evento
                      </th>
                      <th scope="col" className="p-3">
                        Campos do relatório
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {resposta.dados.map((row, i) => {
                      const r = row as Record<string, unknown>;
                      return (
                        <tr
                          key={`${String(r.id)}-${String(r.tipo ?? tipo)}-${i}`}
                          className="border-t align-top"
                        >
                          <td className="max-w-48 break-words p-3">
                            {valor(
                              r.numeroPatrimonio ??
                                r.numeroPatrimonioAtual ??
                                r.fonteId ??
                                r.id,
                            )}
                          </td>
                          <td className="max-w-64 break-words p-3">
                            {valor(r.descricao ?? r.descricaoAtual ?? r.tipo)}
                            {r.ocorrencia != null && (
                              <p className="mt-2">{valor(r.ocorrencia)}</p>
                            )}
                          </td>
                          <td className="min-w-52 p-3">
                            <details>
                              <summary className="cursor-pointer font-semibold">
                                Todos os campos do registro {i + 1}
                              </summary>
                              <div className="mt-3">
                                <DadosRegistro dados={r} />
                              </div>
                            </details>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
            <nav
              aria-label="Paginação do relatório"
              className="flex flex-wrap gap-4 text-sm"
            >
              {resposta.meta.pagina > 1 && (
                <Link
                  className="underline"
                  prefetch={false}
                  href={hrefPagina(resposta.meta.pagina - 1)}
                >
                  Página anterior
                </Link>
              )}
              {resposta.meta.pagina < resposta.meta.ultimaPagina && (
                <Link
                  className="underline"
                  prefetch={false}
                  href={hrefPagina(resposta.meta.pagina + 1)}
                >
                  Próxima página
                </Link>
              )}
            </nav>
            <p className="text-sm">
              O PDF consultará novamente os dados; alterações posteriores à
              prévia poderão aparecer.
            </p>
            <DownloadRelatorio
              tipo={tipo}
              query={pdfQuery}
              patrimonioId={valores.patrimonioId}
            />
          </section>
        )}
      </FormularioRelatorios>
    </main>
  );
}
