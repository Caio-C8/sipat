import type { ReactNode } from "react";
import Link from "next/link";
import { obterIdentidadeAtual } from "@/lib/auth/server-session";

export default async function SetoresLayout({
  children,
}: {
  children: ReactNode;
}) {
  const identidade = await obterIdentidadeAtual();
  if (!identidade) return null;
  if (identidade.perfil !== "ADMINISTRADOR") {
    return (
      <main className="p-7">
        <h1 className="text-2xl font-bold text-[#19355d]">
          Acesso não permitido
        </h1>
        <p role="alert" className="mt-3">
          Somente o Administrador pode gerenciar setores.
        </p>
        <Link href="/dashboard" className="mt-4 inline-block underline">
          Voltar à visão geral
        </Link>
      </main>
    );
  }
  return children;
}
