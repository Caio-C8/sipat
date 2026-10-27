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

export const platformFont = Platform.select({
  ios: "Menlo",
  android: "monospace",
  default: "monospace",
});
