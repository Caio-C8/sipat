import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, HeartPulse, LockKeyhole, Route } from "lucide-react";
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
    href: "/esqueci-senha",
    titulo: "Recuperar senha",
    descricao: "Solicitação neutra de recuperação por e-mail institucional.",
    acesso: "Pública",
    perfis: "Usuários com conta institucional",
  },
  {
    href: "/recuperar-senha",
    titulo: "Definir nova senha",
    descricao: "Consumo do link de recuperação recebido por e-mail.",
    acesso: "Pública com token transitório",
    perfis: "Usuários com link válido",
  },
  {
    href: "/recuperacao-concluida",
    titulo: "Recuperação concluída",
    descricao: "Retorno ao aplicativo ou ao login Web.",
    acesso: "Pública",
    perfis: "Todos",
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
    href: "/movimentacoes",
    titulo: "Movimentações",
    descricao: "Consulta de transferências e registro de novas movimentações.",
    acesso: "Protegida",
    perfis: "Diretor registra; administrador e diretor consultam",
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
    <main className="min-h-svh bg-background bg-[radial-gradient(circle_at_top_left,color-mix(in_oklch,var(--primary)_14%,transparent)_0,transparent_32rem)]">
      <div className="mx-auto w-full max-w-6xl px-3 py-12 sm:px-4 sm:py-16 lg:py-28">
        <section className="max-w-3xl">
          <p className="mb-4 inline-flex rounded-full border bg-card/90 px-3 py-1.5 text-xs font-bold tracking-widest text-primary uppercase">
            {environment}
          </p>
          <h1 className="text-5xl leading-[0.95] font-bold tracking-[-0.06em] text-balance text-foreground sm:text-6xl lg:text-8xl">
            {appName}
          </h1>
          <p className="mt-7 max-w-2xl text-base leading-7 text-pretty text-muted-foreground sm:text-xl sm:leading-8">
            Catálogo público das páginas disponíveis e dos pontos técnicos de
            verificação da aplicação.
          </p>
        </section>

        <section className="mt-12 sm:mt-16" aria-labelledby="pages-title">
          <div className="mb-4 flex items-start gap-3">
            <Route
              className="mt-0.5 shrink-0 text-primary"
              aria-hidden="true"
            />
            <div>
              <h2 id="pages-title" className="text-lg font-semibold">
                Páginas do sistema
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                A API confirma sessão e autorização em cada fluxo protegido.
              </p>
            </div>
          </div>
          <div className="grid gap-4 min-[704px]:grid-cols-2">
            {paginas.map((pagina) => (
              <Link
                className="rounded-xl border bg-card/95 p-5 text-card-foreground no-underline transition-[border-color,transform,box-shadow] duration-150 hover:-translate-y-0.5 hover:border-ring hover:shadow-xl motion-reduce:transform-none motion-reduce:transition-none focus-visible:border-ring focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-ring/45"
                href={pagina.href}
                key={pagina.href}
              >
                <span className="mb-4 flex items-center justify-between gap-4 text-primary">
                  <span className="wrap-anywhere text-xs text-primary">
                    {pagina.href}
                  </span>
                  <ArrowRight size={18} aria-hidden="true" />
                </span>
                <strong className="text-lg">{pagina.titulo}</strong>
                <p className="mt-2 mb-4 leading-6 text-muted-foreground min-[704px]:min-h-11">
                  {pagina.descricao}
                </p>
                <dl className="grid gap-2 border-t pt-4">
                  <div className="grid grid-cols-[4rem_minmax(0,1fr)] gap-3 text-xs">
                    <dt className="text-muted-foreground">Acesso</dt>
                    <dd>{pagina.acesso}</dd>
                  </div>
                  <div className="grid grid-cols-[4rem_minmax(0,1fr)] gap-3 text-xs">
                    <dt className="text-muted-foreground">Perfis</dt>
                    <dd>{pagina.perfis}</dd>
                  </div>
                </dl>
              </Link>
            ))}
          </div>
        </section>

        <section className="mt-12 sm:mt-16" aria-labelledby="checks-title">
          <div className="mb-4 flex items-start gap-3">
            <HeartPulse
              className="mt-0.5 shrink-0 text-primary"
              aria-hidden="true"
            />
            <div>
              <h2 id="checks-title" className="text-lg font-semibold">
                Verificações técnicas
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Endpoints públicos; não são páginas de domínio.
              </p>
            </div>
          </div>
          <div className="grid gap-4 min-[704px]:grid-cols-2">
            {checks.map((check) => (
              <a
                className="grid gap-3 rounded-xl border bg-card/95 p-5 text-card-foreground no-underline transition-[border-color,transform,box-shadow] duration-150 hover:-translate-y-0.5 hover:border-ring hover:shadow-xl motion-reduce:transform-none motion-reduce:transition-none focus-visible:border-ring focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-ring/45"
                href={check.href}
                key={check.href}
              >
                <span className="flex flex-col items-start gap-1 min-[704px]:flex-row min-[704px]:justify-between min-[704px]:gap-4">
                  <strong>{check.label}</strong>
                  <code className="wrap-anywhere text-xs text-primary">
                    {check.href}
                  </code>
                </span>
                <p className="text-sm leading-6 text-muted-foreground">
                  {check.description}
                </p>
              </a>
            ))}
          </div>
          <p className="mt-4 flex items-start gap-3 rounded-lg border bg-muted/65 p-4 text-xs leading-6 text-muted-foreground">
            <LockKeyhole
              className="mt-0.5 shrink-0"
              size={16}
              aria-hidden="true"
            />
            <span>
              <code className="wrap-anywhere text-primary">
                /api/backend/:path*
              </code>{" "}
              é o transporte interno da Web e herda as permissões da API; não é
              uma página navegável.
            </span>
          </p>
        </section>
      </div>
    </main>
  );
}
