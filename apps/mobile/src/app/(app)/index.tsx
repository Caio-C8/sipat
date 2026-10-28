import { FoundationScreen } from "../../components/shared/foundation-screen";
import { PrimaryButton } from "../../features/auth/forms/form-controls";
import { useSession } from "../../features/auth/session/session-context";

export default function HomeScreen() {
  const { manager, state } = useSession();
  const name = state.status === "authenticated" ? state.identity.nome : "";
  return (
    <FoundationScreen
      description={
        name
          ? `Sessão autenticada de ${name}. O conteúdo de domínio será entregue em MOBILE-HOME-001.`
          : "Sessão autenticada."
      }
      title="SIPAT"
    >
      <PrimaryButton label="Sair" onPress={() => void manager.logout()} />
    </FoundationScreen>
  );
}
