import { useState, type ComponentRef, type Ref } from "react";
import { Lucide, type LucideIconName } from "@react-native-vector-icons/lucide";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextInputProps,
} from "react-native";
import {
  colors,
  layout,
  mobileAuth,
  radii,
  spacing,
} from "../../../theme/tokens";

export function FormField({
  label,
  error,
  password = false,
  icon,
  inputRef,
  ...props
}: Readonly<
  TextInputProps & {
    label: string;
    error?: string;
    password?: boolean;
    icon?: LucideIconName;
    inputRef?: Ref<ComponentRef<typeof TextInput>>;
  }
>) {
  const [visible, setVisible] = useState(false);
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <View style={[styles.inputRow, error ? styles.inputError : null]}>
        {icon ? (
          <Lucide
            accessible={false}
            color={mobileAuth.inputIcon}
            name={icon}
            size={17}
            style={styles.inputIcon}
          />
        ) : null}
        <TextInput
          {...props}
          ref={inputRef}
          accessibilityLabel={label}
          accessibilityState={{ disabled: props.editable === false }}
          secureTextEntry={password && !visible}
          style={styles.input}
        />
        {password ? (
          <Pressable
            accessibilityLabel={visible ? "Ocultar senha" : "Mostrar senha"}
            accessibilityRole="button"
            hitSlop={8}
            onPress={() => setVisible((current) => !current)}
            style={styles.visibility}
          >
            <Lucide
              accessible={false}
              color={mobileAuth.inputIcon}
              name={visible ? "eye-off" : "eye"}
              size={18}
            />
          </Pressable>
        ) : null}
      </View>
      {error ? (
        <Text accessibilityLiveRegion="polite" style={styles.error}>
          {error}
        </Text>
      ) : null}
    </View>
  );
}

export function FormAlert({ children }: Readonly<{ children: string }>) {
  return (
    <Text accessibilityLiveRegion="assertive" role="alert" style={styles.alert}>
      {children}
    </Text>
  );
}

export function InformationPanel({
  title,
  children,
}: Readonly<{ title: string; children: string }>) {
  return (
    <View style={styles.informationPanel}>
      <Lucide
        accessible={false}
        color={mobileAuth.information}
        name="lock-keyhole"
        size={18}
      />
      <View style={styles.informationContent}>
        <Text style={styles.informationTitle}>{title}</Text>
        <Text style={styles.informationText}>{children}</Text>
      </View>
    </View>
  );
}

export function TextAction({
  label,
  disabled = false,
  onPress,
  accessibilityRole = "button",
}: Readonly<{
  label: string;
  disabled?: boolean;
  onPress?: () => void;
  accessibilityRole?: "button" | "link";
}>) {
  return (
    <Pressable
      accessibilityRole={accessibilityRole}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.textAction,
        pressed && !disabled && styles.textActionPressed,
      ]}
    >
      <Text style={styles.textActionLabel}>{label}</Text>
    </Pressable>
  );
}

export function PrimaryButton({
  label,
  pending = false,
  disabled = false,
  onPress,
}: Readonly<{
  label: string;
  pending?: boolean;
  disabled?: boolean;
  onPress(): void;
}>) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ busy: pending, disabled: disabled || pending }}
      disabled={disabled || pending}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        pressed && styles.buttonPressed,
        (disabled || pending) && styles.buttonDisabled,
      ]}
    >
      {pending ? <ActivityIndicator color={colors.primaryContrast} /> : null}
      <Text style={styles.buttonText}>{pending ? "Aguarde…" : label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  field: { gap: 6, marginTop: spacing.lg },
  label: { color: mobileAuth.text, fontSize: 12, fontWeight: "500" },
  inputRow: {
    alignItems: "center",
    borderColor: mobileAuth.border,
    borderRadius: radii.sm,
    borderWidth: 1,
    flexDirection: "row",
    minHeight: layout.comfortableTouchTarget,
  },
  inputError: { borderColor: colors.error },
  input: {
    color: mobileAuth.text,
    flex: 1,
    fontSize: 14,
    minHeight: layout.comfortableTouchTarget,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
  },
  inputIcon: { marginLeft: spacing.md },
  visibility: {
    justifyContent: "center",
    minHeight: layout.comfortableTouchTarget,
    paddingHorizontal: spacing.md,
  },
  error: { color: colors.error, fontSize: 13, lineHeight: 19 },
  alert: {
    backgroundColor: colors.errorSurface,
    borderColor: colors.error,
    borderRadius: radii.sm,
    borderWidth: 1,
    color: colors.error,
    lineHeight: 20,
    marginTop: spacing.lg,
    padding: spacing.md,
  },
  informationPanel: {
    alignItems: "flex-start",
    backgroundColor: mobileAuth.informationSurface,
    borderRadius: radii.sm,
    flexDirection: "row",
    gap: spacing.md,
    padding: spacing.md,
  },
  informationContent: { flex: 1, gap: spacing.xs },
  informationTitle: {
    color: mobileAuth.text,
    fontSize: 12,
    fontWeight: "700",
    lineHeight: 17,
  },
  informationText: {
    color: mobileAuth.textMuted,
    fontSize: 12,
    lineHeight: 18,
  },
  button: {
    alignItems: "center",
    backgroundColor: mobileAuth.action,
    borderRadius: radii.sm,
    flexDirection: "row",
    gap: spacing.sm,
    justifyContent: "center",
    marginTop: spacing.xl,
    minHeight: layout.comfortableTouchTarget,
    paddingHorizontal: spacing.lg,
  },
  buttonPressed: { backgroundColor: mobileAuth.actionPressed },
  buttonDisabled: { opacity: 0.65 },
  buttonText: {
    color: colors.primaryContrast,
    fontSize: 14,
    fontWeight: "800",
  },
  textAction: {
    alignSelf: "center",
    justifyContent: "center",
    minHeight: layout.comfortableTouchTarget,
    paddingHorizontal: spacing.md,
  },
  textActionPressed: { opacity: 0.7 },
  textActionLabel: {
    color: mobileAuth.link,
    fontSize: 12,
    fontWeight: "700",
    textAlign: "center",
  },
});
