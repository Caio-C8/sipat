import type { Metadata } from "next";
import { headers } from "next/headers";
import Link from "next/link";
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
    <main className="grid min-w-0 gap-4 p-4 text-[#19355d] sm:p-7">
      <Link href="/manutencoes" className="justify-self-start underline">
        Voltar aos pedidos
      </Link>
      <h1 className="text-2xl font-bold">Detalhe da manutenção</h1>
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
