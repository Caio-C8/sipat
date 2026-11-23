"use client";

import type { UsuarioDetalhe } from "@repo/contracts";
import { useRouter } from "next/navigation";
import { RouteModal } from "@/components/shared/route-modal";
import { SituacaoUsuario, UsuarioForm } from "./usuario-form";

export function UsuarioRouteModal({ usuario }: { usuario?: UsuarioDetalhe }) {
  const router = useRouter();
  const close = () => router.back();
  const success = () => {
    router.refresh();
    router.back();
  };
  return (
    <RouteModal
      title={usuario ? "Editar usuário" : "Cadastrar usuário"}
      description="Informe os dados de acesso e revise o perfil selecionado."
      onClose={close}
    >
      <UsuarioForm
        usuario={usuario}
        contexto="modal"
        onCancelar={close}
        onSucesso={success}
      />
      {usuario ? <SituacaoUsuario usuario={usuario} /> : null}
    </RouteModal>
  );
}
