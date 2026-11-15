import { SystemState } from "./system-state";

export function AccessDenied({
  description = "Seu perfil não possui permissão para acessar esta página.",
}: Readonly<{
  description?: string;
}>) {
  return (
    <SystemState
      title="Acesso não permitido"
      description={`${description} Volte à página anterior ou acesse o Início para continuar.`}
      variant="acesso"
    />
  );
}
