import { useRef, useState, type ComponentRef } from "react";
import { Text, type TextInput } from "react-native";
import { MobileLoginBodySchema } from "@repo/contracts";
import { useSession } from "../session/session-context";
import { AuthScreen } from "./auth-screen";
import { FormAlert, FormField, PrimaryButton } from "./form-controls";
import {
  authErrorMessage,
  mapApiFieldErrors,
  mapZodErrors,
  type FieldErrors,
} from "./form-errors";
import { colors, spacing } from "../../../theme/tokens";

export function LoginForm() {
  const { manager } = useSession();
  const passwordRef = useRef<ComponentRef<typeof TextInput>>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [pending, setPending] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [generalError, setGeneralError] = useState<string | null>(null);

  async function submit() {
    const result = MobileLoginBodySchema.safeParse({ email, senha: password });
    if (!result.success) {
      setErrors(mapZodErrors(result.error));
      setGeneralError("Revise os campos destacados.");
      return;
    }
    setPending(true);
    setErrors({});
    setGeneralError(null);
    setPassword("");
    try {
      await manager.login(result.data);
    } catch (error) {
      setErrors(mapApiFieldErrors(error));
      setGeneralError(authErrorMessage(error));
      setPending(false);
    }
  }

  return (
    <AuthScreen
      title="Acesso ao SIPAT"
      description="Entre com a mesma conta institucional usada no SIPAT."
    >
      {generalError ? <FormAlert>{generalError}</FormAlert> : null}
      <FormField
        autoCapitalize="none"
        autoComplete="email"
        editable={!pending}
        error={errors.email}
        inputMode="email"
        label="E-mail institucional"
        maxLength={150}
        onChangeText={setEmail}
        onSubmitEditing={() => passwordRef.current?.focus()}
        returnKeyType="next"
        value={email}
      />
      <FormField
        autoComplete="current-password"
        editable={!pending}
        error={errors.senha}
        inputRef={passwordRef}
        label="Senha"
        maxLength={128}
        onChangeText={setPassword}
        onSubmitEditing={() => void submit()}
        password
        returnKeyType="done"
        value={password}
      />
      <Text style={{ color: colors.textMuted, marginTop: spacing.lg }}>
        A recuperação de senha ainda não está disponível no aplicativo.
      </Text>
      <PrimaryButton
        label="Entrar"
        onPress={() => void submit()}
        pending={pending}
      />
    </AuthScreen>
  );
}
