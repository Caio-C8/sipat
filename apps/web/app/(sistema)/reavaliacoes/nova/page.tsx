import type { Metadata } from "next";
import Link from "next/link";
import { obterIdentidadeAtual } from "@/lib/auth/server-session";
import { NovaReavaliacao } from "@/features/reavaliacoes/components/nova-reavaliacao";

export const metadata: Metadata = { title: "Nova reavaliação" };

export default async function NovaReavaliacaoPage() {
  const identidade = await obterIdentidadeAtual();
  if (!identidade) return null;
  if (identidade.perfil !== "DIRETOR_PATRIMONIO") {
    return (
      <main className="p-4 sm:p-7">
        <h1 className="text-2xl font-bold">Acesso não permitido</h1>
        <p role="alert" className="mt-3">
          Somente o Diretor de Patrimônio pode registrar reavaliações.
        </p>
        <Link
          prefetch={false}
          href="/reavaliacoes"
          className="mt-4 inline-block underline"
        >
          Consultar reavaliações
        </Link>
      </main>
    );
  }
  return <NovaReavaliacao usuarioId={identidade.id} />;
}
