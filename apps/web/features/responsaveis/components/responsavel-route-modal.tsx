"use client";

import type { ResponsavelDetalhe } from "@repo/contracts";
import { RouteModal } from "@/components/shared/route-modal";
import { useRouteModalNavigation } from "@/components/shared/use-route-modal-navigation";
import { FormularioResponsavel } from "./responsavel-form";

export function ResponsavelRouteModal({
  registro,
}: {
  registro?: ResponsavelDetalhe;
}) {
  const navigation = useRouteModalNavigation();
  return (
    <RouteModal
      title={registro ? "Editar responsável" : "Cadastrar responsável"}
      description="Informe a matrícula e o nome do funcionário responsável."
      onClose={navigation.close}
    >
      <FormularioResponsavel
        registro={registro}
        contexto="modal"
        onCancelar={navigation.close}
        onSucesso={navigation.success}
      />
    </RouteModal>
  );
}
