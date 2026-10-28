import { useRef, useState, type ComponentRef } from "react";
import { StyleSheet, Text, type TextInput } from "react-native";
import { MobileLoginBodySchema } from "@repo/contracts";
import { useSession } from "../session/session-context";
import { AuthCard, AuthScreen } from "./auth-screen";
import {
  FormAlert,
  FormField,
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
      eyebrow="Bem-vindo ao SIPAT"
      title="Acesse sua conta"
      description="Entre para conferir e gerenciar os bens."
      supportingText="Acesso destinado aos usuários autorizados."
    >
      <AuthCard>
        {generalError ? <FormAlert>{generalError}</FormAlert> : null}
        <FormField
          autoCapitalize="none"
          autoComplete="email"
          editable={!pending}
          error={errors.email}
          icon="mail"
          inputMode="email"
          label="E-mail institucional"
          maxLength={150}
          onChangeText={setEmail}
          onSubmitEditing={() => passwordRef.current?.focus()}
          placeholder="Digite seu e-mail"
          placeholderTextColor={mobileAuth.textSubtle}
          returnKeyType="next"
          value={email}
        />
        <FormField
          autoComplete="current-password"
          editable={!pending}
          error={errors.senha}
          icon="lock-keyhole"
          inputRef={passwordRef}
          label="Senha"
          maxLength={128}
          onChangeText={setPassword}
          onSubmitEditing={() => void submit()}
          password
          placeholder="Digite sua senha"
          placeholderTextColor={mobileAuth.textSubtle}
          returnKeyType="done"
          value={password}
        />
        <TextAction
          accessibilityRole="link"
          disabled
          label="Esqueci minha senha"
        />
        <PrimaryButton
          label="Entrar"
          onPress={() => void submit()}
          pending={pending}
        />
        <Text style={styles.accountHint}>
          A mesma conta no computador e no celular.
        </Text>
      </AuthCard>
    </AuthScreen>
  );
}

const styles = StyleSheet.create({
  accountHint: {
    color: mobileAuth.textSubtle,
    fontSize: 10,
    lineHeight: 15,
    marginTop: spacing.lg,
    textAlign: "center",
  },
});
