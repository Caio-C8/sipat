import { Lucide, type LucideIconName } from "@react-native-vector-icons/lucide";
import type { PerfilUsuario } from "@repo/contracts";
import { usePathname, useRouter, type Href } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { layout, mobileShell, spacing } from "../../theme/tokens";

type BottomBarItem = {
  icon: LucideIconName;
  label: string;
  prominent?: boolean;
  path?: "/" | "/bens" | "/inventarios" | "/cadastro/patrimonio";
};

export const appBottomBarItems: readonly BottomBarItem[] = [
  { icon: "home", label: "Início", path: "/" },
  { icon: "package", label: "Bens", path: "/bens" },
  {
    icon: "scan-barcode",
    label: "Inventário",
    prominent: true,
    path: "/inventarios",
  },
  { icon: "plus", label: "Cadastro", path: "/cadastro/patrimonio" },
  { icon: "file-text", label: "Relatórios" },
] as const;

export function AppBottomBar({
  profile,
}: Readonly<{ profile?: PerfilUsuario }>) {
  const pathname = usePathname();
  const router = useRouter();

  return (
    <View
      accessibilityLabel="Navegação principal"
      accessibilityRole="tablist"
      style={styles.background}
    >
      <View style={styles.content}>
        {appBottomBarItems.map((item) => {
          const inventoryRestricted =
            item.path === "/inventarios" && profile !== "DIRETOR_PATRIMONIO";
          const disabled = item.path === undefined || inventoryRestricted;
          const active =
            item.path === "/bens"
              ? pathname === "/bens" || pathname.startsWith("/bens/")
              : item.path === "/inventarios"
                ? pathname === item.path || pathname.startsWith("/inventarios/")
                : item.path === "/cadastro/patrimonio"
                  ? pathname === item.path || pathname.startsWith("/cadastro/")
                  : pathname === item.path;
          const iconColor = item.prominent
            ? mobileShell.headerText
            : active
              ? mobileShell.navigationActive
              : mobileShell.navigationDisabled;

          return (
            <Pressable
              accessible
              aria-disabled={disabled}
              aria-selected={active}
              accessibilityLabel={
                inventoryRestricted
                  ? `${item.label}. Conferência disponível somente para o Diretor de Patrimônio`
                  : item.label
              }
              accessibilityRole="tab"
              accessibilityState={{
                disabled,
                selected: active,
              }}
              disabled={disabled}
              key={item.label}
              onPress={() => {
                if (item.path && !active) router.replace(item.path as Href);
              }}
              style={({ pressed }) => [
                styles.item,
                pressed && !disabled && styles.itemPressed,
              ]}
            >
              <View
                style={[
                  styles.iconSlot,
                  active && styles.iconSlotActive,
                  item.prominent && styles.iconSlotProminent,
                ]}
              >
                <Lucide
                  accessible={false}
                  color={iconColor}
                  name={item.icon}
                  size={item.prominent ? 25 : 21}
                />
              </View>
              <Text
                accessible={false}
                style={[
                  styles.label,
                  active && styles.labelActive,
                  item.prominent && styles.labelProminent,
                ]}
              >
                {item.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  background: {
    backgroundColor: mobileShell.navigationSurface,
    borderTopColor: mobileShell.navigationDivider,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  content: {
    alignItems: "flex-end",
    alignSelf: "center",
    flexDirection: "row",
    justifyContent: "space-around",
    maxWidth: layout.contentMaxWidth,
    minHeight: 84,
    paddingBottom: spacing.sm,
    paddingHorizontal: spacing.sm,
    paddingTop: spacing.sm,
    width: "100%",
  },
  iconSlot: {
    alignItems: "center",
    height: 36,
    justifyContent: "center",
    width: 36,
  },
  iconSlotActive: {
    backgroundColor: mobileShell.navigationActiveSurface,
    borderRadius: 12,
  },
  iconSlotProminent: {
    backgroundColor: mobileShell.navigationActive,
    borderRadius: 14,
    height: 48,
    marginTop: -12,
    width: 48,
  },
  item: {
    alignItems: "center",
    flex: 1,
    gap: spacing.xs,
    minWidth: 0,
  },
  itemPressed: { opacity: 0.7 },
  label: {
    color: mobileShell.navigationDisabled,
    fontSize: 10,
    lineHeight: 13,
    textAlign: "center",
  },
  labelActive: {
    color: mobileShell.navigationActive,
    fontWeight: "700",
  },
  labelProminent: {
    color: mobileShell.navigationActive,
    fontWeight: "700",
  },
});
