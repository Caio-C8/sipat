import { Lucide } from "@react-native-vector-icons/lucide";
import type { VerificarItemInventarioResultado } from "@repo/contracts";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { mobileInventarios, radii, spacing } from "../../../theme/tokens";

export const READING_TOAST_DURATION_MS = 6_000;

export function readingFeedback(result: VerificarItemInventarioResultado) {
  const { item } = result;
  const correct = item.situacao === "CORRETO";
  const posterior = result.tipo.startsWith("LOCALIZACAO_POSTERIOR_");
  const idempotent =
    result.tipo === "LEITURA_IDEMPOTENTE" ||
    result.tipo === "LOCALIZACAO_POSTERIOR_IDEMPOTENTE";

  return {
    message:
      posterior && item.localizacaoPosterior
        ? `Cadastrado em ${item.setorEsperado.nome}; encontrado posteriormente em ${item.localizacaoPosterior.setorEncontrado.nome}.`
        : correct
          ? `${item.setorEsperado.nome} · setor correto.`
          : item.situacao === "DIVERGENCIA"
            ? `Cadastrado em ${item.setorEsperado.nome}; encontrado em ${item.setorEncontrado.nome}.`
            : "Leitura registrada.",
    title: idempotent
      ? "Leitura já registrada"
      : posterior
        ? "Bem encontrado posteriormente"
        : correct
          ? "Bem conferido"
          : "Leitura registrada",
    warning: !correct,
  } as const;
}

export function ReadingToast({
  onClose,
  result,
}: Readonly<{
  onClose(): void;
  result: VerificarItemInventarioResultado;
}>) {
  const feedback = readingFeedback(result);
  const { item } = result;

  return (
    <View pointerEvents="box-none" style={styles.layer}>
      <View
        accessibilityLiveRegion="polite"
        style={[styles.toast, feedback.warning && styles.toastWarning]}
      >
        <Lucide
          accessible={false}
          color={
            feedback.warning
              ? mobileInventarios.warning
              : mobileInventarios.success
          }
          name={feedback.warning ? "triangle-alert" : "circle-check"}
          size={22}
        />
        <View style={styles.content}>
          <Text style={styles.title}>{feedback.title}</Text>
          <Text style={styles.item}>
            {item.patrimonio.descricao} · {item.patrimonio.numeroPatrimonio}
          </Text>
          <Text style={styles.message}>{feedback.message}</Text>
        </View>
        <Pressable
          accessibilityLabel="Fechar aviso da leitura"
          accessibilityRole="button"
          hitSlop={8}
          onPress={onClose}
          style={styles.close}
        >
          <Lucide
            accessible={false}
            color={mobileInventarios.textMuted}
            name="x"
            size={19}
          />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  layer: {
    alignItems: "center",
    left: 0,
    paddingHorizontal: spacing.lg,
    position: "absolute",
    right: 0,
    top: spacing.md,
    zIndex: 20,
  },
  toast: {
    alignItems: "flex-start",
    backgroundColor: mobileInventarios.successSurface,
    borderColor: mobileInventarios.success,
    borderRadius: radii.md,
    borderWidth: 1,
    elevation: 5,
    flexDirection: "row",
    gap: spacing.sm,
    maxWidth: 680,
    padding: spacing.md,
    shadowColor: mobileInventarios.text,
    shadowOffset: { height: 3, width: 0 },
    shadowOpacity: 0.16,
    shadowRadius: 8,
    width: "100%",
  },
  toastWarning: {
    backgroundColor: mobileInventarios.warningSurface,
    borderColor: mobileInventarios.warning,
  },
  content: { flex: 1 },
  title: {
    color: mobileInventarios.text,
    fontSize: 14,
    fontWeight: "800",
  },
  item: {
    color: mobileInventarios.text,
    fontSize: 12,
    fontWeight: "600",
    lineHeight: 17,
    marginTop: spacing.xs,
  },
  message: {
    color: mobileInventarios.textMuted,
    fontSize: 12,
    lineHeight: 17,
    marginTop: spacing.xs,
  },
  close: {
    alignItems: "center",
    borderRadius: radii.pill,
    height: 32,
    justifyContent: "center",
    margin: -spacing.xs,
    width: 32,
  },
});
