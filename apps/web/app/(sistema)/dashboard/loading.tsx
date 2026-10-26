import styles from "@/app/_home/home.module.css";

export default function DashboardLoading() {
  return (
    <main
      className={styles.main}
      aria-busy="true"
      aria-label="Carregando visão geral"
    >
      <div className={styles.loadingIntro} />
      <div className={styles.summaryGrid}>
        {Array.from({ length: 4 }, (_, index) => (
          <div className={styles.loadingCard} key={index} />
        ))}
      </div>
      <div className={styles.loadingPanel} />
      <span className={styles.srOnly}>Carregando dados patrimoniais…</span>
    </main>
  );
}
