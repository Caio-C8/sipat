"use client";

import type { InventarioDetalhe } from "@repo/contracts";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { InventarioForm } from "./inventario-form";

export function InventarioRouteModal({
  inventario,
}: {
  inventario?: InventarioDetalhe;
}) {
  const router = useRouter();
  const fechar = () => router.back();
  return (
    <Dialog open onOpenChange={(aberto) => !aberto && fechar()}>
      <DialogContent
        className="max-h-[min(92vh,52rem)] max-w-2xl overflow-y-auto"
        closeDisabled={false}
      >
        <DialogHeader>
          <DialogTitle>
            {inventario ? "Editar inventário" : "Abrir inventário"}
          </DialogTitle>
          <DialogDescription>
            {inventario
              ? "Atualize os dados enquanto a conferência ainda não foi iniciada."
              : "Identifique o inventário e escolha a comissão responsável."}
          </DialogDescription>
        </DialogHeader>
        <InventarioForm inventario={inventario} onCancel={fechar} />
      </DialogContent>
    </Dialog>
  );
}
