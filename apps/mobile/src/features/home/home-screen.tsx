import { FoundationScreen } from "../../components/shared/foundation-screen";
import { PrimaryButton } from "../auth/forms/form-controls";
import { useSession } from "../auth/session/session-context";

export function HomeScreen() {
  const { manager, state } = useSession();
  const name = state.status === "authenticated" ? state.identity.nome : "";

  return (
    <FoundationScreen
      description={
        name
          ? `Olá, ${name}. Sua sessão está ativa. Esta home ainda não possui conteúdo patrimonial.`
          : "Sua sessão está ativa. Esta home ainda não possui conteúdo patrimonial."
      }
      title="Início"
    >
      <PrimaryButton label="Sair" onPress={() => void manager.logout()} />
    </FoundationScreen>
  );
}
