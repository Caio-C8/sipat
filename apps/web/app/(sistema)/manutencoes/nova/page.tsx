import type { Metadata } from "next";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { NovoPedido } from "@/features/manutencoes/components/novo-pedido";

export const metadata: Metadata = { title: "Novo pedido de manutenção" };
export default function NovoPedidoPage() {
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
          Novo pedido de manutenção
        </h1>
        <p className="mt-1 text-sm text-[#526580]">
          Inclua os bens, configure cada atendimento e confirme os dados do
          pedido.
        </p>
      </header>
      <NovoPedido />
    </main>
  );
}
