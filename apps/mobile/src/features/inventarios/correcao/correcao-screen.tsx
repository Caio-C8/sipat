import { Lucide } from "@react-native-vector-icons/lucide";
import { useRouter, type Href } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import {
  layout,
  mobileInventarios,
  radii,
  spacing,
} from "../../../theme/tokens";
import { useSession } from "../../auth/session/session-context";
import { Notice } from "../inventario-components";
import {
  correcaoErrorMessage,
  isPendingDivergence,
  type CorrecaoChoice,
} from "./correcao-state";
import { useCorrecao } from "./use-correcao";

export function CorrecaoScreen({
  inventarioId,
  itemInventarioId,
  validIds,
}: Readonly<{
  inventarioId: string;
  itemInventarioId: string;
  validIds: boolean;
}>) {
  const router = useRouter();
  const { manager, state: session } = useSession();
  const correction = useCorrecao(
    manager,
    inventarioId,
    itemInventarioId,
    validIds,
  );
  const [choice, setChoice] = useState<CorrecaoChoice>("MANTER_ENCONTRADO");
  const [observation, setObservation] = useState("");
  const [inputError, setInputError] = useState<string | null>(null);
  const data =
    correction.state.status === "success" ? correction.state.data : null;
  const summaryHref = data
    ? (`/inventarios/${inventarioId}/setores/${data.setorInventario.id}` as Href)
    : null;
  const incompatible = Boolean(
    data &&
    (data.inventario.status === "FINALIZADO" ||
      !isPendingDivergence(data.item)),
  );

  useEffect(() => {
    if (incompatible && summaryHref) router.replace(summaryHref);
  }, [incompatible, router, summaryHref]);

  if (correction.state.status === "loading" || incompatible) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={mobileInventarios.action} size="large" />
        <Text style={styles.stateText}>
          {incompatible
            ? "Atualizando resumo do setor…"
            : "Carregando divergência…"}
        </Text>
      </View>
    );
  }

  if (correction.state.status === "error") {
    return (
      <View accessibilityLiveRegion="polite" style={styles.center}>
        <Text accessibilityRole="header" style={styles.stateTitle}>
          Correção indisponível
        </Text>
        <Text style={styles.stateText}>
          {validIds
            ? correcaoErrorMessage(correction.state.error)
            : "O endereço informado não contém identificadores válidos."}
        </Text>
        {validIds && correction.state.error.status !== 401 ? (
          <Pressable
            accessibilityRole="button"
            onPress={correction.reload}
            style={styles.primaryButton}
          >
            <Text style={styles.primaryButtonText}>Tentar novamente</Text>
          </Pressable>
        ) : null}
      </View>
    );
  }

  const { inventario, item } = correction.state.data;
  const isDirector =
    session.status === "authenticated" &&
    session.identity.perfil === "DIRETOR_PATRIMONIO";
  if (!isDirector || item.situacao !== "DIVERGENCIA") {
    return (
      <View style={styles.center}>
        <Text accessibilityRole="header" style={styles.stateTitle}>
          Correção não disponível
        </Text>
        <Text style={styles.stateText}>
          Somente o Diretor de Patrimônio pode corrigir divergências pendentes.
        </Text>
      </View>
    );
  }

  const submit = async () => {
    if (observation.trim().length > 2_000) {
      setInputError("A observação deve possuir no máximo 2.000 caracteres.");
      return;
    }
    setInputError(null);
    await correction.submit(choice, observation);
  };

  return (
    <ScrollView
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      <Pressable
        accessibilityRole="button"
        onPress={() =>
          summaryHref ? router.replace(summaryHref) : router.back()
        }
        style={styles.backButton}
      >
        <Lucide
          accessible={false}
          color={mobileInventarios.text}
          name="arrow-left"
          size={18}
        />
        <Text style={styles.backText}>Resumo do setor</Text>
      </Pressable>
      <Text style={styles.eyebrow}>{inventario.nome}</Text>
      <Text accessibilityRole="header" style={styles.title}>
        Corrigir localização
      </Text>

      {correction.mutationError ? (
        <Notice kind="error" title="Correção não registrada">
          {correcaoErrorMessage(correction.mutationError)}
        </Notice>
      ) : null}

      <View style={styles.itemCard}>
        <Text style={styles.itemNumber}>
          {item.patrimonio.numeroPatrimonio}
        </Text>
        <Text style={styles.itemTitle}>{item.patrimonio.descricao}</Text>
      </View>
      <View style={styles.locations}>
        <Location label="Setor esperado" value={item.setorEsperado.nome} />
        <Lucide
          accessible={false}
          color={mobileInventarios.action}
          name="arrow-right"
          size={20}
        />
        <Location label="Setor encontrado" value={item.setorEncontrado.nome} />
      </View>

      <Text style={styles.sectionTitle}>O que fazer com o bem?</Text>
      <Choice
        description={`O bem deve retornar para ${item.setorEsperado.nome}.`}
        label="Trazer para o setor cadastrado"
        onPress={() => setChoice("TRAZER_PARA_CADASTRADO")}
        selected={choice === "TRAZER_PARA_CADASTRADO"}
      />
      <Choice
        description={`A API transferirá o cadastro para ${item.setorEncontrado.nome}.`}
        label="Manter no setor onde foi encontrado"
        onPress={() => setChoice("MANTER_ENCONTRADO")}
        selected={choice === "MANTER_ENCONTRADO"}
      />

      <Text style={styles.inputLabel}>
        Justificativa / observação (opcional)
      </Text>
      <TextInput
        accessibilityLabel="Observação da correção"
        editable={!correction.submitting}
        maxLength={2_001}
        multiline
        onChangeText={setObservation}
        placeholder="Adicione contexto para o histórico da ocorrência"
        placeholderTextColor={mobileInventarios.textSubtle}
        style={styles.input}
        value={observation}
      />
      <Text style={styles.counter}>{observation.length}/2.000</Text>
      {inputError ? (
        <Text accessibilityLiveRegion="polite" style={styles.inputError}>
          {inputError}
        </Text>
      ) : null}

      <Pressable
        accessibilityRole="button"
        accessibilityState={{ disabled: correction.submitting }}
        disabled={correction.submitting}
        onPress={() => void submit()}
        style={[styles.primaryButton, correction.submitting && styles.disabled]}
      >
        {correction.submitting ? <ActivityIndicator color="#ffffff" /> : null}
        <Text style={styles.primaryButtonText}>
          {correction.submitting ? "Registrando…" : "Registrar correção"}
        </Text>
      </Pressable>
      <Text style={styles.hint}>
        A divergência continuará registrada; somente o status da correção será
        atualizado.
      </Text>
    </ScrollView>
  );
}

function Location({
  label,
  value,
}: Readonly<{ label: string; value: string }>) {
  return (
    <View style={styles.location}>
      <Text style={styles.locationLabel}>{label}</Text>
      <Text style={styles.locationValue}>{value}</Text>
    </View>
  );
}

function Choice({
  description,
  label,
  onPress,
  selected,
}: Readonly<{
  description: string;
  label: string;
  onPress: () => void;
  selected: boolean;
}>) {
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ checked: selected }}
      onPress={onPress}
      style={[styles.choice, selected && styles.choiceSelected]}
    >
      <View style={[styles.radio, selected && styles.radioSelected]} />
      <View style={styles.choiceText}>
        <Text style={styles.choiceLabel}>{label}</Text>
        <Text style={styles.choiceDescription}>{description}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  content: {
    alignSelf: "center",
    maxWidth: layout.contentMaxWidth,
    padding: spacing.xl,
    paddingBottom: spacing.xxxl,
    width: "100%",
  },
  center: {
    alignItems: "center",
    backgroundColor: mobileInventarios.canvas,
    flex: 1,
    justifyContent: "center",
    padding: spacing.xxl,
  },
  stateTitle: {
    color: mobileInventarios.text,
    fontSize: 22,
    fontWeight: "800",
  },
  stateText: {
    color: mobileInventarios.textMuted,
    fontSize: 14,
    marginTop: spacing.sm,
    maxWidth: 520,
    textAlign: "center",
  },
  backButton: {
    alignItems: "center",
    alignSelf: "flex-start",
    flexDirection: "row",
    gap: spacing.sm,
    minHeight: 48,
  },
  backText: { color: mobileInventarios.text, fontSize: 14 },
  eyebrow: {
    color: mobileInventarios.textMuted,
    fontSize: 11,
    fontWeight: "800",
    marginTop: spacing.sm,
    textTransform: "uppercase",
  },
  title: {
    color: mobileInventarios.text,
    fontSize: 27,
    fontWeight: "800",
    marginBottom: spacing.xl,
    marginTop: spacing.xs,
  },
  itemCard: {
    backgroundColor: mobileInventarios.surface,
    borderColor: mobileInventarios.border,
    borderRadius: radii.md,
    borderWidth: 1,
    padding: spacing.lg,
  },
  itemNumber: { color: mobileInventarios.textMuted, fontSize: 12 },
  itemTitle: {
    color: mobileInventarios.text,
    fontSize: 17,
    fontWeight: "800",
    marginTop: spacing.xs,
  },
  locations: {
    alignItems: "center",
    backgroundColor: mobileInventarios.actionSurface,
    borderRadius: radii.md,
    flexDirection: "row",
    gap: spacing.sm,
    marginTop: spacing.md,
    padding: spacing.lg,
  },
  location: { flex: 1 },
  locationLabel: { color: mobileInventarios.textMuted, fontSize: 11 },
  locationValue: {
    color: mobileInventarios.text,
    fontSize: 13,
    fontWeight: "700",
    marginTop: spacing.xs,
  },
  sectionTitle: {
    color: mobileInventarios.text,
    fontSize: 16,
    fontWeight: "800",
    marginBottom: spacing.sm,
    marginTop: spacing.xl,
  },
  choice: {
    alignItems: "center",
    backgroundColor: mobileInventarios.surface,
    borderColor: mobileInventarios.border,
    borderRadius: radii.md,
    borderWidth: 1,
    flexDirection: "row",
    gap: spacing.md,
    marginBottom: spacing.sm,
    minHeight: 76,
    padding: spacing.md,
  },
  choiceSelected: {
    backgroundColor: mobileInventarios.actionSurface,
    borderColor: mobileInventarios.action,
  },
  radio: {
    borderColor: mobileInventarios.textSubtle,
    borderRadius: 8,
    borderWidth: 2,
    height: 16,
    width: 16,
  },
  radioSelected: {
    backgroundColor: mobileInventarios.action,
    borderColor: mobileInventarios.action,
  },
  choiceText: { flex: 1 },
  choiceLabel: {
    color: mobileInventarios.text,
    fontSize: 13,
    fontWeight: "800",
  },
  choiceDescription: {
    color: mobileInventarios.textMuted,
    fontSize: 11,
    marginTop: spacing.xs,
  },
  inputLabel: {
    color: mobileInventarios.text,
    fontSize: 13,
    fontWeight: "700",
    marginTop: spacing.lg,
  },
  input: {
    backgroundColor: mobileInventarios.surface,
    borderColor: mobileInventarios.border,
    borderRadius: radii.md,
    borderWidth: 1,
    color: mobileInventarios.text,
    marginTop: spacing.sm,
    minHeight: 112,
    padding: spacing.md,
    textAlignVertical: "top",
  },
  counter: {
    color: mobileInventarios.textSubtle,
    fontSize: 11,
    marginTop: spacing.xs,
    textAlign: "right",
  },
  inputError: {
    color: mobileInventarios.danger,
    fontSize: 12,
    marginTop: spacing.xs,
  },
  primaryButton: {
    alignItems: "center",
    backgroundColor: mobileInventarios.action,
    borderRadius: radii.md,
    flexDirection: "row",
    gap: spacing.sm,
    justifyContent: "center",
    marginTop: spacing.lg,
    minHeight: 52,
    paddingHorizontal: spacing.lg,
  },
  primaryButtonText: { color: "#ffffff", fontWeight: "800" },
  disabled: { opacity: 0.55 },
  hint: {
    color: mobileInventarios.textMuted,
    fontSize: 11,
    marginTop: spacing.sm,
    textAlign: "center",
  },
});
