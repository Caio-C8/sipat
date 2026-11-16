import type { Metadata } from "next";
import Link from "next/link";
import { headers } from "next/headers";
import { ChevronLeft } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { UsuarioForm } from "@/features/usuarios/components/usuario-form";
import { serverUsuarioOperations } from "@/features/usuarios/api/server-usuario-operations";
import { AccessDenied } from "@/components/shared/access-denied";
import { exigirIdentidadeAtual } from "@/lib/auth/server-session";
import { isApiError } from "@/lib/api/core/api-error";

export const metadata: Metadata = { title: "Editar usuário" };

export default async function EditarUsuarioPage({
  params,
}: {
  params: Promise<{ usuarioId: string }>;
}) {
  const identidade = await exigirIdentidadeAtual();
  if (identidade.perfil !== "ADMINISTRADOR") {
    return (
      <AccessDenied description="Somente o Administrador pode editar usuários." />
    );
  }

  const { usuarioId } = await params;

  const resultado = await (async () => {
    try {
      const resposta = await serverUsuarioOperations.consultar(usuarioId, {
        cookie: (await headers()).get("cookie") ?? "",
      });
      return { tipo: "sucesso" as const, resposta };
    } catch (falha) {
      return {
        tipo: "erro" as const,
        mensagem: isApiError(falha)
          ? falha.message
          : "Não foi possível consultar este usuário.",
      };
    }
  })();

  if (resultado.tipo === "erro") {
    return (
      <main className="mx-auto grid max-w-[1400px] gap-4 px-4 py-6 text-[#17253d] sm:px-7">
        <PageHeader
          title="Editar usuário"
          description="Não foi possível carregar os dados deste usuário."
          actions={
            <Link
              href="/usuarios"
              className="inline-flex items-center gap-1 text-sm font-semibold"
            >
              <ChevronLeft className="size-4" /> Voltar aos usuários
            </Link>
          }
        />
        <p
          role="alert"
          className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-900"
        >
          {resultado.mensagem}
        </p>
      </main>
    );
  }

  return (
    <main className="mx-auto grid w-full max-w-[1400px] gap-5 px-4 py-5 text-[#17253d] sm:px-7 sm:py-6">
      <PageHeader
        title="Editar usuário"
        description="Atualize os dados e o perfil de acesso."
        actions={
          <Link
            href={`/usuarios/${usuarioId}`}
            className="inline-flex items-center gap-1 text-sm font-semibold text-[#526b8c]"
          >
            <ChevronLeft className="size-4" /> Voltar à consulta
          </Link>
        }
      />
      <UsuarioForm usuario={resultado.resposta.dados} />
    </main>
  );
}
