import Link from "next/link";
import type { Metadata } from "next";
import { headers } from "next/headers";
import { PatrimonioParamsSchema } from "@repo/contracts";
import { exigirIdentidadeAtual } from "@/lib/auth/server-session";
import { NovaMovimentacao } from "@/features/movimentacoes/components/nova-movimentacao";
import { serverPatrimonioOperations } from "@/features/patrimonios/api/server-patrimonio-operations";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
export const metadata: Metadata = { title: "Nova movimentação" };
export default async function NovaMovimentacaoPage({
  searchParams,
}: {
  searchParams: Promise<{ patrimonioId?: string }>;
}) {
  const identidade = await exigirIdentidadeAtual();
  if (identidade.perfil !== "DIRETOR_PATRIMONIO")
    return (
      <main className="grid gap-5 p-7">
        <PageHeader
          title="Acesso não permitido"
          description="Somente o Diretor de Patrimônio pode registrar movimentações."
          actions={
            <Button asChild variant="outline">
              <Link prefetch={false} href="/movimentacoes">
                Consultar movimentações
              </Link>
            </Button>
          }
        />
        <p role="alert" className="mt-3">
          Somente o Diretor de Patrimônio pode registrar movimentações.
        </p>
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
