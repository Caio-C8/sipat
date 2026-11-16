import type { Metadata } from "next";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { UsuarioForm } from "@/features/usuarios/components/usuario-form";
import { AccessDenied } from "@/components/shared/access-denied";
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
    <main className="mx-auto grid w-full max-w-[1400px] gap-5 px-4 py-5 text-[#17253d] sm:px-7 sm:py-6">
      <PageHeader
        title="Cadastrar usuário"
        description="Vincule um acesso ao sistema e selecione seu perfil."
        actions={
          <Link
            href="/usuarios"
            className="inline-flex items-center gap-1 text-sm font-semibold text-[#526b8c] hover:text-[#203b61]"
          >
            <ChevronLeft className="size-4" /> Voltar aos usuários
          </Link>
        }
      />
      <UsuarioForm />
    </main>
  );
}
