import {
  ArrowLeftRight,
  ArrowRight,
  Box,
  CalendarDays,
  ChartNoAxesColumn,
  Check,
  ChevronRight,
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
import { nomesPerfis } from "@/lib/navigation/system-navigation";
import styles from "./home.module.css";

const summary = [
  {
    title: "Total de bens",
    value: "32",
    detail: "Inclui 2 bens baixados preservados",
    icon: Box,
    tone: "blue",
  },
  {
    title: "Bens ativos",
    value: "28",
    detail: "Situação atual dos cadastros",
    icon: Check,
    tone: "green",
  },
  {
    title: "Em manutenção",
    value: "1",
    detail: "1 item aguardando retorno",
    icon: Wrench,
    tone: "orange",
  },
  {
    title: "Em empréstimo",
    value: "1",
    detail: "Próxima devolução: 25/09/2026",
    icon: Landmark,
    tone: "purple",
  },
] as const;

const situations = [
  { label: "Ativos", amount: 28, tone: "blue" },
  { label: "Em manutenção", amount: 1, tone: "orange" },
  { label: "Em empréstimo", amount: 1, tone: "purple" },
  { label: "Baixados", amount: 2, tone: "muted" },
] as const;

const sectors = [
  { name: "Administrativo", count: 14, width: "100%", tone: "blue" },
  { name: "Plenário", count: 8, width: "57%", tone: "teal" },
  { name: "Tecnologia da Informação", count: 6, width: "43%", tone: "purple" },
  { name: "Gabinete 02", count: 4, width: "29%", tone: "orange" },
] as const;

const activities = [
  {
    date: "23/09",
    title: "Estorno de baixa registrado",
    detail: "BAI-2026-0006 · 2 bens · Paulo Caixeta",
  },
  {
    date: "21/09",
    title: "Retorno de manutenção",
    detail: "Impressora 000002401 · MAN-2026-0018",
  },
  {
    date: "19/09",
    title: "Inconsistência corrigida",
    detail: "INC-012 · localização regularizada",
  },
] as const;

const quickActions = [
  { label: "Cadastrar bem", icon: Plus },
  { label: "Pesquisar bem", icon: Search },
  { label: "Movimentar bens", icon: ArrowLeftRight },
  { label: "Manutenção", icon: Wrench },
  { label: "Inventário", icon: ClipboardList },
  { label: "Relatórios", icon: ChartNoAxesColumn },
] as const;

export function HomeDashboard({
  identidade,
}: Readonly<{ identidade: IdentidadeAutenticada }>) {
  const perfil = nomesPerfis[identidade.perfil];

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
          23 de setembro de 2026
        </span>
      </div>

      <section
        className={styles.summaryGrid}
        aria-label="Resumo ilustrativo dos bens"
      >
        {summary.map(({ title, value, detail, icon: Icon, tone }) => (
          <article className={styles.summaryCard} key={title}>
            <div className={styles.summaryTop}>
              <span className={`${styles.summaryIcon} ${styles[tone]}`}>
                <Icon size={19} aria-hidden="true" />
              </span>
              <div>
                <p>{title}</p>
                <strong>{value}</strong>
              </div>
              <ArrowRight
                size={17}
                aria-hidden="true"
                className={styles.summaryArrow}
              />
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
              <p>Acesse os registros para analisar e dar continuidade.</p>
            </div>
          </div>
          <div className={`${styles.attentionItem} ${styles.attentionWarning}`}>
            <span className={styles.attentionIcon}>
              <ClipboardList size={17} aria-hidden="true" />
            </span>
            <div className={styles.attentionText}>
              <h3>4 inconsistências de inventário não corrigidas</h3>
              <p className={styles.warningText}>3 pendentes · 1 em análise</p>
              <small>Inclui ocorrências de inventários anteriores.</small>
            </div>
            <span className={styles.itemAction}>
              <ArrowRight size={16} aria-hidden="true" /> Analisar
            </span>
          </div>
          <div className={styles.attentionItem}>
            <span className={styles.attentionIcon}>
              <Wrench size={17} aria-hidden="true" />
            </span>
            <div className={styles.attentionText}>
              <h3>1 item em manutenção</h3>
              <p>Nobreak 000003104 · pedido MAN-2026-0018</p>
              <small>O outro item do pedido já retornou.</small>
            </div>
            <span className={styles.itemAction}>
              <ArrowRight size={16} aria-hidden="true" /> Acompanhar
            </span>
          </div>
        </section>

        <section className={styles.panel} aria-labelledby="situation-title">
          <div className={styles.sectionHeading}>
            <span className={styles.headingIcon}>
              <ChartNoAxesColumn size={15} aria-hidden="true" />
            </span>
            <div>
              <h2 id="situation-title">Bens por situação</h2>
              <p>Distribuição atual · 32 bens cadastrados.</p>
            </div>
          </div>
          <div className={styles.chartBody}>
            <div
              className={styles.donut}
              role="img"
              aria-label="28 ativos, 1 em manutenção, 1 em empréstimo e 2 baixados, total de 32 bens"
            >
              <div>
                <strong>32</strong>
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
            Bens baixados continuam disponíveis no histórico.
          </p>
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
              <p>Bens cadastrados, incluindo os baixados.</p>
            </div>
            <span className={styles.sectionAside}>
              Consultar <ArrowRight size={14} aria-hidden="true" />
            </span>
          </div>
          <div className={styles.sectorList}>
            {sectors.map(({ name, count, width, tone }) => (
              <div className={styles.sectorRow} key={name}>
                <span>{name}</span>
                <div className={styles.barTrack}>
                  <span className={styles[tone]} style={{ width }} />
                </div>
                <strong>{count}</strong>
              </div>
            ))}
          </div>
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
          <ul className={styles.activityList}>
            {activities.map(({ date, title, detail }) => (
              <li key={title}>
                <time>{date}</time>
                <span>
                  <strong>{title}</strong>
                  <small>{detail}</small>
                </span>
                <ChevronRight size={15} aria-hidden="true" />
              </li>
            ))}
          </ul>
        </section>
      </div>

      <section
        className={`${styles.panel} ${styles.quickPanel}`}
        aria-labelledby="quick-title"
      >
        <h2 id="quick-title">Ações rápidas</h2>
        <div className={styles.quickGrid}>
          {quickActions.map(({ label, icon: Icon }, index) => (
            <span
              className={`${styles.quickAction} ${index === 0 ? styles.quickPrimary : ""}`}
              key={label}
            >
              <Icon size={17} aria-hidden="true" />
              {label}
            </span>
          ))}
        </div>
      </section>

      <footer className={styles.pageFooter}>
        <span>SIPAT · Visão geral · dados ilustrativos</span>
        <span>
          {identidade.nome} · {perfil}
        </span>
      </footer>
    </main>
  );
}
