import type { Metadata } from "next";
import { exigirIdentidadeAtual } from "@/lib/auth/server-session";
import { CadastroPatrimonio } from "@/features/patrimonios/components/cadastro-patrimonio";
import { AccessDenied } from "@/components/shared/access-denied";

export const metadata: Metadata = {
  title: "Cadastrar patrimônio",
  description: "Cadastre bens patrimoniais no SIPAT.",
};

export default async function NovoPatrimonioPage() {
  const identidade = await exigirIdentidadeAtual();
  if (identidade.perfil !== "DIRETOR_PATRIMONIO") {
    return (
      <AccessDenied description="Somente o Diretor de Patrimônio pode cadastrar bens." />
    );
  }
  return <CadastroPatrimonio usuarioId={identidade.id} />;
}
