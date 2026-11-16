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
import { exigirIdentidadeAtual } from "@/lib/auth/server-session";
import { serverRelatorios } from "@/features/relatorios/api/server";
import { FormularioRelatorios } from "@/features/relatorios/components/formulario";
import { DownloadRelatorio } from "@/features/relatorios/components/download";
import {
  DadosRegistro,
  mensagemRelatorio,
  painel,
} from "@/features/relatorios/apresentacao";
import { TabelaPrevia } from "@/features/relatorios/components/tabela-previa";
import { FiltrosAplicados } from "@/features/relatorios/components/filtros-aplicados";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
export const metadata: Metadata = { title: "Relatórios" };
const descricoes: Record<string, string> = {
  patrimonios: "Bens, localização, responsável e valores atuais.",
  "ficha-bem": "Cadastro do bem e histórico de eventos.",
  movimentacoes: "Transferências entre setores e datas de ocorrência.",
  manutencoes: "Pedidos, fornecedores, retornos e valores.",
  depreciacoes: "Lançamentos por bem e competência.",
  "pendencias-depreciacao": "Obrigações de depreciação ainda não processadas.",
  reavaliacoes: "Valores anteriores e reavaliados por bem.",
  inventarios: "Conferências e inconsistências do inventário.",
  emprestimos: "Saídas temporárias, prazos e devoluções.",
  baixas: "Registros de baixa patrimonial.",
};
export default async function RelatoriosPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const identidade = await exigirIdentidadeAtual();
  const params = await searchParams;
  const valores = Object.fromEntries(
    Object.entries(params).filter(([, v]) => typeof v === "string" && v !== ""),
  ) as Record<string, string>;
  const legado =
    !valores.relatorio && TipoRelatorioSchema.safeParse(valores.tipo).success;
  const tipoValidado = TipoRelatorioSchema.safeParse(
    valores.relatorio ?? (legado ? valores.tipo : "patrimonios"),
  );
  const tipo = tipoValidado.success ? tipoValidado.data : "patrimonios";
  const opcoes = { cookie: (await headers()).get("cookie") ?? "" };
  let catalogo;
  try {
    catalogo = await serverRelatorios.catalogo(opcoes);
  } catch (e) {
    return (
      <main className="grid gap-5 p-6">
        <PageHeader
          title="Relatórios"
          description="Consulte dados do patrimônio e emita relatórios."
        />
        <p role="alert" className="mt-4">
          {mensagemRelatorio(e)}
        </p>
      </main>
    );
  }
  const q = { ...valores };
  delete q.relatorio;
  delete q.consultar;
  if (legado) delete q.tipo;
  const formValues = { ...q };
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
    `/relatorios?${new URLSearchParams({ ...formValues, relatorio: tipo, consultar: "1", pagina: String(pagina) }).toString()}`;
  const diaAtual = new Intl.DateTimeFormat("sv-SE", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
  const escolhido = catalogo.dados.tipos.find((item) => item.tipo === tipo);
  if (
    !tipoValidado.success ||
    !escolhido ||
    (valores.tipo && !legado && !valores.relatorio)
  )
    return (
      <main className="grid gap-5 p-6">
        <PageHeader
          title="Relatório inválido"
          description="Escolha um relatório disponível no catálogo."
          actions={
            <Button asChild variant="outline">
              <Link href="/relatorios">Todos os relatórios</Link>
            </Button>
          }
        />
        <p role="alert" className="mt-3">
          Escolha um relatório do catálogo.
        </p>
      </main>
    );
  if (!valores.relatorio && !legado && !valores.consultar)
    return (
      <main className="grid min-w-0 gap-5 p-4 text-[#19355d] sm:p-7">
        <PageHeader
          title="Relatórios"
          description="Consulte dados do patrimônio, acompanhe as operações e emita relatórios com os filtros desejados."
        />
        <div className="rounded-xl border border-blue-100 bg-blue-50 p-4 text-sm text-blue-950">
          <strong>
            Escolha o relatório, defina os filtros e confira a prévia.
          </strong>
          <p className="mt-1">
            O documento final identifica os filtros, a emissão e o responsável.
          </p>
        </div>
        <section
          aria-label="Catálogo de relatórios"
          className="grid gap-4 md:grid-cols-2 xl:grid-cols-3"
        >
          {catalogo.dados.tipos.map((item) => (
            <article
              key={item.tipo}
              className={`${painel} flex min-w-0 flex-col gap-3`}
            >
              <span
                aria-hidden="true"
                className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-700"
              >
                ▤
              </span>
              <h2 className="font-bold">{item.titulo}</h2>
              <p className="flex-1 text-sm text-slate-600">
                {descricoes[item.tipo]}
              </p>
              {item.disponivel ? (
                <Link
                  className="rounded-md border px-3 py-2 text-sm font-semibold focus-visible:outline-2 focus-visible:outline-blue-700"
                  href={`/relatorios?relatorio=${item.tipo}`}
                >
                  Configurar relatório →
                </Link>
              ) : (
                <>
                  <p className="text-sm text-amber-900">{item.motivo}</p>
                  <span
                    aria-disabled="true"
                    className="rounded-md border px-3 py-2 text-sm text-slate-500"
                  >
                    Indisponível
                  </span>
                </>
              )}
            </article>
          ))}
        </section>
      </main>
    );
  return (
    <main className="grid min-w-0 gap-5 p-4 text-[#19355d] sm:p-7">
      <PageHeader
        title={resposta ? `Prévia · ${escolhido.titulo}` : escolhido.titulo}
        description={
          resposta
            ? "Confira os registros e os filtros antes de emitir o documento."
            : "Selecione o recorte dos dados e gere uma prévia antes de exportar."
        }
        actions={
          <Button asChild variant="outline">
            <Link
              href={
                resposta
                  ? `/relatorios?${new URLSearchParams({ ...formValues, relatorio: tipo }).toString()}`
                  : "/relatorios"
              }
            >
              {resposta ? "Ajustar filtros" : "Todos os relatórios"}
            </Link>
          </Button>
        }
      />
      {(!resposta || erro) && (
        <FormularioRelatorios
          key={JSON.stringify(formValues)}
          catalogo={catalogo}
          tipoInicial={tipo}
          valores={formValues}
          diaAtual={diaAtual}
          usuario={identidade.nome}
        >
          {erro && (
            <div
              role="alert"
              className={`${painel} border-red-200 text-red-800`}
            >
              <h2 className="font-semibold">Não foi possível gerar a prévia</h2>
              <p className="mt-2 text-sm">{erro}</p>
            </div>
          )}
        </FormularioRelatorios>
      )}
      {resposta && (
        <section
          className={`${painel} grid min-w-0 gap-4`}
          aria-labelledby="titulo-previa"
        >
          <h2 id="titulo-previa" tabIndex={-1} className="sr-only">
            Registros da prévia
          </h2>
          <FiltrosAplicados tipo={tipo} filtros={q} />
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <div className="rounded-lg border p-4">
              <span className="text-xs text-slate-600">
                Total de registros encontrados
              </span>
              <strong className="block text-xl">{resposta.meta.total}</strong>
            </div>
            <div className="rounded-lg border p-4">
              <span className="text-xs text-slate-600">
                Exibidos nesta página
              </span>
              <strong className="block text-xl">{resposta.dados.length}</strong>
            </div>
            <div className="rounded-lg border p-4">
              <span className="text-xs text-slate-600">Página</span>
              <strong className="block text-xl">
                {resposta.meta.pagina} de {resposta.meta.ultimaPagina}
              </strong>
            </div>
          </div>
          <details className="text-xs text-slate-600">
            <summary className="cursor-pointer">
              Rastreabilidade da consulta
            </summary>
            <p className="mt-2 break-words">
              Consulta {resposta.consulta.id} —{" "}
              {new Intl.DateTimeFormat("pt-BR", {
                timeZone: "America/Sao_Paulo",
                dateStyle: "short",
                timeStyle: "medium",
              }).format(new Date(resposta.consulta.instante))}{" "}
              (São Paulo).
            </p>
            <p>Ordenação: {resposta.consulta.ordenacao}</p>
          </details>
          <p className="text-sm">{resposta.consulta.criterioTemporal}</p>
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
            <TabelaPrevia
              tipo={tipo}
              dados={resposta.dados as Record<string, unknown>[]}
            />
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
            O PDF consultará novamente os dados; alterações posteriores à prévia
            poderão aparecer.
          </p>
          <DownloadRelatorio
            tipo={tipo}
            query={pdfQuery}
            patrimonioId={valores.patrimonioId}
          />
        </section>
      )}
    </main>
  );
}
