import { useRef, useState, type ComponentRef } from "react";
import { useRouter, type Href } from "expo-router";
import { MobileConcluirPrimeiroAcessoBodySchema } from "@repo/contracts";
import type { TextInput } from "react-native";
import { useSession } from "../session/session-context";
import { AuthScreen } from "./auth-screen";
import { FormAlert, FormField, PrimaryButton } from "./form-controls";
import {
  authErrorMessage,
  mapApiFieldErrors,
  mapZodErrors,
  type FieldErrors,
} from "./form-errors";

export function FirstAccessForm() {
  const router = useRouter();
  const { manager, state } = useSession();
  const confirmationRef = useRef<ComponentRef<typeof TextInput>>(null);
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [pending, setPending] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [generalError, setGeneralError] = useState<string | null>(null);
  const name = state.status === "authenticated" ? state.identity.nome : "";

  async function submit() {
    const result = MobileConcluirPrimeiroAcessoBodySchema.safeParse({
      novaSenha: password,
      confirmacaoNovaSenha: confirmation,
    });
    if (!result.success) {
      setErrors(mapZodErrors(result.error));
      setGeneralError("Revise os campos destacados.");
      return;
    }
    setPending(true);
    setErrors({});
    setGeneralError(null);
    setPassword("");
    setConfirmation("");
    try {
      await manager.completeFirstAccess(result.data);
      router.replace("/senha-atualizada" as Href);
    } catch (error) {
      setErrors(mapApiFieldErrors(error));
      setGeneralError(authErrorMessage(error));
      setPending(false);
    }
  }

  return (
    <AuthScreen
      title="Crie sua nova senha"
      description={`${name ? `${name}, ` : ""}por segurança, substitua a senha inicial antes de continuar.`}
    >
      {generalError ? <FormAlert>{generalError}</FormAlert> : null}
      <FormField
        autoComplete="new-password"
        editable={!pending}
        error={errors.novaSenha}
        label="Nova senha"
        maxLength={128}
        onChangeText={setPassword}
        onSubmitEditing={() => confirmationRef.current?.focus()}
        password
        returnKeyType="next"
        value={password}
      />
      <FormField
        autoComplete="new-password"
        editable={!pending}
        error={errors.confirmacaoNovaSenha}
        inputRef={confirmationRef}
        label="Confirmar nova senha"
        maxLength={128}
        onChangeText={setConfirmation}
        onSubmitEditing={() => void submit()}
        password
        returnKeyType="done"
        value={confirmation}
      />
      <PrimaryButton
        label="Salvar nova senha e continuar"
        onPress={() => void submit()}
        pending={pending}
      />
      <PrimaryButton
        label="Sair"
        onPress={() => void manager.logout()}
        disabled={pending}
      />
    </AuthScreen>
  );
}
