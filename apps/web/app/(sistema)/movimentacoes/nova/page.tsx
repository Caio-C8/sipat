import Link from "next/link";
import type { Metadata } from "next";
import { headers } from "next/headers";
import { PatrimonioParamsSchema } from "@repo/contracts";
import { obterIdentidadeAtual } from "@/lib/auth/server-session";
import { NovaMovimentacao } from "@/features/movimentacoes/components/nova-movimentacao";
import { serverPatrimonioOperations } from "@/features/patrimonios/api/server-patrimonio-operations";
export const metadata: Metadata = { title: "Nova movimentação" };
export default async function NovaMovimentacaoPage({
  searchParams,
}: {
  searchParams: Promise<{ patrimonioId?: string }>;
}) {
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
  const parametro = PatrimonioParamsSchema.safeParse(await searchParams);
  const patrimonioInicial = parametro.success
    ? (
        await serverPatrimonioOperations.consultar(
          parametro.data.patrimonioId,
          { cookie: (await headers()).get("cookie") ?? "" },
        )
      ).dados
    : undefined;
  return (
    <NovaMovimentacao
      usuarioId={identidade.id}
      usuarioNome={identidade.nome}
      patrimonioInicial={patrimonioInicial}
    />
  );
}
