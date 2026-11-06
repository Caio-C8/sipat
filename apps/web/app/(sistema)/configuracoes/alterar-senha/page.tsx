import type { Metadata } from "next";
import { LockKeyhole } from "lucide-react";
import { AlterarSenhaForm } from "@/features/configuracoes/components/alterar-senha-form";
import { ConfiguracoesAbas } from "@/features/configuracoes/components/configuracoes-abas";
import { nomesPerfis } from "@/lib/navigation/system-navigation";
import { obterIdentidadeAtual } from "@/lib/auth/server-session";

export const metadata: Metadata = {
  title: "Alterar senha",
  description: "Atualize sua senha de acesso ao SIPAT.",
};

export default async function AlterarSenhaPage() {
  const identidade = await obterIdentidadeAtual();
  if (!identidade) return null;

  return (
    <main className="mx-auto grid w-full min-w-0 max-w-[1900px] gap-4 px-4 py-4 text-[#17253d] sm:px-5 sm:py-5 min-[1500px]:gap-5 min-[1500px]:px-[30px] min-[1500px]:py-6">
      <header>
        <h1 className="text-xl font-bold leading-tight text-[#111d34] min-[1500px]:text-[27px]">
          Alterar senha
        </h1>
        <p className="mt-1 text-xs text-[#62748e]">
          Atualize a senha utilizada para entrar no SIPAT.
        </p>
      </header>

      <ConfiguracoesAbas perfil={identidade.perfil} />

      <div className="grid min-w-0 gap-4 lg:grid-cols-[minmax(0,1.8fr)_minmax(270px,0.95fr)]">
        <section
          aria-labelledby="senha-acesso-titulo"
          className="min-w-0 rounded-lg border border-[#dfe7f1] bg-white p-4 sm:p-5"
        >
          <h2
            id="senha-acesso-titulo"
            className="flex items-center gap-2 text-sm font-bold"
          >
            <span className="grid size-7 place-items-center rounded-md bg-[#eff5ff] text-[#2860eb]">
              <LockKeyhole aria-hidden="true" className="size-4" />
            </span>
            Senha de acesso
          </h2>
          <AlterarSenhaForm />
        </section>

        <aside className="min-w-0 rounded-lg border border-[#dfe7f1] bg-white p-4 sm:p-5">
          <h2 className="text-sm font-bold">Uma conta, dois modos de acesso</h2>
          <p className="mt-5 text-xs font-bold leading-5 text-[#19355d]">
            A alteração vale para o acesso pelo computador e pelo celular.
          </p>
          <p className="mt-4 text-[10px] leading-5 text-[#71839a]">
            Perfil: {nomesPerfis[identidade.perfil]}
          </p>
          <p className="mt-2 text-[10px] leading-5 text-[#71839a]">
            Após salvar, será necessário entrar novamente com a nova senha.
          </p>
        </aside>
      </div>
    </main>
  );
}
