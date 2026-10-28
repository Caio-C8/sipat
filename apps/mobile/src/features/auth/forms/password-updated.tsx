import { useRouter, type Href } from "expo-router";
import { AuthScreen } from "./auth-screen";
import { PrimaryButton } from "./form-controls";
import { useSession } from "../session/session-context";

export function PasswordUpdated() {
  const router = useRouter();
  const { manager } = useSession();
  function continueToApp() {
    manager.acknowledgeFirstAccessCompletion();
    router.replace("/" as Href);
  }
  return (
    <AuthScreen
      title="Senha atualizada"
      description="Sua nova senha foi salva e a sessão segura foi renovada."
    >
      <PrimaryButton label="Continuar para o SIPAT" onPress={continueToApp} />
    </AuthScreen>
  );
}
