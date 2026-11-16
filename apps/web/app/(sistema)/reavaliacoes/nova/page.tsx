import type { Metadata } from "next";
import Link from "next/link";
import { headers } from "next/headers";
import { PatrimonioParamsSchema } from "@repo/contracts";
import { exigirIdentidadeAtual } from "@/lib/auth/server-session";
import { NovaReavaliacao } from "@/features/reavaliacoes/components/nova-reavaliacao";
import { serverPatrimonioOperations } from "@/features/patrimonios/api/server-patrimonio-operations";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "Nova reavaliação" };

export default async function NovaReavaliacaoPage({
  searchParams,
}: {
  searchParams: Promise<{ patrimonioId?: string }>;
}) {
  const identidade = await exigirIdentidadeAtual();
  if (identidade.perfil !== "DIRETOR_PATRIMONIO") {
    return (
      <main className="grid gap-5 p-4 sm:p-7">
        <PageHeader
          title="Acesso não permitido"
          description="Somente o Diretor de Patrimônio pode registrar reavaliações."
          actions={
            <Button asChild variant="outline">
              <Link prefetch={false} href="/reavaliacoes">
                Consultar reavaliações
              </Link>
            </Button>
          }
        />
        <p role="alert" className="mt-3">
          Somente o Diretor de Patrimônio pode registrar reavaliações.
        </p>
      </main>
    );
  }
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
    <NovaReavaliacao
      usuarioId={identidade.id}
      patrimonioInicial={patrimonioInicial}
    />
  );
}
