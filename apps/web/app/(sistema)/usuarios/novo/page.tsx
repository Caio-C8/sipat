import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { UsuarioForm } from "@/features/usuarios/components/usuario-form";
import { obterIdentidadeAtual } from "@/lib/auth/server-session";

export const metadata: Metadata = { title: "Cadastrar usuário" };

export default async function NovoUsuarioPage() {
  const identidade = await obterIdentidadeAtual();
  if (!identidade || identidade.perfil !== "ADMINISTRADOR") redirect("/dashboard");
  return (
    <main className="mx-auto grid w-full max-w-[1400px] gap-5 px-4 py-5 text-[#17253d] sm:px-7 sm:py-6">
      <header><Link href="/usuarios" className="mb-3 inline-flex items-center gap-1 text-sm font-semibold text-[#526b8c] hover:text-[#203b61]"><ChevronLeft className="size-4" /> Voltar aos usuários</Link><h1 className="text-2xl font-bold text-[#111d34] sm:text-3xl">Cadastrar usuário</h1><p className="mt-1 text-sm text-[#7188a5]">Vincule um acesso ao sistema e selecione seu perfil.</p></header>
      <UsuarioForm />
    </main>
  );
}
