import { Lucide } from "@react-native-vector-icons/lucide";
import type { IdentidadeAutenticada } from "@repo/contracts";
import { useState } from "react";
import {
  Image,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import crest from "../../../assets/brasao.png";
import { useSession } from "../../features/auth/session/session-context";
import { layout, mobileShell, radii, spacing } from "../../theme/tokens";

const TABLET_MIN_WIDTH = 768;

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toLocaleUpperCase("pt-BR"))
    .join("");
}

type AppTopbarViewProps = Readonly<{
  identity: IdentidadeAutenticada | null;
  isWide: boolean;
  menuOpen: boolean;
  onLogout(): void;
  onToggleMenu(): void;
}>;

export function AppTopbarView({
  identity,
  isWide,
  menuOpen,
  onLogout,
  onToggleMenu,
}: AppTopbarViewProps) {
  return (
    <View style={styles.background}>
      <View
        accessibilityLabel={
          identity
            ? `SIPAT, usuário ${identity.nome}`
            : "SIPAT, Câmara Municipal de Patos de Minas"
        }
        accessibilityRole="header"
        style={[styles.content, isWide && styles.contentWide]}
      >
        <Image
          accessible={false}
          resizeMode="contain"
          source={crest}
          style={[styles.crest, isWide && styles.crestWide]}
        />

        <View style={styles.wordmark}>
          <Text style={styles.title}>SIPAT</Text>
          {identity ? (
            <View style={styles.accountSlot}>
              <Pressable
                accessibilityHint="Abre o menu da conta"
                accessibilityLabel={`Conta de ${identity.nome}`}
                accessibilityRole="button"
                accessibilityState={{ expanded: menuOpen }}
                aria-expanded={menuOpen}
                onPress={onToggleMenu}
                style={({ pressed }) => [
                  styles.avatarButton,
                  isWide && styles.avatarButtonWide,
                  pressed && styles.avatarButtonPressed,
                ]}
              >
                <Text style={styles.avatarText}>{initials(identity.nome)}</Text>
              </Pressable>

              {menuOpen ? (
                <View accessibilityLabel="Menu da conta" style={styles.menu}>
                  <View style={styles.menuIdentity}>
                    <Text numberOfLines={1} style={styles.menuName}>
                      {identity.nome}
                    </Text>
                    <Text style={styles.menuProfile}>
                      {identity.perfil === "ADMINISTRADOR"
                        ? "Administrador"
                        : "Diretor de Patrimônio"}
                    </Text>
                  </View>
                  <View style={styles.menuDivider} />
                  <Pressable
                    accessibilityRole="button"
                    onPress={onLogout}
                    style={({ pressed }) => [
                      styles.logoutButton,
                      pressed && styles.logoutButtonPressed,
                    ]}
                  >
                    <Lucide
                      accessible={false}
                      color={mobileShell.accountMenuDanger}
                      name="log-out"
                      size={17}
                    />
                    <Text style={styles.logoutText}>Sair</Text>
                  </Pressable>
                </View>
              ) : null}
            </View>
          ) : (
            <Text style={styles.subtitle}>
              Câmara Municipal de Patos de Minas
            </Text>
          )}
        </View>
      </View>
    </View>
  );
}

export function AppTopbar() {
  const { width } = useWindowDimensions();
  const { manager, state } = useSession();
  const [menuOpen, setMenuOpen] = useState(false);
  const identity = state.status === "authenticated" ? state.identity : null;

  return (
    <AppTopbarView
      identity={identity}
      isWide={width >= TABLET_MIN_WIDTH}
      menuOpen={menuOpen}
      onLogout={() => {
        setMenuOpen(false);
        void manager.logout();
      }}
      onToggleMenu={() => setMenuOpen((current) => !current)}
    />
  );
}

const styles = StyleSheet.create({
  background: {
    backgroundColor: mobileShell.header,
    overflow: "visible",
  },
  content: {
    alignItems: "center",
    alignSelf: "center",
    flexDirection: "row",
    gap: spacing.sm,
    maxWidth: layout.contentMaxWidth,
    minHeight: 76,
    overflow: "visible",
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    width: "100%",
    zIndex: 20,
  },
  contentWide: {
    minHeight: 84,
    paddingHorizontal: spacing.xxxl,
  },
  crest: {
    borderRadius: 8,
    height: 36,
    width: 36,
  },
  crestWide: {
    height: 44,
    width: 44,
  },
  wordmark: {
    alignItems: "center",
    flex: 1,
    flexDirection: "row",
    flexShrink: 1,
    justifyContent: "space-between",
    overflow: "visible",
  },
  title: {
    color: mobileShell.headerText,
    fontSize: 22,
    fontWeight: "800",
    letterSpacing: 0.2,
  },
  subtitle: {
    color: mobileShell.headerTextMuted,
    flexShrink: 1,
    fontSize: 9,
    lineHeight: 13,
    maxWidth: 104,
    textAlign: "right",
  },
  accountSlot: {
    alignItems: "flex-end",
    position: "relative",
    zIndex: 30,
  },
  avatarButton: {
    alignItems: "center",
    backgroundColor: mobileShell.accountAvatarSurface,
    borderColor: mobileShell.accountAvatarBorder,
    borderRadius: radii.pill,
    borderWidth: 1,
    height: 42,
    justifyContent: "center",
    width: 42,
  },
  avatarButtonWide: {
    height: 46,
    width: 46,
  },
  avatarButtonPressed: {
    opacity: 0.8,
  },
  avatarText: {
    color: mobileShell.accountAvatarText,
    fontSize: 12,
    fontWeight: "800",
  },
  menu: {
    backgroundColor: mobileShell.accountMenuSurface,
    borderColor: mobileShell.accountMenuBorder,
    borderRadius: radii.md,
    borderWidth: 1,
    elevation: 8,
    minWidth: 220,
    paddingVertical: spacing.sm,
    position: "absolute",
    right: 0,
    shadowColor: "#000000",
    shadowOffset: { height: 4, width: 0 },
    shadowOpacity: 0.18,
    shadowRadius: 10,
    top: 50,
    zIndex: 40,
  },
  menuIdentity: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  menuName: {
    color: mobileShell.accountMenuText,
    fontSize: 13,
    fontWeight: "800",
  },
  menuProfile: {
    color: mobileShell.accountMenuTextMuted,
    fontSize: 11,
    lineHeight: 16,
    marginTop: 2,
  },
  menuDivider: {
    backgroundColor: mobileShell.accountMenuBorder,
    height: StyleSheet.hairlineWidth,
    marginVertical: spacing.xs,
  },
  logoutButton: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.sm,
    minHeight: layout.comfortableTouchTarget,
    paddingHorizontal: spacing.md,
  },
  logoutButtonPressed: {
    backgroundColor: mobileShell.accountMenuDangerSurface,
  },
  logoutText: {
    color: mobileShell.accountMenuDanger,
    fontSize: 13,
    fontWeight: "700",
  },
});
