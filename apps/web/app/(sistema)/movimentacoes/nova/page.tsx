import Link from "next/link";
import type { Metadata } from "next";
import { obterIdentidadeAtual } from "@/lib/auth/server-session";
import { NovaMovimentacao } from "@/features/movimentacoes/components/nova-movimentacao";
export const metadata: Metadata = { title: "Nova movimentação" };
export default async function NovaMovimentacaoPage() {
  const identidade = await obterIdentidadeAtual();
  if (!identidade) return null;
  if (identidade.perfil !== "DIRETOR_PATRIMONIO")
    return (
      <main className="p-7">
        <h1 className="text-2xl font-bold text-[#19355d]">
          Acesso não permitido
        </h1>
        <p role="alert" className="mt-3">
          Somente o Diretor de Patrimônio pode registrar movimentações.
        </p>
        <Link
          prefetch={false}
          href="/movimentacoes"
          className="mt-4 inline-block underline"
        >
          Consultar movimentações
        </Link>
      </main>
    );
  return <NovaMovimentacao usuarioId={identidade.id} />;
}
