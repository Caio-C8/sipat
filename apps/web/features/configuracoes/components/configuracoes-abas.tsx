import Link from "next/link";
import { UserRound, UsersRound } from "lucide-react";
import type { PerfilUsuario } from "@repo/contracts";

export function ConfiguracoesAbas({
  perfil,
  naConta = true,
}: {
  perfil: PerfilUsuario;
  naConta?: boolean;
}) {
  return (
    <nav
      aria-label="Seções de configurações"
      className="flex min-h-10 items-stretch overflow-x-auto rounded-md border border-[#dfe7f1] bg-white px-3"
    >
      {perfil === "ADMINISTRADOR" ? (
        <span
          aria-disabled="true"
          className="inline-flex min-w-[170px] items-center gap-2 border-b-2 border-transparent px-3 text-xs text-[#71839a]"
          title="Gestão de usuários ainda não está disponível na Web."
        >
          <UsersRound aria-hidden="true" className="size-3.5" />
          Usuários
        </span>
      ) : null}
      <Link
        href="/configuracoes"
        aria-current={naConta ? "page" : undefined}
        className={`inline-flex min-w-[170px] items-center gap-2 border-b-2 px-3 text-xs font-semibold no-underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#8dbbf0] ${naConta ? "border-[#2860eb] text-[#2057d6]" : "border-transparent text-[#62748e] hover:text-[#2057d6]"}`}
      >
        <UserRound aria-hidden="true" className="size-3.5" />
        Minha conta
      </Link>
    </nav>
  );
}
