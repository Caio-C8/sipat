import { Lucide } from "@react-native-vector-icons/lucide";
import type { VerificarItemInventarioResultado } from "@repo/contracts";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { mobileInventarios, radii, spacing } from "../../../theme/tokens";

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

export function ReadingResult({
  onReadNext,
  result,
}: Readonly<{
  onReadNext(): void;
  result: VerificarItemInventarioResultado;
}>) {
  const feedback = readingFeedback(result);
  const { item } = result;

  return (
    <View
      accessibilityLiveRegion="polite"
      style={[styles.result, feedback.warning && styles.resultWarning]}
    >
      <View style={styles.resultHeader}>
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
        <Text accessibilityRole="header" style={styles.title}>
          {feedback.title}
        </Text>
      </View>
      <View
        accessible
        accessibilityLabel={`${item.patrimonio.descricao}, patrimônio ${item.patrimonio.numeroPatrimonio}. ${feedback.message}`}
        style={styles.content}
      >
        <Text style={styles.item}>
          {item.patrimonio.descricao} · {item.patrimonio.numeroPatrimonio}
        </Text>
        <Text style={styles.message}>{feedback.message}</Text>
      </View>
      <Pressable
        accessibilityHint="Limpa o resultado atual e reativa a câmera"
        accessibilityLabel="Ler próximo patrimônio. Limpa o resultado atual e reativa a câmera"
        accessibilityRole="button"
        onPress={onReadNext}
        style={styles.nextButton}
      >
        <Lucide
          accessible={false}
          color="#ffffff"
          name="scan-barcode"
          size={19}
        />
        <Text style={styles.nextButtonText}>Ler próximo patrimônio</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  result: {
    backgroundColor: mobileInventarios.successSurface,
    borderColor: mobileInventarios.success,
    borderRadius: radii.md,
    borderWidth: 1,
    gap: spacing.md,
    marginTop: spacing.lg,
    padding: spacing.md,
  },
  resultWarning: {
    backgroundColor: mobileInventarios.warningSurface,
    borderColor: mobileInventarios.warning,
  },
  resultHeader: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.sm,
  },
  content: { gap: spacing.xs },
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
  },
  message: {
    color: mobileInventarios.textMuted,
    fontSize: 12,
    lineHeight: 17,
  },
  nextButton: {
    alignItems: "center",
    backgroundColor: mobileInventarios.action,
    borderRadius: radii.md,
    flexDirection: "row",
    gap: spacing.sm,
    justifyContent: "center",
    minHeight: 48,
    paddingHorizontal: spacing.md,
  },
  nextButtonText: { color: "#ffffff", fontWeight: "800" },
});
