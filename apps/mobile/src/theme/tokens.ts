import { Platform } from "react-native";

export const colors = {
  surface: "#ffffff",
  surfaceSubtle: "#f1f5f2",
  surfaceMuted: "#edf2ef",
  text: "#173c31",
  textMuted: "#52665c",
  textSubtle: "#718077",
  border: "#dbe5de",
  focus: "#246bfd",
  primary: "#1f6848",
  primaryPressed: "#184f38",
  primaryContrast: "#ffffff",
  success: "#2e8b62",
  successSurface: "#e1f2e8",
  information: "#245f9e",
  informationSurface: "#e8f2fc",
  error: "#8e3f34",
  errorSurface: "#f9e7e3",
  brandSurface: "#123f32",
  brandText: "#d5eadd",
  brandAccent: "#8dc6a6",
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
} as const;

export const radii = {
  sm: 10,
  md: 12,
  lg: 18,
  pill: 999,
} as const;

export const typography = {
  body: 15,
  bodyLineHeight: 22,
  label: 12,
  title: 22,
} as const;

export const layout = {
  contentMaxWidth: 1200,
  comfortableTouchTarget: 48,
  wideMinWidth: 900,
} as const;

export const mobileShell = {
  canvas: "#f7f9fc",
  header: "#102747",
  headerText: "#ffffff",
  headerTextMuted: "#d7e1ee",
  accountAvatarSurface: "#f2f6fc",
  accountAvatarBorder: "#d9e4f2",
  accountAvatarText: "#18314f",
  accountMenuSurface: "#ffffff",
  accountMenuBorder: "#dfe7f1",
  accountMenuText: "#14243b",
  accountMenuTextMuted: "#69778a",
  accountMenuDanger: "#9a4035",
  accountMenuDangerSurface: "#fff2ef",
  navigationActive: "#2860eb",
  navigationActiveSurface: "#eff5ff",
  navigationDisabled: "#8a9bb2",
  navigationDivider: "#dfe7f1",
  navigationSurface: "#ffffff",
} as const;

export const mobileHome = {
  surface: "#ffffff",
  surfaceMuted: "#f4f7fb",
  text: "#14243b",
  textMuted: "#69778a",
  textSubtle: "#8390a1",
  border: "#dfe7f1",
  action: "#2860eb",
  actionSurface: "#eff5ff",
  heroText: "#ffffff",
  heroTextMuted: "#dfe9ff",
  heroIconSurface: "#4c79ed",
  heroDecoration: "#3569e8",
  progressTrack: "#e5ebf3",
  warning: "#9b6508",
  warningSurface: "#fff8e8",
  success: "#178765",
  successSurface: "#eafaf4",
  error: "#9a4035",
  errorBorder: "#e8b9b1",
  errorSurface: "#fff2ef",
} as const;

export const mobilePatrimonios = {
  surface: "#ffffff",
  canvas: "#f7f9fc",
  text: "#14243b",
  textMuted: "#69778a",
  textSubtle: "#8390a1",
  border: "#dfe7f1",
  action: "#2860eb",
  actionPressed: "#1f4fc7",
  actionSurface: "#eff5ff",
  success: "#178765",
  successSurface: "#eafaf4",
  warning: "#9b6508",
  warningSurface: "#fff8e8",
  danger: "#9a4035",
  dangerSurface: "#fff2ef",
  neutralSurface: "#edf2f7",
  valueSurface: "#eff5ff",
  overlay: "rgba(20, 36, 59, 0.45)",
} as const;

export const mobileInventarios = {
  surface: "#ffffff",
  canvas: "#f7f9fc",
  text: "#14243b",
  textMuted: "#69778a",
  textSubtle: "#8390a1",
  border: "#dfe7f1",
  action: "#2860eb",
  actionPressed: "#1f4fc7",
  actionSurface: "#eff5ff",
  success: "#178765",
  successSurface: "#eafaf4",
  warning: "#9b6508",
  warningSurface: "#fff8e8",
  danger: "#9a4035",
  dangerSurface: "#fff2ef",
  progressTrack: "#e5ebf3",
  overlay: "rgba(20, 36, 59, 0.45)",
} as const;

export const mobileAuth = {
  canvas: "#f8fafc",
  card: "#ffffff",
  text: "#14243b",
  textMuted: "#69778a",
  textSubtle: "#8390a1",
  border: "#dce3eb",
  inputIcon: "#77879a",
  action: "#1c4170",
  actionPressed: "#153457",
  link: "#1d5fbb",
  information: "#2f6fcb",
  informationSurface: "#eef5ff",
  success: "#178765",
  successSurface: "#eafaf4",
} as const;

export const platformFont = Platform.select({
  ios: "Menlo",
  android: "monospace",
  default: "monospace",
});
