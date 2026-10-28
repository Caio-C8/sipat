import { useState, type ComponentRef, type Ref } from "react";
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
  radii,
  spacing,
  typography,
} from "../../../theme/tokens";

export function FormField({
  label,
  error,
  password = false,
  inputRef,
  ...props
}: Readonly<
  TextInputProps & {
    label: string;
    error?: string;
    password?: boolean;
    inputRef?: Ref<ComponentRef<typeof TextInput>>;
  }
>) {
  const [visible, setVisible] = useState(false);
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <View style={[styles.inputRow, error ? styles.inputError : null]}>
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
            <Text style={styles.visibilityText}>
              {visible ? "Ocultar" : "Mostrar"}
            </Text>
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
  field: { gap: spacing.sm, marginTop: spacing.lg },
  label: { color: colors.text, fontSize: typography.label, fontWeight: "700" },
  inputRow: {
    alignItems: "center",
    borderColor: colors.border,
    borderRadius: radii.sm,
    borderWidth: 1,
    flexDirection: "row",
    minHeight: layout.comfortableTouchTarget,
  },
  inputError: { borderColor: colors.error },
  input: {
    color: colors.text,
    flex: 1,
    fontSize: typography.body,
    minHeight: layout.comfortableTouchTarget,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  visibility: {
    justifyContent: "center",
    minHeight: layout.comfortableTouchTarget,
    paddingHorizontal: spacing.md,
  },
  visibilityText: { color: colors.primary, fontSize: 13, fontWeight: "700" },
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
  button: {
    alignItems: "center",
    backgroundColor: colors.primary,
    borderRadius: radii.sm,
    flexDirection: "row",
    gap: spacing.sm,
    justifyContent: "center",
    marginTop: spacing.xl,
    minHeight: layout.comfortableTouchTarget,
    paddingHorizontal: spacing.lg,
  },
  buttonPressed: { backgroundColor: colors.primaryPressed },
  buttonDisabled: { opacity: 0.65 },
  buttonText: {
    color: colors.primaryContrast,
    fontSize: typography.body,
    fontWeight: "800",
  },
});
