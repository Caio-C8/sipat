import { useMemo, useRef, useState } from "react";
import { useRouter, type Href } from "expo-router";
import { Lucide } from "@react-native-vector-icons/lucide";
import { SolicitarRedefinicaoSenhaBodySchema } from "@repo/contracts";
import { StyleSheet, Text, View } from "react-native";
import { publicAppConfig } from "../../../config/public-app-config";
import { ApiError } from "../../../lib/api/api-error";
import { createAuthOperations } from "../api/auth-operations";
import { AuthCard, AuthScreen } from "./auth-screen";
import {
  FormAlert,
  FormField,
  PrimaryButton,
  TextAction,
} from "./form-controls";
import {
  mapApiFieldErrors,
  mapZodErrors,
  passwordRecoveryErrorMessage,
  type FieldErrors,
} from "./form-errors";
import { mobileAuth, radii, spacing } from "../../../theme/tokens";

export function ForgotPasswordForm() {
  const router = useRouter();
  const operations = useMemo(
    () =>
      publicAppConfig.apiBaseUrl
        ? createAuthOperations(publicAppConfig.apiBaseUrl)
        : null,
    [],
  );
  const submissionLocked = useRef(false);
  const [email, setEmail] = useState("");
  const [pending, setPending] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [generalError, setGeneralError] = useState<string | null>(null);

  async function submit() {
    if (submissionLocked.current) return;
    const result = SolicitarRedefinicaoSenhaBodySchema.safeParse({ email });
    if (!result.success) {
      setErrors(mapZodErrors(result.error));
      setGeneralError("Revise o e-mail informado.");
      return;
    }

    submissionLocked.current = true;
    setPending(true);
    setErrors({});
    setGeneralError(null);
    try {
      if (!operations) throw new ApiError("network");
      await operations.requestPasswordReset(result.data);
      setSuccess(true);
    } catch (error) {
      submissionLocked.current = false;
      setErrors(mapApiFieldErrors(error));
      setGeneralError(passwordRecoveryErrorMessage(error));
    } finally {
      setPending(false);
    }
  }

  function backToLogin() {
    router.replace("/login" as Href);
  }

  if (success) {
    return (
      <AuthScreen centered>
        <AuthCard centered>
          <View style={styles.successIcon}>
            <Lucide
              accessible={false}
              color={mobileAuth.success}
              name="mail-check"
              size={28}
            />
          </View>
          <Text accessibilityRole="header" style={styles.successTitle}>
            Verifique seu e-mail
          </Text>
          <Text accessibilityLiveRegion="polite" style={styles.successText}>
            Se houver uma conta elegível, enviaremos as instruções para
            redefinir a senha.
          </Text>
          <Text style={styles.successGuidance}>
            A nova senha será criada com segurança no navegador.
          </Text>
          <PrimaryButton label="Voltar ao login" onPress={backToLogin} />
        </AuthCard>
      </AuthScreen>
    );
  }

  return (
    <AuthScreen
      eyebrow="Recuperação de acesso"
      title="Recupere sua senha"
      description="Informe seu e-mail institucional para receber as instruções."
      supportingText="Por segurança, a confirmação é a mesma para todas as contas."
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
          onSubmitEditing={() => void submit()}
          placeholder="Digite seu e-mail"
          placeholderTextColor={mobileAuth.textSubtle}
          returnKeyType="send"
          value={email}
        />
        <PrimaryButton
          label="Enviar instruções"
          onPress={() => void submit()}
          pending={pending}
        />
        <TextAction
          accessibilityRole="link"
          disabled={pending}
          label="Voltar ao login"
          onPress={backToLogin}
        />
      </AuthCard>
    </AuthScreen>
  );
}

const styles = StyleSheet.create({
  successIcon: {
    alignItems: "center",
    alignSelf: "center",
    backgroundColor: mobileAuth.successSurface,
    borderRadius: radii.md,
    height: 64,
    justifyContent: "center",
    width: 64,
  },
  successTitle: {
    color: mobileAuth.text,
    fontSize: 24,
    fontWeight: "800",
    lineHeight: 30,
    marginTop: spacing.xxl,
    textAlign: "center",
  },
  successText: {
    color: mobileAuth.text,
    fontSize: 13,
    lineHeight: 20,
    marginTop: spacing.lg,
    textAlign: "center",
  },
  successGuidance: {
    color: mobileAuth.textMuted,
    fontSize: 12,
    lineHeight: 19,
    marginTop: spacing.xxl,
    textAlign: "center",
  },
});
