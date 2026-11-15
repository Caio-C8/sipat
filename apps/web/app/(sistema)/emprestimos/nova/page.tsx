import type { Metadata } from "next";
import Link from "next/link";
import { exigirIdentidadeAtual } from "@/lib/auth/server-session";
import { NovoEmprestimo } from "@/features/emprestimos/components/novo-emprestimo";
export const metadata: Metadata = { title: "Novo empréstimo" };
export default async function NovoEmprestimoPage() {
  const identidade = await exigirIdentidadeAtual();
  if (identidade.perfil !== "DIRETOR_PATRIMONIO")
    return (
      <main className="p-4 sm:p-7">
        <h1 className="text-2xl font-bold">Acesso não permitido</h1>
        <p role="alert" className="mt-3">
          Somente o Diretor de Patrimônio pode registrar empréstimos.
        </p>
        <Link className="mt-4 inline-block underline" href="/emprestimos">
          Consultar empréstimos
        </Link>
      </main>
    );
  return (
    <NovoEmprestimo
      usuario={{ nome: identidade.nome, perfil: identidade.perfil }}
    />
  );
}
