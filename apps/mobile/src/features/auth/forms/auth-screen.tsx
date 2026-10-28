import type { PropsWithChildren } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import {
  colors,
  layout,
  radii,
  spacing,
  typography,
} from "../../../theme/tokens";

export function AuthScreen({
  title,
  description,
  children,
}: Readonly<PropsWithChildren<{ title: string; description: string }>>) {
  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={styles.flex}
    >
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.card}>
          <Text accessibilityRole="header" style={styles.title}>
            {title}
          </Text>
          <Text style={styles.description}>{description}</Text>
          {children}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  scroll: { flexGrow: 1, justifyContent: "center", padding: spacing.lg },
  card: {
    alignSelf: "center",
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radii.lg,
    borderWidth: 1,
    maxWidth: Math.min(layout.contentMaxWidth, 560),
    padding: spacing.xxl,
    width: "100%",
  },
  title: {
    color: colors.text,
    fontSize: 28,
    fontWeight: "800",
    lineHeight: 35,
  },
  description: {
    color: colors.textMuted,
    fontSize: typography.body,
    lineHeight: typography.bodyLineHeight,
    marginTop: spacing.sm,
  },
});
