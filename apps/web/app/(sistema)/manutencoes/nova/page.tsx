import type { Metadata } from "next";
import Link from "next/link";
import { NovoPedido } from "@/features/manutencoes/components/novo-pedido";

export const metadata: Metadata = { title: "Novo pedido de manutenção" };
export default function NovoPedidoPage() {
  return (
    <main className="grid min-w-0 gap-4 p-4 text-[#19355d] sm:p-7">
      <Link href="/manutencoes" className="justify-self-start underline">
        Voltar aos pedidos
      </Link>
      <h1 className="text-2xl font-bold">Novo pedido de manutenção</h1>
      <NovoPedido />
    </main>
  );
}
