import { Lucide } from "@react-native-vector-icons/lucide";
import type { CatalogoOpcaoRelatorio, TipoRelatorio } from "@repo/contracts";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  BackHandler,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from "react-native";
import { publicAppConfig } from "../../config/public-app-config";
import { layout, mobileRelatorios, radii, spacing } from "../../theme/tokens";
import { useSession } from "../auth/session/session-context";
import { createRelatoriosOperations } from "./api/relatorios-operations";
import {
  createRelatorioDraft,
  formatRelatorioFieldInput,
  relatorioFormConfig,
  relatorioTitles,
  validateRelatorioDraft,
  type RelatorioDraft,
  type RelatorioField,
  type RelatorioOption,
} from "./relatorio-form-config";
import { useRelatorioCatalogo } from "./use-relatorio-catalogos";
import { RelatorioPreviaScreen } from "./components/relatorio-previa-screen";
import type { RelatorioPreviaRequest } from "./use-relatorio-previa";

const drafts = new Map<TipoRelatorio, RelatorioDraft>();
const labels = new Map<TipoRelatorio, Record<string, string>>();
const scrollPositions = new Map<TipoRelatorio, number>();
let activeDraftType: TipoRelatorio | undefined;

function initialDraft(tipo: TipoRelatorio) {
  if (activeDraftType !== tipo) {
    drafts.clear();
    labels.clear();
    scrollPositions.clear();
    activeDraftType = tipo;
  }
  return drafts.get(tipo) ?? createRelatorioDraft(tipo);
}
type Selection = Readonly<{
  field: RelatorioField;
  catalog?: CatalogoOpcaoRelatorio;
  options?: readonly RelatorioOption[];
}>;

function Field({
  field,
  value,
  displayValue,
  error,
  onChange,
  onSelect,
}: Readonly<{
  field: RelatorioField;
  value: string;
  displayValue?: string;
  error?: string;
  onChange(value: string): void;
  onSelect(): void;
}>) {
  const selectable = field.kind === "catalog" || field.kind === "enum";
  return (
    <View style={styles.field}>
      <Text style={styles.label}>
        {field.label}
        {field.required ? " *" : ""}
      </Text>
      {selectable ? (
        <Pressable
          accessibilityLabel={field.label}
          accessibilityRole="button"
          onPress={onSelect}
          style={[styles.control, error && styles.invalid]}
        >
          <Text
            numberOfLines={2}
            style={[styles.controlText, !value && styles.placeholder]}
          >
            {displayValue || field.placeholder || "Todas as opções"}
          </Text>
          <Lucide
            accessible={false}
            color={mobileRelatorios.textMuted}
            name="chevron-down"
            size={18}
          />
        </Pressable>
      ) : (
        <TextInput
          accessibilityLabel={field.label}
          aria-invalid={Boolean(error)}
          autoCapitalize="none"
          keyboardType={field.kind === "date" ? "number-pad" : "default"}
          maxLength={
            field.kind === "date" ? 10 : field.kind === "month" ? 7 : 200
          }
          onChangeText={onChange}
          placeholder={field.placeholder}
          placeholderTextColor={mobileRelatorios.textSubtle}
          style={[styles.input, error && styles.invalid]}
          value={value}
        />
      )}
      {error ? (
        <Text accessibilityLiveRegion="polite" style={styles.errorText}>
          {error}
        </Text>
      ) : null}
    </View>
  );
}

function StepIndicator() {
  return (
    <View accessibilityLabel="Etapa 1 de 3: Filtros" style={styles.steps}>
      {["Filtros", "Prévia", "Documento"].map((step, index) => (
        <View key={step} style={styles.stepItem}>
          <View style={[styles.stepDot, index === 0 && styles.stepDotActive]}>
            <Text
              style={[
                styles.stepNumber,
                index === 0 && styles.stepNumberActive,
              ]}
            >
              {index + 1}
            </Text>
          </View>
          <Text
            style={[styles.stepLabel, index === 0 && styles.stepLabelActive]}
          >
            {step}
          </Text>
          {index < 2 ? <View style={styles.stepLine} /> : null}
        </View>
      ))}
    </View>
  );
}

function SelectionModal({
  selection,
  tipo,
  selected,
  onClose,
  onSelect,
}: Readonly<{
  selection?: Selection;
  tipo: TipoRelatorio;
  selected: string;
  onClose(): void;
  onSelect(value: string, label: string): void;
}>) {
  const { manager } = useSession();
  const [search, setSearch] = useState("");
  const operations = useMemo(
    () =>
      createRelatoriosOperations(
        publicAppConfig.apiBaseUrl ??
          "http://configuracao-indisponivel.invalid",
      ),
    [],
  );
  const catalog = useRelatorioCatalogo(
    manager,
    operations,
    tipo,
    selection?.catalog,
    search,
    Boolean(selection?.catalog),
  );
  const remote = Boolean(selection?.catalog);
  const options =
    selection?.options?.map((item) => ({
      id: item.value,
      rotulo: item.label,
    })) ?? catalog.items;
  return (
    <Modal
      accessibilityViewIsModal
      animationType="slide"
      onRequestClose={onClose}
      transparent
      visible={Boolean(selection)}
    >
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <View style={styles.modalHeader}>
            <Text accessibilityRole="header" style={styles.modalTitle}>
              {selection?.field.label ?? "Selecionar"}
            </Text>
            <Pressable
              accessibilityLabel="Fechar seleção"
              accessibilityRole="button"
              onPress={onClose}
              style={styles.iconButton}
            >
              <Lucide
                accessible={false}
                color={mobileRelatorios.text}
                name="x"
                size={22}
              />
            </Pressable>
          </View>
          {remote ? (
            <View style={styles.search}>
              <Lucide
                accessible={false}
                color={mobileRelatorios.textMuted}
                name="search"
                size={18}
              />
              <TextInput
                accessibilityLabel="Buscar opções"
                autoCapitalize="none"
                onChangeText={setSearch}
                placeholder="Buscar"
                placeholderTextColor={mobileRelatorios.textSubtle}
                style={styles.searchInput}
                value={search}
              />
            </View>
          ) : null}
          <ScrollView
            contentContainerStyle={styles.options}
            keyboardShouldPersistTaps="handled"
          >
            {!selection?.field.required ? (
              <Pressable
                accessibilityRole="radio"
                accessibilityState={{ checked: !selected }}
                onPress={() => onSelect("", "")}
                style={[styles.option, !selected && styles.optionActive]}
              >
                <Text style={styles.optionText}>Todas as opções</Text>
              </Pressable>
            ) : null}
            {options.map((item) => (
              <Pressable
                accessibilityRole="radio"
                accessibilityState={{ checked: selected === item.id }}
                key={item.id}
                onPress={() => onSelect(item.id, item.rotulo)}
                style={[
                  styles.option,
                  selected === item.id && styles.optionActive,
                ]}
              >
                <Text style={styles.optionText}>{item.rotulo}</Text>
                {selected === item.id ? (
                  <Lucide
                    accessible={false}
                    color={mobileRelatorios.action}
                    name="check"
                    size={18}
                  />
                ) : null}
              </Pressable>
            ))}
            {remote && catalog.loading ? (
              <ActivityIndicator
                accessibilityLabel="Carregando opções"
                color={mobileRelatorios.action}
              />
            ) : null}
            {remote && catalog.error && !catalog.loading ? (
              <View
                accessibilityLiveRegion="polite"
                style={styles.modalFeedback}
              >
                <Text style={styles.errorText}>
                  Não foi possível carregar as opções.
                </Text>
                <Pressable
                  accessibilityRole="button"
                  onPress={() => void catalog.refetch()}
                >
                  <Text style={styles.link}>Tentar novamente</Text>
                </Pressable>
              </View>
            ) : null}
            {remote &&
            !catalog.loading &&
            !catalog.error &&
            options.length === 0 ? (
              <Text accessibilityLiveRegion="polite" style={styles.empty}>
                Nenhuma opção encontrada.
              </Text>
            ) : null}
            {remote && catalog.hasNextPage && !catalog.loading ? (
              <Pressable
                accessibilityRole="button"
                onPress={() => void catalog.fetchNextPage()}
                style={styles.outlineButton}
              >
                <Text style={styles.link}>Carregar mais</Text>
              </Pressable>
            ) : null}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

export function RelatorioFormScreen({
  tipo,
}: Readonly<{ tipo: TipoRelatorio }>) {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const config = relatorioFormConfig[tipo];
  const [draft, setDraft] = useState<RelatorioDraft>(() => initialDraft(tipo));
  const [selectedLabels, setSelectedLabels] = useState<Record<string, string>>(
    () => labels.get(tipo) ?? {},
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [selection, setSelection] = useState<Selection>();
  const [previewRequest, setPreviewRequest] =
    useState<RelatorioPreviaRequest>();
  const wide = width >= 760;
  const update = (name: string, value: string, label?: string) => {
    setErrors((current) => ({ ...current, [name]: "" }));
    setDraft((current) => {
      const next = { ...current, [name]: value };
      drafts.set(tipo, next);
      return next;
    });
    if (label !== undefined) {
      setSelectedLabels((current) => {
        const next = { ...current, [name]: label };
        labels.set(tipo, next);
        return next;
      });
    }
  };
  const clear = () => {
    const next = createRelatorioDraft(tipo);
    drafts.set(tipo, next);
    labels.delete(tipo);
    scrollPositions.delete(tipo);
    setDraft(next);
    setSelectedLabels({});
    setErrors({});
    setPreviewRequest(undefined);
  };
  const submit = () => {
    const result = validateRelatorioDraft(tipo, draft);
    if (!result.success) {
      setErrors(result.errors);
      return;
    }
    setErrors({});
    setPreviewRequest({
      tipo,
      query: result.query,
      ...(result.patrimonioId ? { patrimonioId: result.patrimonioId } : {}),
    });
  };

  useFocusEffect(
    useCallback(() => {
      if (!previewRequest) return undefined;
      const subscription = BackHandler.addEventListener(
        "hardwareBackPress",
        () => {
          setPreviewRequest(undefined);
          return true;
        },
      );
      return () => subscription.remove();
    }, [previewRequest]),
  );

  if (previewRequest) {
    return (
      <RelatorioPreviaScreen
        draft={draft}
        onAdjust={() => setPreviewRequest(undefined)}
        onBack={() => setPreviewRequest(undefined)}
        onPage={(pagina) =>
          setPreviewRequest((current) =>
            current
              ? { ...current, query: { ...current.query, pagina } }
              : current,
          )
        }
        request={previewRequest}
        selectedLabels={selectedLabels}
        tipo={tipo}
      />
    );
  }
  return (
    <>
      <ScrollView
        contentContainerStyle={[styles.content, wide && styles.contentWide]}
        contentOffset={{ x: 0, y: scrollPositions.get(tipo) ?? 0 }}
        keyboardShouldPersistTaps="handled"
        onScroll={(event) =>
          scrollPositions.set(tipo, event.nativeEvent.contentOffset.y)
        }
        scrollEventThrottle={120}
      >
        <Pressable
          accessibilityLabel="Voltar aos relatórios"
          accessibilityRole="button"
          onPress={() => router.back()}
          style={styles.back}
        >
          <Lucide
            accessible={false}
            color={mobileRelatorios.action}
            name="arrow-left"
            size={19}
          />
          <Text style={styles.link}>Relatórios</Text>
        </Pressable>
        <View>
          <Text style={styles.eyebrow}>RELATÓRIO PATRIMONIAL</Text>
          <Text accessibilityRole="header" style={styles.title}>
            {relatorioTitles[tipo]}
          </Text>
          <Text style={styles.subtitle}>{config.subtitle}</Text>
        </View>
        <StepIndicator />
        <View style={styles.formCard}>
          <View style={styles.formHeader}>
            <View>
              <Text accessibilityRole="header" style={styles.formTitle}>
                Filtros
              </Text>
              <Text style={styles.helper}>Campos com * são obrigatórios.</Text>
            </View>
            <Pressable
              accessibilityRole="button"
              onPress={clear}
              style={styles.clearButton}
            >
              <Text style={styles.link}>Limpar</Text>
            </Pressable>
          </View>
          <View style={[styles.fields, wide && styles.fieldsWide]}>
            {(config.fields as readonly RelatorioField[]).map((field) => (
              <View
                key={field.name}
                style={wide ? styles.fieldWide : undefined}
              >
                <Field
                  displayValue={selectedLabels[field.name]}
                  error={errors[field.name]}
                  field={field}
                  onChange={(value) =>
                    update(field.name, formatRelatorioFieldInput(field, value))
                  }
                  onSelect={() =>
                    setSelection({
                      field,
                      catalog: field.catalog,
                      options: field.options,
                    })
                  }
                  value={draft[field.name] ?? ""}
                />
              </View>
            ))}
          </View>
          <Pressable
            accessibilityRole="button"
            onPress={submit}
            style={({ pressed }) => [
              styles.primaryButton,
              pressed && styles.pressed,
            ]}
          >
            <Text style={styles.primaryText}>Continuar para prévia</Text>
            <Lucide
              accessible={false}
              color="#ffffff"
              name="arrow-right"
              size={18}
            />
          </Pressable>
        </View>
      </ScrollView>
      <SelectionModal
        key={selection?.field.name ?? "closed"}
        onClose={() => setSelection(undefined)}
        onSelect={(value, label) => {
          if (selection) update(selection.field.name, value, label);
          setSelection(undefined);
        }}
        selected={selection ? (draft[selection.field.name] ?? "") : ""}
        selection={selection}
        tipo={tipo}
      />
    </>
  );
}

const styles = StyleSheet.create({
  content: {
    alignSelf: "center",
    gap: spacing.xl,
    maxWidth: layout.contentMaxWidth,
    padding: spacing.lg,
    paddingBottom: spacing.xxxl,
    width: "100%",
  },
  contentWide: {
    paddingHorizontal: spacing.xxxl,
    paddingVertical: spacing.xxl,
  },
  back: {
    alignItems: "center",
    alignSelf: "flex-start",
    flexDirection: "row",
    gap: spacing.sm,
    minHeight: 44,
  },
  link: { color: mobileRelatorios.action, fontSize: 13, fontWeight: "800" },
  eyebrow: {
    color: mobileRelatorios.textMuted,
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  title: {
    color: mobileRelatorios.text,
    fontSize: 25,
    fontWeight: "800",
    lineHeight: 33,
    marginTop: spacing.xs,
  },
  subtitle: {
    color: mobileRelatorios.textMuted,
    fontSize: 13,
    lineHeight: 19,
    marginTop: spacing.xs,
  },
  steps: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
  },
  stepItem: { alignItems: "center", flexDirection: "row" },
  stepDot: {
    alignItems: "center",
    backgroundColor: "#e8eef6",
    borderRadius: 16,
    height: 30,
    justifyContent: "center",
    width: 30,
  },
  stepDotActive: { backgroundColor: mobileRelatorios.action },
  stepNumber: {
    color: mobileRelatorios.textMuted,
    fontSize: 12,
    fontWeight: "800",
  },
  stepNumberActive: { color: "#ffffff" },
  stepLabel: {
    color: mobileRelatorios.textMuted,
    fontSize: 11,
    marginLeft: spacing.xs,
  },
  stepLabelActive: { color: mobileRelatorios.action, fontWeight: "800" },
  stepLine: {
    backgroundColor: mobileRelatorios.border,
    height: 1,
    marginHorizontal: spacing.sm,
    width: 24,
  },
  formCard: {
    backgroundColor: mobileRelatorios.surface,
    borderColor: mobileRelatorios.border,
    borderRadius: radii.lg,
    borderWidth: 1,
    gap: spacing.lg,
    padding: spacing.lg,
  },
  formHeader: {
    alignItems: "flex-start",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  formTitle: {
    color: mobileRelatorios.information,
    fontSize: 18,
    fontWeight: "800",
  },
  helper: {
    color: mobileRelatorios.textMuted,
    fontSize: 11,
    marginTop: spacing.xs,
  },
  clearButton: {
    justifyContent: "center",
    minHeight: 44,
    paddingHorizontal: spacing.sm,
  },
  fields: { gap: spacing.lg },
  fieldsWide: { flexDirection: "row", flexWrap: "wrap" },
  fieldWide: { flexBasis: "47%", flexGrow: 1, minWidth: 280 },
  field: { gap: spacing.xs },
  label: {
    color: mobileRelatorios.information,
    fontSize: 12,
    fontWeight: "800",
  },
  input: {
    backgroundColor: "#ffffff",
    borderColor: mobileRelatorios.border,
    borderRadius: radii.md,
    borderWidth: 1,
    color: mobileRelatorios.text,
    fontSize: 14,
    minHeight: 48,
    paddingHorizontal: spacing.md,
  },
  control: {
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderColor: mobileRelatorios.border,
    borderRadius: radii.md,
    borderWidth: 1,
    flexDirection: "row",
    gap: spacing.sm,
    minHeight: 48,
    paddingHorizontal: spacing.md,
  },
  controlText: { color: mobileRelatorios.text, flex: 1, fontSize: 14 },
  placeholder: { color: mobileRelatorios.textSubtle },
  invalid: { borderColor: mobileRelatorios.danger },
  errorText: { color: mobileRelatorios.danger, fontSize: 11, lineHeight: 16 },
  primaryButton: {
    alignItems: "center",
    backgroundColor: mobileRelatorios.action,
    borderRadius: radii.md,
    flexDirection: "row",
    gap: spacing.sm,
    justifyContent: "center",
    minHeight: 50,
    paddingHorizontal: spacing.lg,
  },
  primaryText: { color: "#ffffff", fontSize: 14, fontWeight: "800" },
  pressed: { opacity: 0.75 },
  overlay: {
    backgroundColor: "rgba(15, 23, 42, 0.48)",
    flex: 1,
    justifyContent: "flex-end",
  },
  modal: {
    backgroundColor: "#ffffff",
    borderTopLeftRadius: radii.lg,
    borderTopRightRadius: radii.lg,
    maxHeight: "82%",
    padding: spacing.lg,
  },
  modalHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  modalTitle: { color: mobileRelatorios.text, fontSize: 18, fontWeight: "800" },
  iconButton: {
    alignItems: "center",
    height: 44,
    justifyContent: "center",
    width: 44,
  },
  search: {
    alignItems: "center",
    borderColor: mobileRelatorios.border,
    borderRadius: radii.md,
    borderWidth: 1,
    flexDirection: "row",
    marginTop: spacing.md,
    paddingLeft: spacing.md,
  },
  searchInput: {
    color: mobileRelatorios.text,
    flex: 1,
    minHeight: 46,
    paddingHorizontal: spacing.md,
  },
  options: {
    gap: spacing.sm,
    paddingBottom: spacing.xl,
    paddingTop: spacing.md,
  },
  option: {
    alignItems: "center",
    borderColor: mobileRelatorios.border,
    borderRadius: radii.md,
    borderWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    minHeight: 48,
    padding: spacing.md,
  },
  optionActive: {
    backgroundColor: mobileRelatorios.actionSurface,
    borderColor: mobileRelatorios.action,
  },
  optionText: { color: mobileRelatorios.text, flex: 1, fontSize: 13 },
  modalFeedback: { alignItems: "center", gap: spacing.sm, padding: spacing.lg },
  empty: {
    color: mobileRelatorios.textMuted,
    padding: spacing.lg,
    textAlign: "center",
  },
  outlineButton: {
    alignItems: "center",
    borderColor: mobileRelatorios.border,
    borderRadius: radii.md,
    borderWidth: 1,
    minHeight: 46,
    justifyContent: "center",
  },
});
