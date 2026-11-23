"use client";

import type { EspecieDetalhe } from "@repo/contracts";
import { RouteModal } from "@/components/shared/route-modal";
import { useRouteModalNavigation } from "@/components/shared/use-route-modal-navigation";
import { FormularioEspecie } from "./especie-form";

export function EspecieRouteModal({ registro }: { registro?: EspecieDetalhe }) {
  const navigation = useRouteModalNavigation();
  return (
    <RouteModal
      title={registro ? "Editar espécie" : "Cadastrar espécie"}
      description="Informe os dados da espécie e selecione sua natureza."
      onClose={navigation.close}
    >
      <FormularioEspecie
        registro={registro}
        contexto="modal"
        onCancelar={navigation.close}
        onSucesso={navigation.success}
      />
    </RouteModal>
  );
}
