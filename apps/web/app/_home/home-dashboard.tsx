import type { ComponentType } from "react";
import Link from "next/link";
import {
  ArrowLeftRight,
  Box,
  CalendarDays,
  ChartNoAxesColumn,
  CheckCircle2,
  ClipboardList,
  Clock3,
  Landmark,
  MapPin,
  Plus,
  RefreshCw,
  Search,
  TriangleAlert,
  Wrench,
} from "lucide-react";
import type { IdentidadeAutenticada } from "@repo/contracts";
import type { DashboardOperacional } from "@/features/dashboard/api/dashboard-operations";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PageHeader } from "@/components/shared/page-header";

type EstadoDashboard =
  | Readonly<{ status: "sucesso"; dados: DashboardOperacional }>
  | Readonly<{ status: "erro" }>;

const acoesRapidas = [
  {
    label: "Cadastrar bem",
    icon: Plus,
    href: "/patrimonios/novo",
    diretor: true,
  },
  {
    label: "Pesquisar bem",
    icon: Search,
    href: "/patrimonios",
    diretor: false,
  },
  {
    label: "Movimentar bens",
    icon: ArrowLeftRight,
    href: "/movimentacoes/nova",
    diretor: true,
  },
  { label: "Manutenções", icon: Wrench, href: "/manutencoes", diretor: false },
  {
    label: "Inventários",
    icon: ClipboardList,
    href: "/inventarios",
    diretor: false,
  },
  {
    label: "Relatórios",
    icon: ChartNoAxesColumn,
    href: "/relatorios",
    diretor: false,
  },
] as const;

function formatarHoje(data: Date) {
  const formatador = new Intl.DateTimeFormat("pt-BR", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "America/Sao_Paulo",
  });
  const partes = new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone: "America/Sao_Paulo",
  }).formatToParts(data);
  const parte = (tipo: Intl.DateTimeFormatPartTypes) =>
    partes.find((item) => item.type === tipo)?.value;
  return {
    texto: formatador.format(data),
    iso: `${parte("year")}-${parte("month")}-${parte("day")}`,
  };
}

function formatarDataHora(valor: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: "America/Sao_Paulo",
  }).format(new Date(valor));
}

function formatarData(valor: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeZone: "UTC",
  }).format(new Date(`${valor}T00:00:00.000Z`));
}

function formatarCompetencia(valor: string) {
  const [ano, mes] = valor.split("-").map(Number);
  return new Intl.DateTimeFormat("pt-BR", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(ano!, mes! - 1, 1)));
}

function CartaoTotal({
  titulo,
  valor,
  detalhe,
  icon: Icon,
}: Readonly<{
  titulo: string;
  valor?: number;
  detalhe: string;
  icon: ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
}>) {
  return (
    <Card className="gap-3 p-4">
      <CardHeader className="grid grid-cols-[auto_1fr] items-center gap-3">
        <span className="grid size-10 place-items-center rounded-lg bg-accent text-interactive">
          <Icon className="size-5" aria-hidden={true} />
        </span>
        <div>
          <CardDescription>{titulo}</CardDescription>
          <CardTitle className="mt-1 text-2xl text-brand-deep">
            {valor ?? "—"}
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent className="text-xs text-muted-foreground">
        {detalhe}
      </CardContent>
    </Card>
  );
}

export function HomeDashboard({
  identidade,
  dashboard,
  dataAtual = new Date(),
}: Readonly<{
  identidade: IdentidadeAutenticada;
  dashboard: EstadoDashboard;
  dataAtual?: Date;
}>) {
  const hoje = formatarHoje(dataAtual);
  const dados = dashboard.status === "sucesso" ? dashboard.dados : undefined;
  const quantidadePendencias = dados
    ? dados.pendencias.inventarios.length +
      dados.pendencias.manutencoes.length +
      (dados.pendencias.depreciacao ? 1 : 0)
    : 0;
  const totais = [
    {
      titulo: "Total de bens",
      valor: dados?.totais.total,
      detalhe: dados
        ? `${dados.totais.porStatus.BAIXADO} patrimônios baixado(s)`
        : "Dados indisponíveis no momento",
      icon: Box,
    },
    {
      titulo: "Bens ativos",
      valor: dados?.totais.porStatus.ATIVO,
      detalhe: "Disponíveis na situação ativa",
      icon: CheckCircle2,
    },
    {
      titulo: "Em manutenção",
      valor: dados?.totais.porStatus.EM_MANUTENCAO,
      detalhe: "Bens atualmente enviados para manutenção",
      icon: Wrench,
    },
    {
      titulo: "Em empréstimo",
      valor: dados?.totais.porStatus.EMPRESTADO,
      detalhe: "Bens atualmente em empréstimo",
      icon: Landmark,
    },
  ];

  return (
    <main className="mx-auto grid w-full max-w-[1900px] gap-5 px-4 py-5 sm:px-6 lg:px-8">
      <PageHeader
        title={`Bem-vindo, ${identidade.nome}!`}
        description={
          <div className="grid gap-2">
            <span>
              Acompanhe as pendências e atividades da gestão patrimonial.
            </span>
            <span className="flex items-center gap-2 text-xs">
              <CalendarDays className="size-4" aria-hidden="true" />
              <time dateTime={hoje.iso}>{hoje.texto}</time>
            </span>
          </div>
        }
      />

      {dashboard.status === "erro" ? (
        <Alert variant="destructive">
          <TriangleAlert aria-hidden="true" />
          <AlertTitle>Não foi possível carregar a visão geral</AlertTitle>
          <AlertDescription className="flex flex-wrap items-center justify-between gap-3">
            <span>
              Atualize a página para tentar novamente. Nenhum dado desatualizado
              foi exibido.
            </span>
            <Button asChild variant="outline" size="sm">
              <Link href="/dashboard">
                <RefreshCw aria-hidden="true" />
                Tentar novamente
              </Link>
            </Button>
          </AlertDescription>
        </Alert>
      ) : null}

      <section
        className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"
        aria-label="Resumo dos bens"
      >
        {totais.map((item) => (
          <CartaoTotal key={item.titulo} {...item} />
        ))}
      </section>

      <div className="grid items-start gap-5 xl:grid-cols-[1.35fr_0.65fr]">
        <Card asChild>
          <section aria-labelledby="pendencias-title">
            <CardHeader className="flex flex-row items-start justify-between gap-4">
              <div>
                <CardTitle id="pendencias-title">
                  Pendências de atenção
                </CardTitle>
                <CardDescription>
                  Ações pendentes há pelo menos 14 dias.
                </CardDescription>
              </div>
              {dados ? (
                <Badge
                  variant={quantidadePendencias ? "destructive" : "secondary"}
                >
                  {quantidadePendencias}
                </Badge>
              ) : null}
            </CardHeader>
            <CardContent>
              {!dados ? (
                <p className="text-sm text-muted-foreground">
                  As pendências estão indisponíveis no momento.
                </p>
              ) : quantidadePendencias === 0 ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CheckCircle2
                    className="size-5 text-brand-support"
                    aria-hidden="true"
                  />
                  Nenhuma pendência vencida exige atenção.
                </div>
              ) : (
                <ul className="grid gap-3">
                  {dados.pendencias.inventarios.map((item) => (
                    <li
                      className="flex flex-col gap-2 rounded-lg border p-3 sm:flex-row sm:items-center sm:justify-between"
                      key={item.id}
                    >
                      <div className="min-w-0 text-sm">
                        <strong className="block break-words">
                          Inventário: {item.nome}
                        </strong>
                        <span className="text-muted-foreground">
                          {item.quantidadeCorrecoes} correção(ões) pendente(s)
                          desde {formatarDataHora(item.pendenciaMaisAntigaEm)}
                        </span>
                      </div>
                      <Button asChild variant="outline" size="sm">
                        <Link href={item.destino}>Ver pendências</Link>
                      </Button>
                    </li>
                  ))}
                  {dados.pendencias.manutencoes.map((item) => (
                    <li
                      className="flex flex-col gap-2 rounded-lg border p-3 sm:flex-row sm:items-center sm:justify-between"
                      key={item.id}
                    >
                      <div className="min-w-0 text-sm">
                        <strong className="block">
                          Manutenção #{item.numeroPedido}
                        </strong>
                        <span className="text-muted-foreground">
                          {item.quantidadeItensSemRetorno} item(ns) sem retorno
                          desde {formatarData(item.dataEnvio)}
                        </span>
                      </div>
                      <Button asChild variant="outline" size="sm">
                        <Link href={item.destino}>Abrir pedido</Link>
                      </Button>
                    </li>
                  ))}
                  {dados.pendencias.depreciacao ? (
                    <li className="flex flex-col gap-2 rounded-lg border p-3 sm:flex-row sm:items-center sm:justify-between">
                      <div className="min-w-0 text-sm">
                        <strong className="block">
                          Depreciação de{" "}
                          {formatarCompetencia(
                            dados.pendencias.depreciacao.competencia,
                          )}
                        </strong>
                        <span className="text-muted-foreground">
                          {dados.pendencias.depreciacao.quantidadePatrimonios}{" "}
                          patrimônio(s) aguardando processamento
                        </span>
                      </div>
                      <Button asChild variant="outline" size="sm">
                        <Link href={dados.pendencias.depreciacao.destino}>
                          Consultar competência
                        </Link>
                      </Button>
                    </li>
                  ) : null}
                </ul>
              )}
            </CardContent>
          </section>
        </Card>

        <Card asChild>
          <section aria-labelledby="setores-title">
            <CardHeader>
              <CardTitle id="setores-title" className="flex items-center gap-2">
                <MapPin
                  className="size-4 text-interactive"
                  aria-hidden="true"
                />
                Setores com mais patrimônios
              </CardTitle>
              <CardDescription>
                Os 5 setores com mais bens ativos.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {dados?.setores.length ? (
                <ol className="grid gap-2">
                  {dados.setores.map((setor, indice) => (
                    <li key={setor.id}>
                      <Button
                        asChild
                        variant="ghost"
                        className="h-auto w-full justify-start whitespace-normal py-2"
                      >
                        <Link href={setor.destino}>
                          <span className="text-muted-foreground">
                            {indice + 1}.
                          </span>
                          <span className="min-w-0 flex-1 break-words text-left">
                            {setor.nome}
                          </span>
                          <Badge variant="secondary">{setor.total}</Badge>
                        </Link>
                      </Button>
                    </li>
                  ))}
                </ol>
              ) : (
                <p className="text-sm text-muted-foreground">
                  {dados
                    ? "Nenhum setor possui bens nessa contagem."
                    : "Os setores estão indisponíveis no momento."}
                </p>
              )}
            </CardContent>
          </section>
        </Card>
      </div>

      <Card asChild>
        <section aria-labelledby="atividades-title">
          <CardHeader>
            <CardTitle
              id="atividades-title"
              className="flex items-center gap-2"
            >
              <Clock3 className="size-4 text-interactive" aria-hidden="true" />
              Últimas atividades realizadas por você
            </CardTitle>
            <CardDescription>
              As três ações patrimoniais mais recentes feitas por você.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {dados?.atividades.length ? (
              <ol className="grid divide-y">
                {dados.atividades.map((atividade) => (
                  <li
                    key={`${atividade.tipo}-${atividade.patrimonioId}-${atividade.registradoEm}`}
                  >
                    <Button
                      asChild
                      variant="ghost"
                      className="h-auto w-full justify-start whitespace-normal py-3"
                    >
                      <Link href={atividade.destino}>
                        <span className="min-w-0 flex-1 text-left">
                          <strong className="block">{atividade.titulo}</strong>
                          <span className="text-xs text-muted-foreground">
                            Patrimônio {atividade.numeroPatrimonio}
                          </span>
                        </span>
                        <time
                          className="shrink-0 text-xs text-muted-foreground"
                          dateTime={atividade.registradoEm}
                        >
                          {formatarDataHora(atividade.registradoEm)}
                        </time>
                      </Link>
                    </Button>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="text-sm text-muted-foreground">
                {dados
                  ? "Nenhuma atividade sua foi registrada."
                  : "As atividades estão indisponíveis no momento."}
              </p>
            )}
          </CardContent>
        </section>
      </Card>

      <Card asChild>
        <section aria-labelledby="acoes-title">
          <CardHeader>
            <CardTitle id="acoes-title">Ações rápidas</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
            {acoesRapidas
              .filter(
                (acao) =>
                  !acao.diretor || identidade.perfil === "DIRETOR_PATRIMONIO",
              )
              .map(({ label, icon: Icon, href }) => (
                <Button
                  asChild
                  variant="outline"
                  className="justify-start"
                  key={href}
                >
                  <Link href={href}>
                    <Icon aria-hidden="true" />
                    {label}
                  </Link>
                </Button>
              ))}
          </CardContent>
        </section>
      </Card>
    </main>
  );
}
