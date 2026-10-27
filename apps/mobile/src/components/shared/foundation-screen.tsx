import type { PropsWithChildren } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { colors, layout, spacing, typography } from "../../theme/tokens";

type FoundationScreenProps = PropsWithChildren<{
  description: string;
  title: string;
}>;

export function FoundationScreen({
  children,
  description,
  title,
}: Readonly<FoundationScreenProps>) {
  return (
    <ScrollView
      contentContainerStyle={styles.scrollContent}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.content}>
        <Text accessibilityRole="header" style={styles.title}>
          {title}
        </Text>
        <Text style={styles.description}>{description}</Text>
        {children}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    padding: spacing.lg,
  },
  content: {
    alignSelf: "center",
    maxWidth: layout.contentMaxWidth,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxxl,
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
    marginTop: spacing.md,
    maxWidth: 680,
  },
});
