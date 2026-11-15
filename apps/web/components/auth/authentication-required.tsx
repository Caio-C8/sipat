import { SystemState } from "@/components/shared/system-state";

export function AuthenticationRequired() {
  return (
    <SystemState
      title="Entre para continuar"
      description="Sua sessão não está disponível. Volte à página anterior ou acesse o Início para entrar novamente."
      variant="autenticacao"
    />
  );
}
