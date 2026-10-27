import { usePathname, useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import type { AppEnvironment } from "@repo/contracts";
import { appRoutes } from "../../lib/navigation/routes";
import { colors, layout, radii, spacing, typography } from "../../theme/tokens";

export function getDevelopmentCheckBannerCopy(isCheckRoute: boolean) {
  return isCheckRoute
    ? "Ambiente de desenvolvimento — tela de verificação aberta"
    : "Ambiente de desenvolvimento — abrir verificações";
}

export function shouldShowDevelopmentCheckBanner(
  environment: AppEnvironment,
): boolean {
  return environment === "development";
}

export function DevelopmentCheckBanner() {
  const pathname = usePathname();
  const router = useRouter();
  const [focused, setFocused] = useState(false);
  const isCheckRoute = pathname === appRoutes.check;
  const label = getDevelopmentCheckBannerCopy(isCheckRoute);

  return (
    <View style={styles.background}>
      <Pressable
        accessibilityHint={
          isCheckRoute
            ? "Você já está na tela de verificação"
            : "Abre a tela com as verificações do aplicativo"
        }
        accessibilityLabel={label}
        accessibilityRole="link"
        accessibilityState={{ selected: isCheckRoute }}
        focusable
        hitSlop={spacing.xs}
        onBlur={() => setFocused(false)}
        onFocus={() => setFocused(true)}
        onPress={() => {
          if (!isCheckRoute) {
            router.push(appRoutes.check);
          }
        }}
        style={({ pressed }) => [
          styles.action,
          pressed && styles.actionPressed,
          focused && styles.actionFocused,
        ]}
      >
        <Text accessible={false} style={styles.badge}>
          DEV
        </Text>
        <Text accessible={false} style={styles.label}>
          {label}
        </Text>
        <Text accessible={false} style={styles.arrow}>
          {isCheckRoute ? "●" : "›"}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  background: {
    backgroundColor: colors.informationSurface,
  },
  action: {
    alignItems: "center",
    alignSelf: "center",
    borderColor: "transparent",
    borderWidth: 2,
    flexDirection: "row",
    gap: spacing.sm,
    maxWidth: layout.contentMaxWidth,
    minHeight: layout.comfortableTouchTarget,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    width: "100%",
  },
  actionFocused: {
    borderColor: colors.focus,
  },
  actionPressed: {
    backgroundColor: "#d9e9f8",
  },
  badge: {
    backgroundColor: colors.information,
    borderRadius: radii.pill,
    color: colors.primaryContrast,
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.8,
    overflow: "hidden",
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  label: {
    color: colors.information,
    flex: 1,
    flexShrink: 1,
    fontSize: typography.label,
    fontWeight: "700",
    lineHeight: 17,
  },
  arrow: {
    color: colors.information,
    fontSize: 22,
    fontWeight: "700",
  },
});
