"use client";

import type { NaturezaDetalhe } from "@repo/contracts";
import { RouteModal } from "@/components/shared/route-modal";
import { useRouteModalNavigation } from "@/components/shared/use-route-modal-navigation";
import { FormularioNatureza } from "./natureza-form";

export function NaturezaRouteModal({
  registro,
}: {
  registro?: NaturezaDetalhe;
}) {
  const navigation = useRouteModalNavigation();
  return (
    <RouteModal
      title={registro ? "Editar natureza" : "Cadastrar natureza"}
      description="Informe o nome e a descrição da natureza patrimonial."
      onClose={navigation.close}
    >
      <FormularioNatureza
        registro={registro}
        contexto="modal"
        onCancelar={navigation.close}
        onSucesso={navigation.success}
      />
    </RouteModal>
  );
}
