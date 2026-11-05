import type { Metadata } from "next";
import Link from "next/link";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { ChevronLeft, Pencil, ShieldCheck, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { serverUsuarioOperations } from "@/features/usuarios/api/server-usuario-operations";
import { SituacaoUsuario, perfilLabel } from "@/features/usuarios/components/usuario-form";
import { obterIdentidadeAtual } from "@/lib/auth/server-session";
import { isApiError } from "@/lib/api/core/api-error";

export const metadata: Metadata = { title: "Consultar usuário" };
const cartao = "rounded-lg border border-[#dfe7f1] bg-white p-5 sm:p-6";

export default async function UsuarioDetalhePage({ params }: { params: Promise<{ usuarioId: string }> }) {
  const identidade = await obterIdentidadeAtual();
  if (!identidade || identidade.perfil !== "ADMINISTRADOR") redirect("/dashboard");
  const { usuarioId } = await params;
  let usuario;
  let erro = "";
  try {
    const resposta = await serverUsuarioOperations.consultar(usuarioId, { cookie: (await headers()).get("cookie") ?? "" });
    usuario = resposta.dados;
  } catch (falha) {
    erro = isApiError(falha) ? falha.message : "Não foi possível consultar este usuário.";
  }
  if (!usuario) return <main className="mx-auto grid max-w-[1400px] gap-4 px-4 py-6 text-[#17253d] sm:px-7"><Link href="/usuarios" className="inline-flex items-center gap-1 text-sm font-semibold"><ChevronLeft className="size-4" /> Voltar aos usuários</Link><h1 className="text-2xl font-bold">Consulta de usuário</h1><p role="alert" className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-900">{erro}</p></main>;
  return (
    <main className="mx-auto grid w-full max-w-[1600px] gap-5 px-4 py-5 text-[#17253d] sm:px-7 sm:py-6">
      <header className="flex flex-wrap items-start justify-between gap-3"><div><Link href="/usuarios" className="mb-3 inline-flex items-center gap-1 text-sm font-semibold text-[#526b8c] hover:text-[#203b61]"><ChevronLeft className="size-4" /> Voltar aos usuários</Link><h1 className="text-2xl font-bold text-[#111d34] sm:text-3xl">{usuario.nome}</h1><p className="mt-1 text-sm text-[#7188a5]">Consulte e gerencie o acesso deste usuário.</p></div><Button asChild variant="outline" className="min-h-10 px-4"><Link href={`/usuarios/${usuario.id}/editar`}><Pencil /> Editar usuário</Link></Button></header>
      <section className={cartao} aria-labelledby="dados-usuario"><h2 id="dados-usuario" className="flex items-center gap-2 text-lg font-bold"><UserRound className="size-5 text-[#2863ec]" /> Dados do usuário</h2><dl className="mt-6 grid gap-x-8 gap-y-6 sm:grid-cols-2 lg:grid-cols-3"><div><dt className="text-xs text-[#7188a5]">Nome</dt><dd className="mt-1 font-medium">{usuario.nome}</dd></div><div><dt className="text-xs text-[#7188a5]">E-mail</dt><dd className="mt-1 break-all font-medium">{usuario.email}</dd></div><div><dt className="text-xs text-[#7188a5]">Perfil</dt><dd className="mt-1 font-medium">{perfilLabel(usuario.perfil)}</dd></div><div><dt className="text-xs text-[#7188a5]">Situação</dt><dd className="mt-1"><span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${usuario.ativo ? "bg-[#e9fbf3] text-[#08795c]" : "bg-slate-100 text-slate-600"}`}><span aria-hidden="true">●</span>{usuario.ativo ? "Ativo" : "Inativo"}</span></dd></div><div><dt className="text-xs text-[#7188a5]">Cadastrado em</dt><dd className="mt-1 font-medium">{new Intl.DateTimeFormat("pt-BR", { dateStyle: "medium", timeZone: "America/Sao_Paulo" }).format(new Date(usuario.createdAt))}</dd></div></dl></section>
      <section className={cartao} aria-labelledby="acesso-heading"><h2 id="acesso-heading" className="flex items-center gap-2 text-lg font-bold"><ShieldCheck className="size-5 text-[#2863ec]" /> Acesso e rastreabilidade</h2><p className="mt-5 font-semibold text-[#203b61]">Este usuário utiliza a mesma conta no computador e no celular.</p><p className="mt-3 text-sm text-[#7188a5]">O perfil selecionado define as operações disponíveis. As operações anteriores permanecem associadas ao usuário.</p></section>
      <SituacaoUsuario usuario={usuario} />
    </main>
  );
}
