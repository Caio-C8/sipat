import {
  ArrowLeftRight,
  Box,
  CalendarDays,
  ChartNoAxesColumn,
  Check,
  ClipboardList,
  Clock3,
  Info,
  Landmark,
  MapPin,
  Plus,
  Search,
  Wrench,
} from "lucide-react";
import type { IdentidadeAutenticada } from "@repo/contracts";
import type { ResumoPatrimonialDashboard } from "@/features/patrimonios/api/patrimonio-operations";
import { nomesPerfis } from "@/lib/navigation/system-navigation";
import styles from "./home.module.css";

type EstadoResumoPatrimonial =
  | Readonly<{ status: "sucesso"; dados: ResumoPatrimonialDashboard }>
  | Readonly<{ status: "erro" }>;

const quickActions = [
  { label: "Cadastrar bem", icon: Plus },
  { label: "Pesquisar bem", icon: Search },
  { label: "Movimentar bens", icon: ArrowLeftRight },
  { label: "Manutenção", icon: Wrench },
  { label: "Inventário", icon: ClipboardList },
  { label: "Relatórios", icon: ChartNoAxesColumn },
] as const;

const MENSAGEM_NAO_IMPLEMENTADO =
  "Dados ainda não disponíveis — integração não implementada";

function pluralizarItens(quantidade: number): string {
  return quantidade === 1 ? "item" : "itens";
}

function formatarData(data: Date): { iso: string; texto: string } {
  const ano = data.getFullYear();
  const mes = String(data.getMonth() + 1).padStart(2, "0");
  const dia = String(data.getDate()).padStart(2, "0");

  return {
    iso: `${ano}-${mes}-${dia}`,
    texto: new Intl.DateTimeFormat("pt-BR", {
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(data),
  };
}

function criarGradienteSituacoes(
  situacoes: readonly Readonly<{ amount: number; color: string }>[],
): string {
  const total = situacoes.reduce((soma, situacao) => soma + situacao.amount, 0);

  if (total === 0) return "#e7edf5";

  let acumulado = 0;
  const intervalos = situacoes.map(({ amount, color }) => {
    const inicio = (acumulado / total) * 100;
    acumulado += amount;
    return `${color} ${inicio}% ${(acumulado / total) * 100}%`;
  });

  return `conic-gradient(${intervalos.join(", ")})`;
}

function EstadoNaoImplementado() {
  return (
    <div className={styles.unavailableState}>
      <Info size={18} aria-hidden="true" />
      <p>{MENSAGEM_NAO_IMPLEMENTADO}</p>
    </div>
  );
}

export function HomeDashboard({
  identidade,
  resumoPatrimonial,
  dataAtual = new Date(),
}: Readonly<{
  identidade: IdentidadeAutenticada;
  resumoPatrimonial: EstadoResumoPatrimonial;
  dataAtual?: Date;
}>) {
  const perfil = nomesPerfis[identidade.perfil];
  const data = formatarData(dataAtual);
  const dados =
    resumoPatrimonial.status === "sucesso"
      ? resumoPatrimonial.dados
      : undefined;
  const summary = [
    {
      title: "Total de bens",
      value: dados?.total,
      detail: dados
        ? `Inclui ${dados.porStatus.BAIXADO} ${pluralizarItens(dados.porStatus.BAIXADO)} baixados preservados`
        : "Dados indisponíveis no momento",
      icon: Box,
      tone: "blue",
    },
    {
      title: "Bens ativos",
      value: dados?.porStatus.ATIVO,
      detail: dados
        ? "Situação atual dos cadastros"
        : "Dados indisponíveis no momento",
      icon: Check,
      tone: "green",
    },
    {
      title: "Em manutenção",
      value: dados?.porStatus.EM_MANUTENCAO,
      detail: dados
        ? `${dados.porStatus.EM_MANUTENCAO} ${pluralizarItens(dados.porStatus.EM_MANUTENCAO)} nesta situação`
        : "Dados indisponíveis no momento",
      icon: Wrench,
      tone: "orange",
    },
    {
      title: "Em empréstimo",
      value: dados?.porStatus.EMPRESTADO,
      detail: dados
        ? `${dados.porStatus.EMPRESTADO} ${pluralizarItens(dados.porStatus.EMPRESTADO)} nesta situação`
        : "Dados indisponíveis no momento",
      icon: Landmark,
      tone: "purple",
    },
  ] as const;
  const situations = dados
    ? ([
        {
          label: "Ativos",
          amount: dados.porStatus.ATIVO,
          tone: "blue",
          color: "#2860eb",
        },
        {
          label: "Em manutenção",
          amount: dados.porStatus.EM_MANUTENCAO,
          tone: "orange",
          color: "#f59e0b",
        },
        {
          label: "Em empréstimo",
          amount: dados.porStatus.EMPRESTADO,
          tone: "purple",
          color: "#8852ef",
        },
        {
          label: "Baixados",
          amount: dados.porStatus.BAIXADO,
          tone: "muted",
          color: "#cbd6e5",
        },
      ] as const)
    : undefined;

  return (
    <main className={styles.main}>
      <div className={styles.intro}>
        <div>
          <h1>Bem-vindo, {identidade.nome}!</h1>
          <p>
            Acompanhe o patrimônio da Câmara e veja o que precisa da sua
            atenção.
          </p>
        </div>
        <span className={styles.dateBadge}>
          <CalendarDays size={16} aria-hidden="true" />
          <time dateTime={data.iso}>{data.texto}</time>
        </span>
      </div>

      {resumoPatrimonial.status === "erro" ? (
        <div className={styles.integrationError} role="alert">
          <Info size={18} aria-hidden="true" />
          <p>
            Não foi possível carregar os dados patrimoniais. Tente novamente
            mais tarde.
          </p>
        </div>
      ) : null}

      <section className={styles.summaryGrid} aria-label="Resumo dos bens">
        {summary.map(({ title, value, detail, icon: Icon, tone }) => (
          <article className={styles.summaryCard} key={title}>
            <div className={styles.summaryTop}>
              <span className={`${styles.summaryIcon} ${styles[tone]}`}>
                <Icon size={19} aria-hidden="true" />
              </span>
              <div>
                <p>{title}</p>
                <strong>{value ?? "—"}</strong>
              </div>
            </div>
            <p className={styles.cardHint}>{detail}</p>
          </article>
        ))}
      </section>

      <div className={styles.upperGrid}>
        <section className={styles.panel} aria-labelledby="attention-title">
          <div className={styles.sectionHeading}>
            <span className={styles.headingIcon}>
              <Info size={15} aria-hidden="true" />
            </span>
            <div>
              <h2 id="attention-title">Pendências de atenção</h2>
              <p>Acompanhamento de registros que precisam de análise.</p>
            </div>
          </div>
          <EstadoNaoImplementado />
        </section>

        <section className={styles.panel} aria-labelledby="situation-title">
          <div className={styles.sectionHeading}>
            <span className={styles.headingIcon}>
              <ChartNoAxesColumn size={15} aria-hidden="true" />
            </span>
            <div>
              <h2 id="situation-title">Bens por situação</h2>
              <p>
                {dados
                  ? `Distribuição atual · ${dados.total} ${pluralizarItens(dados.total)} cadastrados.`
                  : "Distribuição atual dos cadastros."}
              </p>
            </div>
          </div>
          {dados && situations ? (
            <>
              <div className={styles.chartBody}>
                <div
                  className={styles.donut}
                  role="img"
                  aria-label={`${situations[0].amount} ativos, ${situations[1].amount} em manutenção, ${situations[2].amount} em empréstimo e ${situations[3].amount} baixados; ${dados.total} bens no total`}
                  style={{ background: criarGradienteSituacoes(situations) }}
                >
                  <div>
                    <strong>{dados.total}</strong>
                    <span>bens</span>
                  </div>
                </div>
                <ul className={styles.legend}>
                  {situations.map(({ label, amount, tone }) => (
                    <li key={label}>
                      <span className={`${styles.legendDot} ${styles[tone]}`} />{" "}
                      <span>{label}</span>
                      <strong>{amount}</strong>
                    </li>
                  ))}
                </ul>
              </div>
              <p className={styles.panelFoot}>
                {dados.total === 0
                  ? "Nenhum patrimônio cadastrado."
                  : "Bens baixados continuam disponíveis no histórico."}
              </p>
            </>
          ) : (
            <div className={styles.dataErrorState}>
              Dados patrimoniais indisponíveis no momento.
            </div>
          )}
        </section>
      </div>

      <div className={styles.lowerGrid}>
        <section className={styles.panel} aria-labelledby="sector-title">
          <div className={styles.sectionHeading}>
            <span className={styles.headingIcon}>
              <MapPin size={15} aria-hidden="true" />
            </span>
            <div>
              <h2 id="sector-title">Bens por setor</h2>
              <p>Distribuição dos bens entre os setores.</p>
            </div>
          </div>
          <EstadoNaoImplementado />
        </section>

        <section className={styles.panel} aria-labelledby="activities-title">
          <div className={styles.sectionHeading}>
            <span className={styles.headingIcon}>
              <Clock3 size={15} aria-hidden="true" />
            </span>
            <div>
              <h2 id="activities-title">Últimas atividades</h2>
              <p>Registros recentes do patrimônio.</p>
            </div>
          </div>
          <EstadoNaoImplementado />
        </section>
      </div>

      <section
        className={`${styles.panel} ${styles.quickPanel}`}
        aria-labelledby="quick-title"
      >
        <h2 id="quick-title">Ações rápidas</h2>
        <div className={styles.quickGrid}>
          {quickActions.map(({ label, icon: Icon }) => (
            <button
              className={styles.quickAction}
              key={label}
              type="button"
              disabled
            >
              <Icon size={17} aria-hidden="true" />
              <span>{label}</span>
              <small>Em breve</small>
            </button>
          ))}
        </div>
      </section>

      <footer className={styles.pageFooter}>
        <span>SIPAT · Visão geral</span>
        <span>
          {identidade.nome} · {perfil}
        </span>
      </footer>
    </main>
  );
}
