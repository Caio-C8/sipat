"use client";

import type { ComponentType } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  CircleAlert,
  CircleX,
  FileQuestion,
  LogIn,
  RotateCw,
  ShieldAlert,
} from "lucide-react";
import { PageHeader } from "./page-header";

const icones = {
  acesso: ShieldAlert,
  autenticacao: LogIn,
  erro: CircleX,
  indisponivel: RotateCw,
  naoEncontrado: FileQuestion,
  aviso: CircleAlert,
} satisfies Record<
  string,
  ComponentType<{
    className?: string;
    size?: number;
    "aria-hidden"?: boolean | "true" | "false";
  }>
>;

export type VarianteEstadoSistema = keyof typeof icones;

export function SystemState({
  title,
  description,
  variant,
  retry,
  retryHref,
}: Readonly<{
  title: string;
  description: string;
  variant: VarianteEstadoSistema;
  retry?: () => void;
  retryHref?: string;
}>) {
  const router = useRouter();
  const Icon = icones[variant];

  return (
    <main className="grid min-h-[60vh] place-items-center px-4 py-10 sm:px-7">
      <section className="w-full max-w-xl rounded-2xl border border-[#dce5f0] bg-white p-6 text-[#1d3c67] shadow-sm sm:p-8">
        <span className="mb-5 grid size-11 place-items-center rounded-xl bg-[#eef5ff] text-[#2864b5]">
          <Icon aria-hidden="true" size={22} />
        </span>
        <PageHeader
          title={title}
          description={<p role="alert">{description}</p>}
        />
        <div className="mt-6 flex flex-wrap gap-3">
          {retryHref ? (
            <Link
              className="inline-flex min-h-11 items-center justify-center rounded-lg bg-[#1d3b61] px-5 text-sm font-bold text-white no-underline hover:bg-[#294d78] focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-[#8dbbf0]"
              href={retryHref}
            >
              Tentar novamente
            </Link>
          ) : retry ? (
            <button
              type="button"
              className="inline-flex min-h-11 cursor-pointer items-center justify-center rounded-lg border-0 bg-[#1d3b61] px-5 text-sm font-bold text-white hover:bg-[#294d78] focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-[#8dbbf0]"
              onClick={retry}
            >
              Tentar novamente
            </button>
          ) : null}
          <button
            type="button"
            className="inline-flex min-h-11 cursor-pointer items-center justify-center rounded-lg border border-[#c8d5e5] bg-white px-5 text-sm font-bold text-[#24466e] hover:bg-[#f3f7fb] focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-[#8dbbf0]"
            onClick={() => router.back()}
          >
            Voltar
          </button>
          <Link
            className="inline-flex min-h-11 items-center justify-center rounded-lg px-5 text-sm font-bold text-[#2864b5] underline underline-offset-4 focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-[#8dbbf0]"
            href="/dashboard"
          >
            Início
          </Link>
        </div>
      </section>
    </main>
  );
}
