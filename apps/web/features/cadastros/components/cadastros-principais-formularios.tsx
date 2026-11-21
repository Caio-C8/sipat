"use client";

import type {
  FornecedorDetalhe,
  ResponsavelDetalhe,
  SetorDetalhe,
} from "@repo/contracts";
import { useRouter } from "next/navigation";
import { RouteModal } from "@/components/shared/route-modal";
import { FormularioFornecedor } from "./formulario-fornecedor";
import { FormularioResponsavel, FormularioSetor } from "./formularios-basicos";

function useModalNavigation() {
  const router = useRouter();
  return {
    close: () => router.back(),
    success: () => {
      router.refresh();
      router.back();
    },
  };
}

export function FornecedorRouteModal({
  registro,
}: {
  registro?: FornecedorDetalhe;
}) {
  const navigation = useModalNavigation();
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

export function ResponsavelRouteModal({
  registro,
}: {
  registro?: ResponsavelDetalhe;
}) {
  const navigation = useModalNavigation();
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

export function SetorRouteModal({ registro }: { registro?: SetorDetalhe }) {
  const navigation = useModalNavigation();
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
