import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { LockKeyhole } from "lucide-react";
import { LogoutButton } from "@/components/auth/logout-button";
import { obterIdentidadeAtual } from "@/lib/auth/server-session";
import { RedefinirForm } from "./_components/redefinir-form";

export const metadata: Metadata = {
  title: "Criar nova senha",
  description: "Crie sua nova senha para o SIPAT.",
};

export default async function RedefinirSenhaPage() {
  const identidade = await obterIdentidadeAtual();

  if (!identidade) {
    redirect("/login");
  }

  if (!identidade.trocaSenhaObrigatoria) {
    redirect("/dashboard");
  }

  return (
    <div className="w-full rounded-[1.1rem] border border-[#e2e8f1] bg-white p-[clamp(1.35rem,2.1vw,2.5rem)] min-[801px]:mt-8 min-[801px]:min-h-[clamp(32rem,38vw,45rem)] min-[801px]:pb-3">
      <span className="mb-2 inline-block rounded-full bg-[#eff5ff] px-5 py-2 text-[0.62rem] font-extrabold tracking-wide text-[#2864b5] uppercase">
        Primeiro acesso
      </span>
      <h1 className="text-[clamp(1.5rem,1.55vw,2rem)] leading-[1.2] font-bold tracking-[-0.025em] text-[#1d3c67]">
        Crie sua nova senha
      </h1>
      <p className="mt-1 text-sm leading-6 text-[#52647f]">
        Olá, {identidade.nome}. Defina sua senha para continuar no SIPAT.
      </p>
      <div className="my-3 flex gap-4 rounded-lg bg-[#eef5ff] px-5 py-2.5 text-[#224367]">
        <LockKeyhole
          className="mt-0.5 shrink-0 text-[#3678ce]"
          size={17}
          aria-hidden="true"
        />
        <div>
          <strong className="block text-xs leading-5">
            A troca da senha inicial é obrigatória.
          </strong>
          <span className="mt-1 block text-xs leading-5 text-[#526781]">
            Seu acesso será liberado após salvar a nova senha.
          </span>
        </div>
      </div>
      <RedefinirForm />
      <p className="mt-3 text-center">
        <LogoutButton className="inline-flex cursor-pointer items-center gap-2 border-0 bg-transparent p-1 text-xs font-bold text-[#286bc2] hover:underline focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-[#8dbbf0]">
          Sair e voltar ao login
        </LogoutButton>
      </p>
      <p className="mt-3 text-center text-xs text-[#596b84]">
        A nova senha vale no computador e no celular.
      </p>
    </div>
  );
}
