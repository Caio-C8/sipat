import type { Metadata } from "next";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { NovoPedido } from "@/features/manutencoes/components/novo-pedido";

export const metadata: Metadata = { title: "Novo pedido de manutenção" };
export default function NovoPedidoPage() {
  return (
    <main className="grid min-w-0 gap-5 bg-[#f7f9fc] p-4 text-[#19355d] sm:p-6 lg:p-7">
      <PageHeader
        title="Novo pedido de manutenção"
        description="Inclua os bens, configure cada atendimento e confirme os dados do pedido."
        actions={
          <Link
            href="/manutencoes"
            className="inline-flex items-center gap-1 text-sm font-semibold text-[#526580] hover:text-[#19355d] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2863ec]"
          >
            <ChevronLeft aria-hidden="true" className="size-4" /> Voltar à lista
          </Link>
        }
      />
      <NovoPedido />
    </main>
  );
}
