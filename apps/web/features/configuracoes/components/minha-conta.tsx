import Link from "next/link";
import { Info, KeyRound, UserRound } from "lucide-react";
import type { IdentidadeAutenticada } from "@repo/contracts";
import { Button } from "@/components/ui/button";
import { nomesPerfis } from "@/lib/navigation/system-navigation";
import { ConfiguracoesAbas } from "./configuracoes-abas";

const cartao = "min-w-0 rounded-lg border border-[#dfe7f1] bg-white p-4 sm:p-5";

function Dado({
  rotulo,
  children,
}: {
  rotulo: string;
  children: React.ReactNode;
}) {
  return (
    <div className="grid min-w-0 gap-1">
      <dt className="text-[10px] text-[#71839a]">{rotulo}</dt>
      <dd className="m-0 break-words text-xs font-medium text-[#17253d]">
        {children}
      </dd>
    </div>
  );
}

export function MinhaConta({
  identidade,
}: {
  identidade: IdentidadeAutenticada;
}) {
  return (
    <main className="mx-auto grid w-full min-w-0 max-w-[1900px] gap-4 px-4 py-4 text-[#17253d] sm:px-5 sm:py-5 min-[1500px]:gap-5 min-[1500px]:px-[30px] min-[1500px]:py-6">
      <header>
        <h1 className="text-xl font-bold leading-tight text-[#111d34] min-[1500px]:text-[27px]">
          Minha conta
        </h1>
        <p className="mt-1 text-xs text-[#62748e]">
          Consulte sua identificação e gerencie a senha de acesso.
        </p>
      </header>

      <ConfiguracoesAbas perfil={identidade.perfil} />

      <div className="grid min-w-0 gap-4 lg:grid-cols-[minmax(0,1.8fr)_minmax(270px,0.95fr)]">
        <section aria-labelledby="identificacao-titulo" className={cartao}>
          <h2
            id="identificacao-titulo"
            className="flex items-center gap-2 text-sm font-bold"
          >
            <span className="grid size-7 place-items-center rounded-md bg-[#eff5ff] text-[#2860eb]">
              <UserRound aria-hidden="true" className="size-4" />
            </span>
            Identificação
          </h2>

          <dl className="mt-6 grid gap-x-8 gap-y-6 sm:grid-cols-2">
            <Dado rotulo="Nome">{identidade.nome}</Dado>
            <Dado rotulo="Perfil">{nomesPerfis[identidade.perfil]}</Dado>
            <Dado rotulo="E-mail de acesso">{identidade.email}</Dado>
            <Dado rotulo="Setor">
              <span className="text-[#71839a]">Não disponível</span>
            </Dado>
            <Dado rotulo="Situação">
              <span className="inline-flex rounded-full bg-[#e8f8ef] px-2.5 py-1 text-[10px] font-semibold text-[#167347]">
                Ativo
              </span>
            </Dado>
          </dl>

          <p className="mt-8 border-t border-[#edf1f6] pt-4 text-[10px] leading-5 text-[#71839a]">
            O setor não é enviado pelo serviço de identidade atual. A situação
            ativa representa esta sessão autenticada.
          </p>
        </section>

        <section aria-labelledby="senha-acesso-titulo" className={cartao}>
          <h2
            id="senha-acesso-titulo"
            className="flex items-center gap-2 text-sm font-bold"
          >
            <span className="grid size-7 place-items-center rounded-md bg-[#eff5ff] text-[#2860eb]">
              <KeyRound aria-hidden="true" className="size-4" />
            </span>
            Senha de acesso
          </h2>
          <h3 className="mt-5 text-xs font-bold text-[#19355d]">
            Atualize a senha da sua conta.
          </h3>
          <p className="mt-3 max-w-[25ch] text-[11px] leading-5 text-[#71839a]">
            A mesma senha vale no computador e no celular.
          </p>
          <Button
            asChild
            className="mt-6 w-full justify-start gap-2 rounded-md bg-[#223d64] text-xs font-semibold text-white hover:bg-[#2b507e]"
          >
            <Link href="/configuracoes/alterar-senha">
              <KeyRound aria-hidden="true" className="size-3.5" />
              Alterar senha
            </Link>
          </Button>
          <p className="mt-8 max-w-[30ch] text-[10px] leading-5 text-[#71839a]">
            Esqueceu a senha?{" "}
            <Link
              href="/esqueci-senha"
              className="font-semibold text-[#2057d6] underline underline-offset-2"
            >
              Use a recuperação disponível na tela de login.
            </Link>
          </p>
        </section>
      </div>

      <aside className="flex items-start gap-3 rounded-lg border border-[#d9e8ff] bg-[#eef5ff] p-4 text-[#19355d]">
        <Info
          aria-hidden="true"
          className="mt-0.5 size-4 shrink-0 text-[#2860eb]"
        />
        <div>
          <h2 className="text-xs font-bold">Identificação nos registros</h2>
          <p className="mt-1 text-[10px] leading-5 text-[#62748e]">
            As operações realizadas com sua conta ficam associadas ao seu
            usuário.
          </p>
        </div>
      </aside>
    </main>
  );
}
