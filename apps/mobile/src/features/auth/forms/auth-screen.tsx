import type { PropsWithChildren } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { layout, mobileAuth, radii, spacing } from "../../../theme/tokens";

export function AuthScreen({
  eyebrow,
  title,
  description,
  children,
  supportingText,
  centered = false,
}: Readonly<
  PropsWithChildren<{
    eyebrow?: string;
    title?: string;
    description?: string;
    supportingText?: string;
    centered?: boolean;
  }>
>) {
  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={styles.flex}
    >
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
      >
        <View style={[styles.main, centered && styles.mainCentered]}>
          {title ? (
            <View style={styles.heading}>
              {eyebrow ? <Text style={styles.eyebrow}>{eyebrow}</Text> : null}
              <Text accessibilityRole="header" style={styles.title}>
                {title}
              </Text>
              {description ? (
                <Text style={styles.description}>{description}</Text>
              ) : null}
            </View>
          ) : null}
          {children}
          {supportingText ? (
            <Text style={styles.supportingText}>{supportingText}</Text>
          ) : null}
        </View>
        <View
          accessible
          accessibilityLabel="Câmara Municipal de Patos de Minas, Sistema de Gestão Patrimonial"
          style={styles.footer}
        >
          <Text style={styles.footerText}>
            Câmara Municipal de Patos de Minas
          </Text>
          <Text style={styles.footerText}>Sistema de Gestão Patrimonial</Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  scroll: {
    backgroundColor: mobileAuth.canvas,
    flexGrow: 1,
    paddingBottom: spacing.xl,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xxl,
  },
  main: {
    alignSelf: "center",
    maxWidth: Math.min(layout.contentMaxWidth, 480),
    width: "100%",
  },
  mainCentered: { flexGrow: 1, justifyContent: "center" },
  card: {
    backgroundColor: mobileAuth.card,
    borderColor: mobileAuth.border,
    borderRadius: radii.lg,
    borderWidth: 1,
    padding: spacing.lg,
  },
  cardCentered: {
    justifyContent: "center",
    minHeight: 456,
    paddingHorizontal: spacing.xl,
  },
  heading: { marginBottom: spacing.xl },
  eyebrow: {
    color: mobileAuth.information,
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.35,
    marginBottom: spacing.sm,
    textTransform: "uppercase",
  },
  title: {
    color: mobileAuth.text,
    fontSize: 26,
    fontWeight: "800",
    lineHeight: 32,
  },
  description: {
    color: mobileAuth.textMuted,
    fontSize: 14,
    lineHeight: 20,
    marginTop: spacing.xs,
  },
  supportingText: {
    color: mobileAuth.textMuted,
    fontSize: 11,
    lineHeight: 16,
    marginTop: spacing.lg,
    textAlign: "center",
  },
  footer: {
    alignItems: "center",
    marginTop: "auto",
    paddingTop: spacing.xxxl,
  },
  footerText: {
    color: mobileAuth.textSubtle,
    fontSize: 10,
    lineHeight: 16,
    textAlign: "center",
  },
});

export function AuthCard({
  children,
  centered = false,
}: Readonly<PropsWithChildren<{ centered?: boolean }>>) {
  return (
    <View style={[styles.card, centered && styles.cardCentered]}>
      {children}
    </View>
  );
}
