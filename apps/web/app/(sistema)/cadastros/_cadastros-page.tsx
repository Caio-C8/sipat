import Link from "next/link";
import {
  CadastrosTelas,
  type SecaoCadastro,
} from "@/features/cadastros/components/cadastros-telas";
import { obterIdentidadeAtual } from "@/lib/auth/server-session";

export async function CadastrosPage({ secao }: { secao: SecaoCadastro }) {
  const identidade = await obterIdentidadeAtual();
  if (!identidade) return null;
  if (secao !== "processos" && identidade.perfil !== "ADMINISTRADOR") {
    return (
      <main className="p-7">
        <h1 className="text-2xl font-bold text-[#19355d]">
          Acesso não permitido
        </h1>
        <p role="alert" className="mt-3">
          Somente o Administrador pode gerenciar este cadastro.
        </p>
        <Link href="/dashboard" className="mt-4 inline-block underline">
          Voltar à visão geral
        </Link>
      </main>
    );
  }
  return <CadastrosTelas secao={secao} />;
}
