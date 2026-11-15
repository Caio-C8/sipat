import { SystemState } from "@/components/shared/system-state";

export default function NotFound() {
  return (
    <SystemState
      title="Página não encontrada"
      description="Confira o endereço informado ou use uma das opções abaixo para continuar."
      variant="naoEncontrado"
    />
  );
}
