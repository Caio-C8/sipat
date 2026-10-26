import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, HeartPulse, LockKeyhole, Route } from "lucide-react";
import styles from "./page.module.css";
import { publicAppConfig } from "@/lib/config/public-app-config";

const { appName, environment } = publicAppConfig;

export const metadata: Metadata = {
  title: `Início | ${appName}`,
  description: "Catálogo público das páginas e verificações do SIPAT.",
};

const paginas = [
  {
    href: "/login",
    titulo: "Login",
    descricao: "Entrada para usuários autorizados.",
    acesso: "Pública para anônimos",
    perfis: "Administrador e Diretor de Patrimônio",
  },
  {
    href: "/redefinir-senha",
    titulo: "Primeiro acesso",
    descricao: "Troca obrigatória da senha inicial.",
    acesso: "Sessão restrita",
    perfis: "Administrador e Diretor de Patrimônio",
  },
  {
    href: "/senha-atualizada",
    titulo: "Senha atualizada",
    descricao: "Confirmação da conclusão do primeiro acesso.",
    acesso: "Sessão autenticada",
    perfis: "Administrador e Diretor de Patrimônio",
  },
  {
    href: "/dashboard",
    titulo: "Visão geral",
    descricao: "Futura home autenticada do SIPAT.",
    acesso: "Protegida",
    perfis: "Administrador e Diretor de Patrimônio",
  },
] as const;

const checks = [
  {
    label: "Aplicação Web",
    description: "Health check servido pelo Next.js.",
    href: "/api/health",
  },
  {
    label: "API backend",
    description: "Health check do NestJS pelo transporte interno.",
    href: "/api/backend/health",
  },
] as const;

export default function Home() {
  return (
    <main className={styles.page}>
      <div className={styles.container}>
        <section className={styles.hero}>
          <p className={styles.eyebrow}>{environment}</p>
          <h1 className={styles.title}>{appName}</h1>
          <p className={styles.lead}>
            Catálogo público das páginas disponíveis e dos pontos técnicos de
            verificação da aplicação.
          </p>
        </section>

        <section className={styles.section} aria-labelledby="pages-title">
          <div className={styles.sectionHeading}>
            <Route aria-hidden="true" />
            <div>
              <h2 id="pages-title">Páginas do sistema</h2>
              <p>
                A API confirma sessão e autorização em cada fluxo protegido.
              </p>
            </div>
          </div>
          <div className={styles.grid}>
            {paginas.map((pagina) => (
              <Link
                className={styles.card}
                href={pagina.href}
                key={pagina.href}
              >
                <span className={styles.cardTop}>
                  <span className={styles.path}>{pagina.href}</span>
                  <ArrowRight size={18} aria-hidden="true" />
                </span>
                <strong>{pagina.titulo}</strong>
                <p>{pagina.descricao}</p>
                <dl>
                  <div>
                    <dt>Acesso</dt>
                    <dd>{pagina.acesso}</dd>
                  </div>
                  <div>
                    <dt>Perfis</dt>
                    <dd>{pagina.perfis}</dd>
                  </div>
                </dl>
              </Link>
            ))}
          </div>
        </section>

        <section className={styles.section} aria-labelledby="checks-title">
          <div className={styles.sectionHeading}>
            <HeartPulse aria-hidden="true" />
            <div>
              <h2 id="checks-title">Verificações técnicas</h2>
              <p>Endpoints públicos; não são páginas de domínio.</p>
            </div>
          </div>
          <div className={styles.checksGrid}>
            {checks.map((check) => (
              <a
                className={styles.checkCard}
                href={check.href}
                key={check.href}
              >
                <span>
                  <strong>{check.label}</strong>
                  <code>{check.href}</code>
                </span>
                <p>{check.description}</p>
              </a>
            ))}
          </div>
          <p className={styles.transportNote}>
            <LockKeyhole size={16} aria-hidden="true" />
            <span>
              <code>/api/backend/:path*</code> é o transporte interno da Web e
              herda as permissões da API; não é uma página navegável.
            </span>
          </p>
        </section>
      </div>
    </main>
  );
}
