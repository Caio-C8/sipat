import Link from "next/link";
import {
  Box,
  FileText,
  Search,
  TrendingDown,
  TrendingUp,
  Wallet,
} from "lucide-react";
import type { EventosFichaResponse, PatrimonioDetalhe } from "@repo/contracts";
import { rotuloCompetencia } from "@/features/depreciacoes/apresentacao";
import { apresentarEvento, formatarData } from "../apresentacao";
import { PatrimonioAcoes } from "./patrimonio-acoes";
import { DisponibilidadeUso } from "./disponibilidade-uso";
import { formatBrl, subtractDecimal } from "@/lib/format/decimal";
import { PaginationSummary } from "@/components/shared/pagination-summary";
import { PageHeader } from "@/components/shared/page-header";
import { PatrimonioHistoricoFiltros } from "./patrimonio-historico-filtros";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const pagina =
  "mx-auto grid w-full min-w-0 max-w-[1900px] gap-4 px-4 py-4 text-foreground sm:px-7 sm:py-6";
const nulo = "Não informado";
const rotulosStatus: Record<PatrimonioDetalhe["status"], string> = {
  ATIVO: "Ativo",
  EMPRESTADO: "Emprestado",
  EM_MANUTENCAO: "Em manutenção",
  BAIXADO: "Baixado",
};

function Dado({
  titulo,
  valor,
}: {
  titulo: string;
  valor: string | number | null | undefined;
}) {
  return (
    <div>
      <dt className="text-xs text-muted-foreground">{titulo}</dt>
      <dd className="mt-1 break-words text-sm font-medium text-brand-deep">
        {valor ?? nulo}
      </dd>
    </div>
  );
}

function Historico({
  resposta,
  valores,
  patrimonioId,
}: {
  resposta: EventosFichaResponse;
  valores: Record<string, string>;
  patrimonioId: string;
}) {
  const possuiFiltros = Boolean(
    valores.evento || valores.busca || valores.dataInicial || valores.dataFinal,
  );
  const hrefPagina = (pagina: number) =>
    `/patrimonios/${patrimonioId}?${new URLSearchParams({ ...valores, aba: "historico", pagina: String(pagina) }).toString()}`;
  return (
    <Card asChild className="min-w-0">
      <section aria-labelledby="historico-title">
        <CardHeader>
          <CardTitle id="historico-title" className="text-lg">
            Histórico de operações
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Consulte alterações, movimentações e eventos auditáveis deste bem.
          </p>
        </CardHeader>
        <CardContent>
          <PatrimonioHistoricoFiltros
            patrimonioId={patrimonioId}
            valores={valores}
          />
          {resposta.dados.length === 0 ? (
            <div
              role="status"
              className="mt-5 rounded-lg border border-border bg-muted p-8 text-center"
            >
              <p className="font-semibold text-brand-deep">
                {possuiFiltros
                  ? "Nenhum evento encontrado"
                  : "Histórico ainda sem registros"}
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                {possuiFiltros
                  ? "Não existem eventos que correspondam aos filtros informados."
                  : "Este bem ainda não possui movimentações ou outras operações registradas no histórico."}
              </p>
            </div>
          ) : (
            <ol className="mt-5 grid gap-3">
              {resposta.dados.map((evento) => {
                const item = apresentarEvento(evento);
                return (
                  <Card
                    asChild
                    className="gap-2 rounded-lg p-4 shadow-none"
                    key={`${evento.tipo}-${evento.fonteId}`}
                  >
                    <li>
                      <div className="flex flex-wrap justify-between gap-2">
                        <strong>{item.titulo}</strong>
                        <time className="text-sm text-muted-foreground">
                          {formatarData(evento.ocorrencia)}
                        </time>
                      </div>
                      <p className="mt-2 text-sm">{item.descricao}</p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {item.detalhe}
                        {evento.comissao
                          ? ` Comissão: ${evento.comissao}.`
                          : ""}
                        {evento.autor ? ` Autor: ${evento.autor}.` : ""}
                      </p>
                    </li>
                  </Card>
                );
              })}
            </ol>
          )}
          <div className="mt-5">
            <PaginationSummary meta={resposta.meta} href={hrefPagina} />
          </div>
        </CardContent>
      </section>
    </Card>
  );
}

export function PatrimonioDetalheView({
  patrimonio,
  eventos,
  erroEventos,
  valores,
  diretor,
  usuarioId,
  hoje,
}: {
  patrimonio: PatrimonioDetalhe;
  eventos: EventosFichaResponse | null;
  erroEventos: string | null;
  valores: Record<string, string>;
  diretor: boolean;
  usuarioId: string;
  hoje: string;
}) {
  const liquido = subtractDecimal(
    patrimonio.situacaoContabil.valorBrutoAtual,
    patrimonio.situacaoContabil.depreciacaoAcumuladaAtual,
  );
  const historico = valores.aba === "historico";
  return (
    <main className={pagina}>
      <PageHeader
        title={
          <span className="flex flex-wrap items-center gap-3">
            {patrimonio.descricao}
            <Badge variant="outline">{rotulosStatus[patrimonio.status]}</Badge>
          </span>
        }
        description={
          <>
            Patrimônio {patrimonio.numeroPatrimonio} ·{" "}
            {patrimonio.tipoNumeroPatrimonial === "OFICIAL"
              ? "Numeração oficial"
              : "Numeração não oficial (S/P)"}
          </>
        }
        actions={
          <>
            <Button asChild variant="outline" size="lg">
              <Link href="/patrimonios">
                <Search className="size-4" /> Nova pesquisa
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link
                href={`/relatorios?tipo=ficha-bem&patrimonioId=${patrimonio.id}&consultar=1`}
              >
                <FileText className="size-4" /> Relatório do bem
              </Link>
            </Button>
          </>
        }
      />
      <div className="grid gap-3 sm:grid-cols-3">
        {[
          {
            titulo: "Valor de incorporação",
            valor: formatBrl(patrimonio.valorIncorporacao),
            Icone: Wallet,
          },
          {
            titulo: "Valor atual",
            valor: formatBrl(liquido),
            Icone: TrendingUp,
          },
          {
            titulo: "Depreciação acumulada",
            valor: formatBrl(
              patrimonio.situacaoContabil.depreciacaoAcumuladaAtual,
            ),
            Icone: TrendingDown,
          },
        ].map(({ titulo, valor, Icone }) => (
          <Card asChild className="flex-row items-center gap-3" key={titulo}>
            <section>
              <Icone className="size-5 text-interactive" />
              <div>
                <p className="text-xs uppercase text-muted-foreground">
                  {titulo}
                </p>
                <p className="text-xl font-bold text-brand-deep">{valor}</p>
              </div>
            </section>
          </Card>
        ))}
      </div>
      <PatrimonioAcoes
        patrimonio={patrimonio}
        usuarioId={usuarioId}
        diretor={diretor}
      />
      <DisponibilidadeUso
        patrimonio={patrimonio}
        diretor={diretor}
        hoje={hoje}
      />
      <nav
        className="flex gap-1 rounded-lg border border-border bg-card p-1"
        aria-label="Seções do patrimônio"
      >
        <Button asChild variant={historico ? "ghost" : "secondary"}>
          <Link
            aria-current={!historico ? "page" : undefined}
            href={`/patrimonios/${patrimonio.id}`}
          >
            Dados do bem
          </Link>
        </Button>
        <Button asChild variant={historico ? "secondary" : "ghost"}>
          <Link
            aria-current={historico ? "page" : undefined}
            href={`/patrimonios/${patrimonio.id}?aba=historico`}
          >
            Histórico do bem
          </Link>
        </Button>
      </nav>
      {historico ? (
        eventos ? (
          <Historico
            resposta={eventos}
            valores={valores}
            patrimonioId={patrimonio.id}
          />
        ) : (
          <Card asChild>
            <section aria-labelledby="historico-error-title">
              <Alert variant="destructive">
                <AlertTitle>
                  <h2 id="historico-error-title">
                    Não foi possível carregar o histórico
                  </h2>
                </AlertTitle>
                <AlertDescription>
                  {erroEventos ??
                    "Não foi possível consultar o histórico deste patrimônio."}
                </AlertDescription>
              </Alert>
              <p className="text-sm text-muted-foreground">
                Tente novamente. Os registros existentes permanecem preservados.
              </p>
              <Button asChild variant="outline" className="w-fit">
                <Link href={`/patrimonios/${patrimonio.id}?aba=historico`}>
                  Tentar novamente
                </Link>
              </Button>
            </section>
          </Card>
        )
      ) : (
        <div className="grid gap-4 xl:grid-cols-12">
          <Card asChild className="xl:col-span-8">
            <section>
              <h2 className="mb-4 flex items-center gap-2 font-bold">
                <Box className="size-4 text-interactive" /> Identificação e
                classificação
              </h2>
              <dl className="grid gap-x-6 gap-y-5 sm:grid-cols-2 lg:grid-cols-3">
                <div className="rounded-lg bg-muted p-3 sm:col-span-2 lg:col-span-3">
                  <Dado titulo="Descrição" valor={patrimonio.descricao} />
                </div>
                <Dado
                  titulo="Número patrimonial"
                  valor={patrimonio.numeroPatrimonio}
                />
                <Dado
                  titulo="Tipo de numeração"
                  valor={
                    patrimonio.tipoNumeroPatrimonial === "OFICIAL"
                      ? "Oficial"
                      : "Não oficial (S/P)"
                  }
                />
                <Dado
                  titulo="Situação operacional"
                  valor={rotulosStatus[patrimonio.status]}
                />
                <Dado titulo="Marca" valor={patrimonio.marca} />
                <Dado titulo="Modelo" valor={patrimonio.modelo} />
                <Dado titulo="Número de série" valor={patrimonio.numeroSerie} />
                <Dado titulo="Espécie" valor={patrimonio.especie.nome} />
                <Dado
                  titulo="Natureza"
                  valor={patrimonio.especie.natureza.nome}
                />
                <Dado
                  titulo="Bem depreciável"
                  valor={patrimonio.depreciavel ? "Sim" : "Não"}
                />
              </dl>
            </section>
          </Card>
          <Card asChild className="xl:col-span-4">
            <section>
              <h2 className="mb-4 font-bold">Localização e responsabilidade</h2>
              <dl className="grid gap-5">
                <Dado titulo="Setor atual" valor={patrimonio.setorAtual.nome} />
                <Dado
                  titulo="Responsável do setor"
                  valor={patrimonio.setorAtual.responsavel.nome}
                />
              </dl>
            </section>
          </Card>
          <Card asChild className="xl:col-span-4">
            <section>
              <h2 className="mb-4 font-bold">Aquisição e tombamento</h2>
              <dl className="grid gap-5">
                <Dado
                  titulo="Tipo de incorporação"
                  valor={patrimonio.tipoIncorporacao}
                />
                <Dado
                  titulo="Data do tombamento"
                  valor={formatarData(patrimonio.dataTombamento)}
                />
                <Dado
                  titulo="Processo de compra"
                  valor={
                    patrimonio.processoCompra
                      ? [
                          patrimonio.processoCompra.numeroProcesso,
                          patrimonio.processoCompra.anoProcesso,
                        ]
                          .filter(Boolean)
                          .join("/")
                      : null
                  }
                />
                <Dado
                  titulo="Valor de incorporação"
                  valor={formatBrl(patrimonio.valorIncorporacao)}
                />
              </dl>
            </section>
          </Card>
          <Card asChild className="xl:col-span-8">
            <section>
              <h2 className="mb-4 font-bold">Parâmetros de depreciação</h2>
              {patrimonio.parametroDepreciacaoAtual ? (
                <dl className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
                  <Dado
                    titulo="Método"
                    valor={patrimonio.parametroDepreciacaoAtual.metodo}
                  />
                  <Dado
                    titulo="Vida útil inicial"
                    valor={`${patrimonio.parametroDepreciacaoAtual.vidaUtilInicialMeses} meses`}
                  />
                  <Dado
                    titulo="Valor residual"
                    valor={formatBrl(
                      patrimonio.parametroDepreciacaoAtual.valorResidual,
                    )}
                  />
                  <Dado
                    titulo="Percentual residual"
                    valor={
                      patrimonio.parametroDepreciacaoAtual.percentualResidual
                        ? `${patrimonio.parametroDepreciacaoAtual.percentualResidual}%`
                        : "Informado em valor"
                    }
                  />
                  <Dado
                    titulo="Base inicial"
                    valor={formatBrl(
                      patrimonio.parametroDepreciacaoAtual.valorBaseInicial,
                    )}
                  />
                  <Dado
                    titulo="Início"
                    valor={formatarData(
                      patrimonio.parametroDepreciacaoAtual.dataInicio,
                    )}
                  />
                </dl>
              ) : (
                <p className="text-sm text-muted-foreground">
                  {patrimonio.depreciavel ? "Não informado" : "Não se aplica"}
                </p>
              )}
            </section>
          </Card>
          <Card asChild className="xl:col-span-12">
            <section>
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <h2 className="font-bold">Competências de depreciação</h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {patrimonio.depreciavel
                      ? `${patrimonio.resumoDepreciacao.quantidadePendencias} competência(s) pendente(s).`
                      : "Não se aplica a bem não depreciável."}
                  </p>
                </div>
                {patrimonio.resumoDepreciacao.proximaCompetencia ? (
                  <Button asChild variant="outline">
                    <Link
                      href={`/depreciacao?competencia=${patrimonio.resumoDepreciacao.proximaCompetencia}`}
                    >
                      Consultar pendência
                    </Link>
                  </Button>
                ) : null}
              </div>
              <dl className="mt-4 grid gap-5 sm:grid-cols-3">
                <Dado
                  titulo="Primeira competência"
                  valor={
                    patrimonio.resumoDepreciacao.primeiraCompetencia
                      ? rotuloCompetencia(
                          patrimonio.resumoDepreciacao.primeiraCompetencia,
                        )
                      : patrimonio.depreciavel
                        ? "Aguardando disponibilidade"
                        : "Não se aplica"
                  }
                />
                <Dado
                  titulo="Última competência processada"
                  valor={
                    patrimonio.resumoDepreciacao.ultimaCompetenciaProcessada
                      ? rotuloCompetencia(
                          patrimonio.resumoDepreciacao
                            .ultimaCompetenciaProcessada,
                        )
                      : patrimonio.depreciavel
                        ? "Nenhuma"
                        : "Não se aplica"
                  }
                />
                <Dado
                  titulo="Próxima competência"
                  valor={
                    patrimonio.resumoDepreciacao.proximaCompetencia
                      ? rotuloCompetencia(
                          patrimonio.resumoDepreciacao.proximaCompetencia,
                        )
                      : patrimonio.resumoDepreciacao.quantidadePendencias === 0
                        ? "Sem pendência"
                        : null
                  }
                />
              </dl>
            </section>
          </Card>
        </div>
      )}
    </main>
  );
}
