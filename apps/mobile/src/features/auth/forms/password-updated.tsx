import { useRouter, type Href } from "expo-router";
import { Lucide } from "@react-native-vector-icons/lucide";
import { StyleSheet, Text, View } from "react-native";
import { AuthCard, AuthScreen } from "./auth-screen";
import { PrimaryButton } from "./form-controls";
import { useSession } from "../session/session-context";
import { mobileAuth, radii, spacing } from "../../../theme/tokens";

export function PasswordUpdated() {
  const router = useRouter();
  const { manager } = useSession();
  function continueToApp() {
    manager.acknowledgeFirstAccessCompletion();
    router.replace("/" as Href);
  }
  return (
    <AuthScreen centered>
      <AuthCard centered>
        <View style={styles.successIcon}>
          <Lucide
            accessible={false}
            color={mobileAuth.success}
            name="check"
            size={28}
          />
        </View>
        <Text accessibilityRole="header" style={styles.title}>
          Senha atualizada
        </Text>
        <Text style={styles.description}>
          Seu primeiro acesso foi concluído.
        </Text>
        <Text style={styles.guidance}>
          Use sua nova senha nos próximos acessos,{"\n"}no computador ou no
          celular.
        </Text>
        <PrimaryButton label="Continuar para o SIPAT" onPress={continueToApp} />
        <Text style={styles.accountHint}>
          Sua conta e seu perfil continuam os mesmos.
        </Text>
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
  title: {
    color: mobileAuth.text,
    fontSize: 24,
    fontWeight: "800",
    lineHeight: 30,
    marginTop: spacing.xxl,
    textAlign: "center",
  },
  description: {
    color: mobileAuth.text,
    fontSize: 13,
    lineHeight: 19,
    marginTop: spacing.lg,
    textAlign: "center",
  },
  guidance: {
    color: mobileAuth.textMuted,
    fontSize: 12,
    lineHeight: 19,
    marginTop: spacing.xxl,
    textAlign: "center",
  },
  accountHint: {
    color: mobileAuth.textSubtle,
    fontSize: 10,
    lineHeight: 15,
    marginTop: spacing.xxl,
    textAlign: "center",
  },
});
