"use client";

import type { FornecedorDetalhe } from "@repo/contracts";
import { RouteModal } from "@/components/shared/route-modal";
import { useRouteModalNavigation } from "@/components/shared/use-route-modal-navigation";
import { FormularioFornecedor } from "./fornecedor-form";

export function FornecedorRouteModal({
  registro,
}: {
  registro?: FornecedorDetalhe;
}) {
  const navigation = useRouteModalNavigation();
  return (
    <RouteModal
      title={registro ? "Editar fornecedor" : "Cadastrar fornecedor"}
      description="Informe os dados cadastrais e revise os campos antes de salvar."
      onClose={navigation.close}
    >
      <FormularioFornecedor
        registro={registro}
        contexto="modal"
        onCancelar={navigation.close}
        onSucesso={navigation.success}
      />
    </RouteModal>
  );
}
