"use client";

import type { ProcessoCompraDetalhe } from "@repo/contracts";
import { RouteModal } from "@/components/shared/route-modal";
import { useRouteModalNavigation } from "@/components/shared/use-route-modal-navigation";
import { FormularioProcesso } from "./processo-compra-form";

export function ProcessoCompraRouteModal({
  registro,
}: {
  registro?: ProcessoCompraDetalhe;
}) {
  const navigation = useRouteModalNavigation();
  return (
    <RouteModal
      title={
        registro ? "Editar processo de compra" : "Cadastrar processo de compra"
      }
      description="Informe os dados do processo e preserve os documentos fiscais vinculados."
      onClose={navigation.close}
      contentClassName="max-w-5xl"
    >
      <FormularioProcesso
        registro={registro}
        contexto="modal"
        onCancelar={navigation.close}
        onSucesso={navigation.success}
      />
    </RouteModal>
  );
}
