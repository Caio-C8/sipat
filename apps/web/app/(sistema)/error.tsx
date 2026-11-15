"use client";

import { useEffect } from "react";
import { SystemState } from "@/components/shared/system-state";

export default function SistemaError({
  error,
  reset,
}: Readonly<{ error: Error & { digest?: string }; reset: () => void }>) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <SystemState
      title="Não foi possível abrir esta página"
      description="Tente carregar o conteúdo novamente. Se o problema continuar, volte e escolha outra opção."
      variant="erro"
      retry={reset}
    />
  );
}
