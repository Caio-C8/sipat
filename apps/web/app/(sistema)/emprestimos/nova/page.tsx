import type { Metadata } from "next";
import Link from "next/link";
import { exigirIdentidadeAtual } from "@/lib/auth/server-session";
import { NovoEmprestimo } from "@/features/emprestimos/components/novo-emprestimo";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
export const metadata: Metadata = { title: "Novo empréstimo" };
export default async function NovoEmprestimoPage() {
  const identidade = await exigirIdentidadeAtual();
  if (identidade.perfil !== "DIRETOR_PATRIMONIO")
    return (
      <main className="grid gap-5 p-4 sm:p-7">
        <PageHeader
          title="Acesso não permitido"
          description="Somente o Diretor de Patrimônio pode registrar empréstimos."
          actions={
            <Button asChild variant="outline">
              <Link href="/emprestimos">Consultar empréstimos</Link>
            </Button>
          }
        />
        <p role="alert" className="mt-3">
          Somente o Diretor de Patrimônio pode registrar empréstimos.
        </p>
      </main>
    );
  return (
    <NovoEmprestimo
      usuario={{ nome: identidade.nome, perfil: identidade.perfil }}
    />
  );
}
