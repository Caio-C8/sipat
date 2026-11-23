import type { Metadata } from "next";
import { headers } from "next/headers";
import Link from "next/link";
import { FileText, SlidersHorizontal } from "lucide-react";
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
} from "@/features/relatorios/apresentacao";
import { TabelaPrevia } from "@/features/relatorios/components/tabela-previa";
import { FiltrosAplicados } from "@/features/relatorios/components/filtros-aplicados";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PaginationSummary } from "@/components/shared/pagination-summary";
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
      <main className="mx-auto grid w-full min-w-0 max-w-[1900px] gap-5 px-4 py-4 sm:px-7 sm:py-6">
        <PageHeader
          title="Relatórios"
          description="Consulte dados do patrimônio e emita relatórios."
        />
        <Alert variant="destructive">
          <AlertTitle>Não foi possível carregar os relatórios</AlertTitle>
          <AlertDescription>{mensagemRelatorio(e)}</AlertDescription>
        </Alert>
      </main>
    );
  }
  const q = { ...valores };
  delete q.relatorio;
  delete q.consultar;
  if (legado) delete q.tipo;
  if (tipo === "patrimonios") delete q.busca;
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
      erro =
        "Revise os filtros informados. Confira os campos obrigatórios, as datas e as opções selecionadas.";
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
  const filtrosExibidos =
    tipo === "ficha-bem" && valores.patrimonioId
      ? { ...q, patrimonioId: valores.patrimonioId }
      : q;
  if (
    !tipoValidado.success ||
    !escolhido ||
    (valores.tipo && !legado && !valores.relatorio)
  )
    return (
      <main className="mx-auto grid w-full min-w-0 max-w-[1900px] gap-5 px-4 py-4 sm:px-7 sm:py-6">
        <PageHeader
          title="Relatório inválido"
          description="Escolha um relatório disponível no catálogo."
          actions={
            <Button asChild variant="outline">
              <Link href="/relatorios">Todos os relatórios</Link>
            </Button>
          }
        />
        <Alert variant="destructive">
          <AlertTitle>Relatório não encontrado</AlertTitle>
          <AlertDescription>Escolha um relatório do catálogo.</AlertDescription>
        </Alert>
      </main>
    );
  if (!valores.relatorio && !legado && !valores.consultar)
    return (
      <main className="mx-auto grid w-full min-w-0 max-w-[1900px] gap-5 px-4 py-4 sm:px-7 sm:py-6">
        <PageHeader
          title="Relatórios"
          description="Consulte dados do patrimônio, acompanhe as operações e emita relatórios com os filtros desejados."
        />
        <Alert>
          <SlidersHorizontal aria-hidden="true" />
          <AlertTitle>
            Escolha o relatório, defina os filtros e confira a prévia.
          </AlertTitle>
          <AlertDescription>
            O documento final identifica os filtros, a emissão e o responsável.
          </AlertDescription>
        </Alert>
        <section
          aria-label="Catálogo de relatórios"
          className="grid gap-4 md:grid-cols-2 xl:grid-cols-3"
        >
          {catalogo.dados.tipos.map((item) => (
            <Card asChild key={item.tipo} className="min-w-0">
              <article>
                <CardHeader>
                  <span
                    aria-hidden="true"
                    className="flex size-9 items-center justify-center rounded-lg bg-accent text-interactive"
                  >
                    <FileText className="size-5" />
                  </span>
                  <CardTitle>
                    <h2>{item.titulo}</h2>
                  </CardTitle>
                  <CardDescription>{descricoes[item.tipo]}</CardDescription>
                </CardHeader>
                <CardContent className="mt-auto grid gap-3">
                  {item.disponivel ? (
                    <Button asChild variant="outline" className="w-full">
                      <Link href={`/relatorios?relatorio=${item.tipo}`}>
                        Configurar relatório
                      </Link>
                    </Button>
                  ) : (
                    <>
                      <p className="text-sm text-muted-foreground">
                        {item.motivo}
                      </p>
                      <Button disabled variant="outline" className="w-full">
                        Indisponível
                      </Button>
                    </>
                  )}
                </CardContent>
              </article>
            </Card>
          ))}
        </section>
      </main>
    );
  return (
    <main className="mx-auto grid w-full min-w-0 max-w-[1900px] gap-5 px-4 py-4 sm:px-7 sm:py-6">
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
            <Alert variant="destructive">
              <AlertTitle>Não foi possível gerar a prévia</AlertTitle>
              <AlertDescription>{erro}</AlertDescription>
            </Alert>
          )}
        </FormularioRelatorios>
      )}
      {resposta && (
        <Card asChild className="min-w-0 gap-4">
          <section aria-labelledby="titulo-previa">
            <h2 id="titulo-previa" tabIndex={-1} className="sr-only">
              Registros da prévia
            </h2>
            <CardHeader>
              <CardTitle>Resultados da prévia</CardTitle>
              <CardDescription>
                Confira o conjunto filtrado antes de emitir o documento.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid min-w-0 gap-4">
              <FiltrosAplicados tipo={tipo} filtros={filtrosExibidos} />
              <div className="grid gap-3 sm:grid-cols-2">
                <Card className="gap-1 p-4 shadow-none">
                  <span className="text-xs text-muted-foreground">
                    Total de registros encontrados
                  </span>
                  <strong className="block text-xl">
                    {resposta.meta.total}
                  </strong>
                </Card>
                <Card className="gap-1 p-4 shadow-none">
                  <span className="text-xs text-muted-foreground">
                    Exibidos nesta página
                  </span>
                  <strong className="block text-xl">
                    {resposta.dados.length}
                  </strong>
                </Card>
              </div>
              <section aria-labelledby="totais-previa" className="grid gap-3">
                <h3 id="totais-previa" className="font-semibold">
                  Totais do conjunto filtrado
                </h3>
                <DadosRegistro dados={resposta.resumo} />
              </section>
              {ficha && (
                <section
                  aria-labelledby="cadastro-atual-bem"
                  className="grid gap-3"
                >
                  <h3 id="cadastro-atual-bem" className="font-semibold">
                    Cadastro atual do bem
                  </h3>
                  <DadosRegistro dados={ficha.dados.cadastro} />
                </section>
              )}
              {resposta.dados.length === 0 ? (
                <p
                  role="status"
                  className="rounded-lg bg-muted p-8 text-center text-sm text-muted-foreground"
                >
                  Nenhum registro corresponde aos filtros.
                </p>
              ) : (
                <TabelaPrevia
                  tipo={tipo}
                  dados={resposta.dados as Record<string, unknown>[]}
                />
              )}
              <PaginationSummary
                meta={resposta.meta}
                href={hrefPagina}
                showPageCount={false}
              />
              <p className="text-sm text-muted-foreground">
                O PDF consultará novamente os dados; alterações posteriores à
                prévia poderão aparecer.
              </p>
              <DownloadRelatorio
                tipo={tipo}
                query={pdfQuery}
                patrimonioId={valores.patrimonioId}
              />
            </CardContent>
          </section>
        </Card>
      )}
    </main>
  );
}
