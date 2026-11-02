import type { Metadata } from "next";
import Link from "next/link";
import { headers } from "next/headers";
import { PatrimonioParamsSchema } from "@repo/contracts";
import { obterIdentidadeAtual } from "@/lib/auth/server-session";
import { NovaReavaliacao } from "@/features/reavaliacoes/components/nova-reavaliacao";
import { serverPatrimonioOperations } from "@/features/patrimonios/api/server-patrimonio-operations";

export const metadata: Metadata = { title: "Nova reavaliação" };

export default async function NovaReavaliacaoPage({
  searchParams,
}: {
  searchParams: Promise<{ patrimonioId?: string }>;
}) {
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
