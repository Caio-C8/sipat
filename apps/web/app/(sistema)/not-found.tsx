import { SystemState } from "@/components/shared/system-state";

export default function SistemaNotFound() {
  return (
    <SystemState
      title="Conteúdo não encontrado"
      description="O conteúdo pode ter sido removido ou o endereço informado não corresponde a um registro disponível."
      variant="naoEncontrado"
    />
  );
}
