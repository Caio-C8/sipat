import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { usePathname } from "expo-router";
import { publicAppConfig } from "../../../config/public-app-config";
import { shouldBypassSessionGate } from "../../../lib/navigation/check-access";
import { colors, spacing, typography } from "../../../theme/tokens";
import { useSession } from "./session-context";

export function SessionGate({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const pathname = usePathname();
  const { manager, state } = useSession();

  if (shouldBypassSessionGate(pathname, publicAppConfig.environment)) {
    return children;
  }

  if (state.status === "restoring") {
    return (
      <View accessibilityLabel="Restaurando sessão" style={styles.center}>
        <ActivityIndicator color={colors.primary} size="large" />
        <Text style={styles.text}>Restaurando sessão segura…</Text>
      </View>
    );
  }

  if (state.status === "temporarily-unavailable") {
    return (
      <View style={styles.center}>
        <Text accessibilityRole="header" style={styles.title}>
          API indisponível
        </Text>
        <Text style={styles.text}>
          Sua credencial foi preservada. Verifique a conexão e tente novamente.
        </Text>
        <Pressable
          accessibilityRole="button"
          onPress={() => void manager.restore()}
          style={styles.button}
        >
          <Text style={styles.buttonText}>Tentar novamente</Text>
        </Pressable>
      </View>
    );
  }

  if (state.status === "storage-error") {
    return (
      <View style={styles.center}>
        <Text accessibilityRole="header" style={styles.title}>
          Armazenamento seguro indisponível
        </Text>
        <Text style={styles.text}>
          Não foi possível acessar a credencial protegida neste dispositivo.
        </Text>
        <Pressable
          accessibilityRole="button"
          onPress={() => void manager.restore()}
          style={styles.button}
        >
          <Text style={styles.buttonText}>Tentar novamente</Text>
        </Pressable>
      </View>
    );
  }

  return children;
}

const styles = StyleSheet.create({
  center: {
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
    padding: spacing.xxl,
  },
  title: {
    color: colors.text,
    fontSize: 22,
    fontWeight: "800",
    textAlign: "center",
  },
  text: {
    color: colors.textMuted,
    fontSize: typography.body,
    lineHeight: typography.bodyLineHeight,
    marginTop: spacing.md,
    maxWidth: 480,
    textAlign: "center",
  },
  button: {
    backgroundColor: colors.primary,
    borderRadius: 10,
    marginTop: spacing.xl,
    minHeight: 48,
    justifyContent: "center",
    paddingHorizontal: spacing.xl,
  },
  buttonText: { color: colors.primaryContrast, fontWeight: "700" },
});
