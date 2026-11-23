"use client";

import type { SetorDetalhe } from "@repo/contracts";
import { RouteModal } from "@/components/shared/route-modal";
import { useRouteModalNavigation } from "@/components/shared/use-route-modal-navigation";
import { FormularioSetor } from "./setor-form";

export function SetorRouteModal({ registro }: { registro?: SetorDetalhe }) {
  const navigation = useRouteModalNavigation();
  return (
    <RouteModal
      title={registro ? "Editar setor" : "Cadastrar setor"}
      description="Informe o nome, a localização e o responsável pelo setor."
      onClose={navigation.close}
    >
      <FormularioSetor
        registro={registro}
        contexto="modal"
        onCancelar={navigation.close}
        onSucesso={navigation.success}
      />
    </RouteModal>
  );
}
