import { SystemState } from "@/components/shared/system-state";

export function SessionUnavailable() {
  return (
    <SystemState
      title="Não foi possível verificar sua sessão"
      description="O SIPAT está temporariamente indisponível. Sua sessão continua preservada. Aguarde um momento e tente novamente."
      variant="indisponivel"
      retryHref="/"
    />
  );
}
