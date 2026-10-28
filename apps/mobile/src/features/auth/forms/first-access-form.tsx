import { useRef, useState, type ComponentRef } from "react";
import { useRouter, type Href } from "expo-router";
import { MobileConcluirPrimeiroAcessoBodySchema } from "@repo/contracts";
import { StyleSheet, Text, type TextInput } from "react-native";
import { useSession } from "../session/session-context";
import { AuthCard, AuthScreen } from "./auth-screen";
import {
  FormAlert,
  FormField,
  InformationPanel,
  PrimaryButton,
  TextAction,
} from "./form-controls";
import {
  authErrorMessage,
  mapApiFieldErrors,
  mapZodErrors,
  type FieldErrors,
} from "./form-errors";
import { mobileAuth, spacing } from "../../../theme/tokens";

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
      eyebrow="Primeiro acesso"
      title="Crie sua nova senha"
      description={`${name ? `Olá, ${name}. ` : ""}Falta só esta etapa para entrar.`}
      supportingText="A nova senha vale no computador e no celular."
    >
      <AuthCard>
        <InformationPanel title="Troca obrigatória da senha inicial">
          Crie sua própria senha para liberar o acesso ao SIPAT.
        </InformationPanel>
        {generalError ? <FormAlert>{generalError}</FormAlert> : null}
        <FormField
          autoComplete="new-password"
          editable={!pending}
          error={errors.novaSenha}
          icon="lock-keyhole"
          label="Nova senha"
          maxLength={128}
          onChangeText={setPassword}
          onSubmitEditing={() => confirmationRef.current?.focus()}
          password
          placeholder="Digite sua nova senha"
          placeholderTextColor={mobileAuth.textSubtle}
          returnKeyType="next"
          value={password}
        />
        <FormField
          autoComplete="new-password"
          editable={!pending}
          error={errors.confirmacaoNovaSenha}
          icon="lock-keyhole"
          inputRef={confirmationRef}
          label="Confirmar nova senha"
          maxLength={128}
          onChangeText={setConfirmation}
          onSubmitEditing={() => void submit()}
          password
          placeholder="Digite a senha novamente"
          placeholderTextColor={mobileAuth.textSubtle}
          returnKeyType="done"
          value={confirmation}
        />
        <Text style={styles.passwordHint}>
          Use uma senha diferente da senha inicial.{"\n"}A confirmação deve ser
          igual à nova senha.
        </Text>
        <PrimaryButton
          label="Salvar senha e continuar"
          onPress={() => void submit()}
          pending={pending}
        />
        <TextAction
          disabled={pending}
          label="Sair e voltar ao login"
          onPress={() => void manager.logout()}
        />
      </AuthCard>
    </AuthScreen>
  );
}

const styles = StyleSheet.create({
  passwordHint: {
    color: mobileAuth.textMuted,
    fontSize: 11,
    lineHeight: 17,
    marginTop: spacing.md,
  },
});
