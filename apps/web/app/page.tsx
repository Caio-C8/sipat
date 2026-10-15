import type { Metadata } from "next";
import styles from "./page.module.css";
import { publicAppConfig } from "@/lib/config/public-app-config";

const { appName, environment } = publicAppConfig;

export const metadata: Metadata = {
  title: `Início | ${appName}`,
  description: "Página inicial da infraestrutura do SIPAT.",
};

const checks = [
  {
    label: "Aplicação web",
    description: "Health check servido pelo Next.js.",
    href: "/api/health",
  },
  {
    label: "API backend",
    description: "Proxy padronizado para o NestJS.",
    href: "/api/backend/health",
  },
];

export default function Home() {
  return (
    <main className={styles.page}>
      <div className={styles.container}>
        <section className={styles.hero}>
          <p className={styles.eyebrow}>{environment}</p>

          <h1 className={styles.title}>{appName}</h1>

          <p className={styles.lead}>
            A infraestrutura inicial do SIPAT está pronta para receber os
            módulos patrimoniais. Use as verificações abaixo para confirmar a
            Web e a integração com a API.
          </p>
        </section>

        <section
          className={styles.checksSection}
          aria-labelledby="checks-title"
        >
          <h2 id="checks-title" className={styles.sectionTitle}>
            Verificações da infraestrutura
          </h2>

          <div className={styles.checksGrid}>
            {checks.map((check) => (
              <a
                className={styles.checkCard}
                href={check.href}
                key={check.href}
              >
                <span className={styles.checkLabel}>{check.label}</span>

                <p className={styles.checkDescription}>{check.description}</p>

                <code className={styles.checkPath}>{check.href}</code>
              </a>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
