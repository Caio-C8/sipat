"use client";

import type { ComissaoDetalhe } from "@repo/contracts";
import { RouteModal } from "@/components/shared/route-modal";
import { useRouteModalNavigation } from "@/components/shared/use-route-modal-navigation";
import { FormularioComissao } from "./comissao-form";

export function ComissaoRouteModal({
  registro,
}: {
  registro?: ComissaoDetalhe;
}) {
  const navigation = useRouteModalNavigation();
  return (
    <RouteModal
      title={registro ? "Editar comissão" : "Cadastrar comissão"}
      description="Informe vigência, ato de designação e integrantes."
      onClose={navigation.close}
      contentClassName="max-w-4xl"
    >
      <FormularioComissao
        registro={registro}
        contexto="modal"
        onCancelar={navigation.close}
        onSucesso={navigation.success}
      />
    </RouteModal>
  );
}
