import type { Metadata } from "next";
import Link from "next/link";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { UsuarioForm } from "@/features/usuarios/components/usuario-form";
import { serverUsuarioOperations } from "@/features/usuarios/api/server-usuario-operations";
import { obterIdentidadeAtual } from "@/lib/auth/server-session";
import { isApiError } from "@/lib/api/core/api-error";

export const metadata: Metadata = { title: "Editar usuário" };

export default async function EditarUsuarioPage({
  params,
}: {
  params: Promise<{ usuarioId: string }>;
}) {
  const identidade = await obterIdentidadeAtual();
  if (!identidade || identidade.perfil !== "ADMINISTRADOR")
    redirect("/dashboard");

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
        <Link
          href="/usuarios"
          className="inline-flex items-center gap-1 text-sm font-semibold"
        >
          <ChevronLeft className="size-4" /> Voltar aos usuários
        </Link>
        <h1 className="text-2xl font-bold">Editar usuário</h1>
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
      <header>
        <Link
          href={`/usuarios/${usuarioId}`}
          className="mb-3 inline-flex items-center gap-1 text-sm font-semibold text-[#526b8c]"
        >
          <ChevronLeft className="size-4" /> Voltar à consulta
        </Link>
        <h1 className="text-2xl font-bold text-[#111d34] sm:text-3xl">
          Editar usuário
        </h1>
        <p className="mt-1 text-sm text-[#7188a5]">
          Atualize os dados e o perfil de acesso.
        </p>
      </header>
      <UsuarioForm usuario={resultado.resposta.dados} />
    </main>
  );
}
