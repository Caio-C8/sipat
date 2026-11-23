"use client";

import type { InventarioDetalhe } from "@repo/contracts";
import { useRouter } from "next/navigation";
import { RouteModal } from "@/components/shared/route-modal";
import { InventarioForm } from "./inventario-form";

export function InventarioRouteModal({
  inventario,
}: {
  inventario?: InventarioDetalhe;
}) {
  const router = useRouter();
  const fechar = () => router.back();
  return (
    <RouteModal
      title={inventario ? "Editar inventário" : "Abrir inventário"}
      description={
        inventario
          ? "Atualize os dados enquanto a conferência ainda não foi iniciada."
          : "Identifique o inventário e escolha a comissão responsável."
      }
      onClose={fechar}
    >
      <InventarioForm inventario={inventario} onCancel={fechar} />
    </RouteModal>
  );
}
