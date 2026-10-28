import { Lucide, type LucideIconName } from "@react-native-vector-icons/lucide";
import { StyleSheet, Text, View } from "react-native";
import { layout, mobileShell, spacing } from "../../theme/tokens";

type BottomBarItem = {
  icon: LucideIconName;
  label: string;
  prominent?: boolean;
  state: "active" | "disabled";
};

export const appBottomBarItems: readonly BottomBarItem[] = [
  { icon: "home", label: "Início", state: "active" },
  { icon: "package", label: "Bens", state: "disabled" },
  {
    icon: "scan-barcode",
    label: "Inventário",
    prominent: true,
    state: "disabled",
  },
  { icon: "plus", label: "Cadastro", state: "disabled" },
  { icon: "file-text", label: "Relatórios", state: "disabled" },
] as const;

export function AppBottomBar() {
  return (
    <View
      accessibilityLabel="Navegação principal"
      accessibilityRole="tablist"
      style={styles.background}
    >
      <View style={styles.content}>
        {appBottomBarItems.map((item) => {
          const active = item.state === "active";
          const iconColor = item.prominent
            ? mobileShell.headerText
            : active
              ? mobileShell.navigationActive
              : mobileShell.navigationDisabled;

          return (
            <View
              accessible
              aria-disabled={item.state === "disabled"}
              aria-selected={active}
              accessibilityLabel={item.label}
              accessibilityRole="tab"
              accessibilityState={{
                disabled: item.state === "disabled",
                selected: active,
              }}
              key={item.label}
              style={styles.item}
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
            </View>
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
