import type { Metadata } from "next";
import { AccessDenied } from "@/components/shared/access-denied";
import { CadastroFormPage } from "@/features/cadastros/components/cadastro-form-page";
import { UsuarioForm } from "@/features/usuarios/components/usuario-form";
import { exigirIdentidadeAtual } from "@/lib/auth/server-session";

export const metadata: Metadata = { title: "Cadastrar usuário" };

export default async function NovoUsuarioPage() {
  const identidade = await exigirIdentidadeAtual();
  if (identidade.perfil !== "ADMINISTRADOR") {
    return (
      <AccessDenied description="Somente o Administrador pode cadastrar usuários." />
    );
  }

  return (
    <CadastroFormPage
      title="Cadastrar usuário"
      description="Informe os dados de acesso e selecione o perfil do usuário."
      listHref="/usuarios"
    >
      <UsuarioForm />
    </CadastroFormPage>
  );
}
