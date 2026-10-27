import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { obterIdentidadeAtual } from "@/lib/auth/server-session";

export const metadata: Metadata = {
  title: "Senha atualizada",
  description: "Confirmação de atualização de senha do SIPAT.",
};

export default async function SenhaAtualizadaPage() {
  const identidade = await obterIdentidadeAtual();

  if (!identidade) {
    redirect("/login");
  }

  if (identidade.trocaSenhaObrigatoria) {
    redirect("/redefinir-senha");
  }

  return (
    <div className="w-full rounded-[1.1rem] border border-[#e2e8f1] bg-white p-[clamp(1.35rem,2.1vw,2.5rem)] pt-8 min-[801px]:mt-12 min-[801px]:min-h-[clamp(32rem,40vw,49rem)] min-[801px]:pt-[clamp(2rem,3vw,4rem)]">
      <span className="mb-6 grid size-[clamp(3rem,3.75vw,4.5rem)] place-items-center rounded-2xl bg-[#e9fbf3] text-[#00896b]">
        <Check size={30} aria-hidden="true" />
      </span>
      <h1 className="text-[clamp(1.5rem,1.55vw,2rem)] leading-[1.2] font-bold tracking-[-0.025em] text-[#1d3c67]">
        Senha atualizada
      </h1>
      <p className="mt-4 text-base text-[#31527a]">
        Seu primeiro acesso foi concluído.
      </p>
      <p className="mt-3 text-sm leading-7 text-[#7285a0]">
        Utilize sua nova senha nos próximos acessos no computador e no celular.
      </p>
      <div className="mt-3 flex gap-4 rounded-lg bg-[#eef5ff] px-5 py-2.5 text-[#224367]">
        <div>
          <strong className="block text-xs leading-5">
            Sua conta e seu perfil permanecem os mesmos.
          </strong>
        </div>
      </div>
      <Button
        asChild
        className="mt-7 h-[clamp(2rem,2.25vw,2.75rem)] w-full justify-start gap-3 rounded-md bg-[#223d64] px-5 text-xs font-bold text-white hover:bg-[#2b507e] focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-[#8dbbf0]"
      >
        <Link href="/dashboard">
          <ArrowRight size={17} aria-hidden="true" />
          Continuar para o SIPAT
        </Link>
      </Button>
    </div>
  );
}
