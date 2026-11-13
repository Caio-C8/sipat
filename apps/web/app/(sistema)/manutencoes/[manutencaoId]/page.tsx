import type { Metadata } from "next";
import { headers } from "next/headers";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { ManutencaoParamsSchema } from "@repo/contracts";
import { DetalhePedido } from "@/features/manutencoes/components/detalhe-pedido";
import { ErroManutencao } from "@/features/manutencoes/components/erro-manutencao";
import { serverManutencaoOperations } from "@/features/manutencoes/api/server-manutencao-operations";

export const metadata: Metadata = { title: "Pedido de manutenção" };
export default async function DetalheManutencaoPage({
  params,
}: {
  params: Promise<{ manutencaoId: string }>;
}) {
  const valores = ManutencaoParamsSchema.safeParse(await params);
  let pedido: Awaited<
    ReturnType<typeof serverManutencaoOperations.consultar>
  > | null = null;
  let erro: unknown = null;
  if (valores.success) {
    try {
      pedido = await serverManutencaoOperations.consultar(
        valores.data.manutencaoId,
        { cookie: (await headers()).get("cookie") ?? "" },
      );
    } catch (e) {
      erro = e;
    }
  }
  return (
    <main className="grid min-w-0 gap-5 bg-[#f7f9fc] p-4 text-[#19355d] sm:p-6 lg:p-7">
      <header>
        <Link
          href="/manutencoes"
          className="mb-4 inline-flex items-center gap-1 text-sm font-semibold text-[#526580] hover:text-[#19355d] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2863ec]"
        >
          <ChevronLeft aria-hidden="true" className="size-4" /> Voltar à lista
        </Link>
        <h1 className="text-2xl font-bold tracking-tight">
          {pedido
            ? `Pedido ${pedido.dados.numeroRequisicao ?? pedido.dados.id}`
            : "Pedido de manutenção"}
        </h1>
        <p className="mt-1 text-sm text-[#526580]">
          Acompanhe os atendimentos, documentos, orçamentos e retornos.
        </p>
      </header>
      {!valores.success ? (
        <div role="alert">Identificador inválido.</div>
      ) : erro ? (
        <ErroManutencao erro={erro} />
      ) : pedido ? (
        <DetalhePedido inicial={pedido.dados} />
      ) : null}
    </main>
  );
}
