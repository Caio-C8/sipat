import Link from "next/link";
import type { Metadata } from "next";
import { obterIdentidadeAtual } from "@/lib/auth/server-session";
import { CadastroPatrimonio } from "@/features/patrimonios/components/cadastro-patrimonio";

export const metadata: Metadata = {
  title: "Cadastrar patrimônio",
  description: "Cadastre bens patrimoniais no SIPAT.",
};

export default async function NovoPatrimonioPage() {
  const identidade = await obterIdentidadeAtual();
  if (!identidade) return null;
  if (identidade.perfil !== "DIRETOR_PATRIMONIO") {
    return (
      <main className="p-7">
        <h1 className="text-2xl font-bold text-[#19355d]">
          Acesso não permitido
        </h1>
        <p role="alert" className="mt-3">
          Somente o Diretor de Patrimônio pode cadastrar bens.
        </p>
        <Link href="/patrimonios" className="mt-4 inline-block underline">
          Consultar patrimônio
        </Link>
      </main>
    );
  }
  return <CadastroPatrimonio usuarioId={identidade.id} />;
}
