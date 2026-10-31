import { Lucide } from "@react-native-vector-icons/lucide";
import type {
  EspecieResumo,
  PatrimonioResumo,
  SetorResumo,
  StatusPatrimonio,
  TipoNumeroPatrimonial,
} from "@repo/contracts";
import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from "react-native";
import { layout, mobilePatrimonios, radii, spacing } from "../../theme/tokens";
import { useSession } from "../auth/session/session-context";
import { formatPatrimonioNumber, formatStatus } from "./patrimonio-formatters";
import {
  patrimonioErrorMessage,
  type PatrimonioFilters,
  usePatrimonioCatalogs,
  usePatrimonios,
} from "./use-patrimonios";

const STATUS_OPTIONS: readonly Readonly<{
  value: StatusPatrimonio;
  label: string;
}>[] = [
  { value: "ATIVO", label: "Ativo" },
  { value: "EMPRESTADO", label: "Emprestado" },
  { value: "EM_MANUTENCAO", label: "Em manutenção" },
  { value: "BAIXADO", label: "Baixado" },
];

const NUMBER_TYPE_OPTIONS: readonly Readonly<{
  value: TipoNumeroPatrimonial;
  label: string;
}>[] = [
  { value: "OFICIAL", label: "Número oficial" },
  { value: "SEM_NUMERO_OFICIAL", label: "Sem número oficial" },
];

function StatusBadge({ status }: Readonly<{ status: StatusPatrimonio }>) {
  const warning = status === "EM_MANUTENCAO";
  const danger = status === "BAIXADO";
  return (
    <View
      style={[
        styles.badge,
        warning && styles.badgeWarning,
        danger && styles.badgeDanger,
      ]}
    >
      <Text
        style={[
          styles.badgeText,
          warning && styles.badgeWarningText,
          danger && styles.badgeDangerText,
        ]}
      >
        {formatStatus(status)}
      </Text>
    </View>
  );
}

export function PatrimonioCard({
  patrimonio,
  onPress,
}: Readonly<{ patrimonio: PatrimonioResumo; onPress(): void }>) {
  const details = [patrimonio.marca, patrimonio.modelo]
    .filter(Boolean)
    .join(" · ");
  return (
    <Pressable
      accessibilityHint="Abre os dados e valores deste patrimônio"
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      <View style={styles.cardHeader}>
        <Text style={styles.number}>
          {formatPatrimonioNumber(
            patrimonio.numeroPatrimonio,
            patrimonio.tipoNumeroPatrimonial,
          )}
        </Text>
        <StatusBadge status={patrimonio.status} />
      </View>
      <Text numberOfLines={2} style={styles.cardTitle}>
        {patrimonio.descricao}
      </Text>
      <View style={styles.cardLine}>
        <Lucide
          accessible={false}
          color={mobilePatrimonios.textMuted}
          name="map-pin"
          size={15}
        />
        <Text numberOfLines={1} style={styles.cardLineText}>
          {patrimonio.setorAtual.nome}
        </Text>
      </View>
      {details ? (
        <Text numberOfLines={1} style={styles.cardMeta}>
          {details}
        </Text>
      ) : null}
      <View style={styles.cardFooter}>
        <Text style={styles.cardMeta}>{patrimonio.especie.nome}</Text>
        <Lucide
          accessible={false}
          color={mobilePatrimonios.textMuted}
          name="chevron-right"
          size={18}
        />
      </View>
    </Pressable>
  );
}

type SelectOption = Readonly<{ value: string; label: string }>;

function FilterGroup({
  label,
  options,
  selected,
  onSelect,
}: Readonly<{
  label: string;
  options: readonly SelectOption[];
  selected?: string;
  onSelect(value: string | undefined): void;
}>) {
  return (
    <View style={styles.filterGroup}>
      <Text style={styles.filterLabel}>{label}</Text>
      <View style={styles.optionList}>
        <Pressable
          accessibilityRole="radio"
          accessibilityState={{ checked: selected === undefined }}
          onPress={() => onSelect(undefined)}
          style={[
            styles.option,
            selected === undefined && styles.optionSelected,
          ]}
        >
          <Text
            style={[
              styles.optionText,
              selected === undefined && styles.optionTextSelected,
            ]}
          >
            Todos
          </Text>
        </Pressable>
        {options.map((option) => {
          const active = selected === option.value;
          return (
            <Pressable
              accessibilityRole="radio"
              accessibilityState={{ checked: active }}
              key={option.value}
              onPress={() => onSelect(option.value)}
              style={[styles.option, active && styles.optionSelected]}
            >
              <Text
                style={[styles.optionText, active && styles.optionTextSelected]}
              >
                {option.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function FilterModal({
  visible,
  initial,
  setores,
  especies,
  naturezas,
  catalogsLoading,
  catalogsError,
  onRetryCatalogs,
  onClose,
  onApply,
}: Readonly<{
  visible: boolean;
  initial: PatrimonioFilters;
  setores: readonly SetorResumo[];
  especies: readonly EspecieResumo[];
  naturezas: readonly SelectOption[];
  catalogsLoading: boolean;
  catalogsError?: string;
  onRetryCatalogs(): void;
  onClose(): void;
  onApply(filters: PatrimonioFilters): void;
}>) {
  const [draft, setDraft] = useState<PatrimonioFilters>(initial);

  return (
    <Modal
      accessibilityViewIsModal
      animationType="slide"
      onRequestClose={onClose}
      transparent
      visible={visible}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalCard}>
          <View style={styles.modalHeader}>
            <View>
              <Text accessibilityRole="header" style={styles.modalTitle}>
                Filtrar bens
              </Text>
              <Text style={styles.modalSubtitle}>
                Combine os filtros disponíveis.
              </Text>
            </View>
            <Pressable
              accessibilityLabel="Fechar filtros"
              accessibilityRole="button"
              onPress={onClose}
              style={styles.iconButton}
            >
              <Lucide
                accessible={false}
                color={mobilePatrimonios.text}
                name="x"
                size={22}
              />
            </Pressable>
          </View>
          <ScrollView contentContainerStyle={styles.modalContent}>
            <FilterGroup
              label="Situação"
              onSelect={(status) =>
                setDraft((current) => ({
                  ...current,
                  status: status as StatusPatrimonio | undefined,
                }))
              }
              options={STATUS_OPTIONS}
              selected={draft.status}
            />
            <FilterGroup
              label="Tipo de numeração"
              onSelect={(tipoNumeroPatrimonial) =>
                setDraft((current) => ({
                  ...current,
                  tipoNumeroPatrimonial: tipoNumeroPatrimonial as
                    TipoNumeroPatrimonial | undefined,
                }))
              }
              options={NUMBER_TYPE_OPTIONS}
              selected={draft.tipoNumeroPatrimonial}
            />
            {catalogsLoading ? (
              <View accessibilityLiveRegion="polite" style={styles.inlineState}>
                <ActivityIndicator color={mobilePatrimonios.action} />
                <Text style={styles.stateText}>Carregando catálogos…</Text>
              </View>
            ) : catalogsError ? (
              <View accessibilityLiveRegion="polite" style={styles.inlineState}>
                <Text style={styles.errorText}>{catalogsError}</Text>
                <Pressable
                  accessibilityRole="button"
                  onPress={onRetryCatalogs}
                  style={styles.secondaryButton}
                >
                  <Text style={styles.secondaryButtonText}>
                    Tentar novamente
                  </Text>
                </Pressable>
              </View>
            ) : (
              <>
                <FilterGroup
                  label="Setor"
                  onSelect={(setorId) =>
                    setDraft((current) => ({ ...current, setorId }))
                  }
                  options={setores.map((item) => ({
                    value: item.id,
                    label: item.nome,
                  }))}
                  selected={draft.setorId}
                />
                <FilterGroup
                  label="Espécie"
                  onSelect={(especieId) =>
                    setDraft((current) => ({ ...current, especieId }))
                  }
                  options={especies.map((item) => ({
                    value: item.id,
                    label: item.nome,
                  }))}
                  selected={draft.especieId}
                />
                <FilterGroup
                  label="Natureza"
                  onSelect={(naturezaId) =>
                    setDraft((current) => ({ ...current, naturezaId }))
                  }
                  options={naturezas}
                  selected={draft.naturezaId}
                />
              </>
            )}
          </ScrollView>
          <View style={styles.modalActions}>
            <Pressable
              accessibilityRole="button"
              onPress={() => setDraft({})}
              style={styles.secondaryButton}
            >
              <Text style={styles.secondaryButtonText}>Limpar filtros</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              onPress={() => onApply(draft)}
              style={styles.primaryButton}
            >
              <Text style={styles.primaryButtonText}>Aplicar filtros</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

export function PatrimoniosScreen() {
  const router = useRouter();
  const { manager } = useSession();
  const { width } = useWindowDimensions();
  const wide = width >= layout.wideMinWidth;
  const [searchText, setSearchText] = useState("");
  const [submittedSearch, setSubmittedSearch] = useState<string>();
  const [filters, setFilters] = useState<PatrimonioFilters>({});
  const [page, setPage] = useState(1);
  const [filtersVisible, setFiltersVisible] = useState(false);
  const { state, isFetching, reload } = usePatrimonios(
    manager,
    submittedSearch,
    filters,
    page,
  );
  const catalogs = usePatrimonioCatalogs(manager);
  const activeFilterCount = Object.values(filters).filter(Boolean).length;

  const catalogValues = useMemo(() => {
    if (catalogs.state.status !== "success")
      return { setores: [], especies: [], naturezas: [] };
    return catalogs.state.data;
  }, [catalogs.state]);

  const submitSearch = () => {
    const normalized = searchText.trim();
    setPage(1);
    setSubmittedSearch(normalized || undefined);
  };

  const header = (
    <View style={styles.header}>
      <Text style={styles.eyebrow}>BENS</Text>
      <Text accessibilityRole="header" style={styles.title}>
        Consultar bens
      </Text>
      <Text style={styles.subtitle}>Encontre um bem do patrimônio.</Text>
      <View style={styles.searchBox}>
        <Lucide
          accessible={false}
          color={mobilePatrimonios.textMuted}
          name="search"
          size={20}
        />
        <TextInput
          accessibilityLabel="Buscar patrimônio"
          enterKeyHint="search"
          maxLength={200}
          onChangeText={setSearchText}
          onSubmitEditing={submitSearch}
          placeholder="Número exato ou descrição"
          placeholderTextColor={mobilePatrimonios.textSubtle}
          returnKeyType="search"
          style={styles.searchInput}
          value={searchText}
        />
        {searchText ? (
          <Pressable
            accessibilityLabel="Limpar texto da busca"
            accessibilityRole="button"
            onPress={() => {
              setSearchText("");
              setSubmittedSearch(undefined);
              setPage(1);
            }}
            style={styles.searchClear}
          >
            <Lucide
              accessible={false}
              color={mobilePatrimonios.textMuted}
              name="x"
              size={18}
            />
          </Pressable>
        ) : null}
      </View>
      <Text style={styles.searchHint}>
        Também por marca, modelo ou número de série.
      </Text>
      <View style={styles.listHeading}>
        <View>
          <Text style={styles.sectionTitle}>Todos os bens</Text>
          <Text style={styles.resultCount}>
            {state.status === "success" && isFetching
              ? "Atualizando bens…"
              : state.status === "success"
                ? `${state.data.meta.total.toLocaleString("pt-BR")} ${state.data.meta.total === 1 ? "bem encontrado" : "bens encontrados"}`
                : "Consultando bens…"}
          </Text>
        </View>
        <Pressable
          accessibilityLabel={`Filtros${activeFilterCount ? `, ${activeFilterCount} ativos` : ""}`}
          accessibilityRole="button"
          onPress={() => setFiltersVisible(true)}
          style={styles.filterButton}
        >
          <Lucide
            accessible={false}
            color={mobilePatrimonios.action}
            name="sliders-horizontal"
            size={18}
          />
          <Text style={styles.filterButtonText}>
            Filtros{activeFilterCount ? ` (${activeFilterCount})` : ""}
          </Text>
        </Pressable>
      </View>
      {submittedSearch ? (
        <Pressable
          accessibilityRole="button"
          onPress={() => {
            setSearchText("");
            setSubmittedSearch(undefined);
            setPage(1);
          }}
          style={styles.clearSearchButton}
        >
          <Text style={styles.clearSearchText}>Limpar busca</Text>
        </Pressable>
      ) : null}
    </View>
  );

  if (state.status === "loading") {
    return (
      <View style={styles.screen}>
        {header}
        <View accessibilityLabel="Carregando patrimônios" style={styles.center}>
          <ActivityIndicator color={mobilePatrimonios.action} size="large" />
          <Text style={styles.stateText}>Carregando patrimônios…</Text>
        </View>
        <FilterModal
          catalogsError={
            catalogs.state.status === "error"
              ? patrimonioErrorMessage(catalogs.state.error)
              : undefined
          }
          catalogsLoading={catalogs.state.status === "loading"}
          especies={catalogValues.especies}
          initial={filters}
          naturezas={catalogValues.naturezas.map((item) => ({
            value: item.id,
            label: item.nome,
          }))}
          onApply={(next) => {
            setFilters(next);
            setPage(1);
            setFiltersVisible(false);
          }}
          onClose={() => setFiltersVisible(false)}
          onRetryCatalogs={catalogs.reload}
          setores={catalogValues.setores}
          visible={filtersVisible}
        />
      </View>
    );
  }

  if (state.status === "error") {
    return (
      <View style={styles.screen}>
        {header}
        <View accessibilityLiveRegion="polite" style={styles.center}>
          <Lucide
            accessible={false}
            color={mobilePatrimonios.danger}
            name="circle-alert"
            size={28}
          />
          <Text style={styles.errorTitle}>Bens indisponíveis</Text>
          <Text style={styles.errorText}>
            {patrimonioErrorMessage(state.error)}
          </Text>
          {state.error.status !== 401 ? (
            <Pressable
              accessibilityRole="button"
              onPress={reload}
              style={styles.primaryButton}
            >
              <Text style={styles.primaryButtonText}>Tentar novamente</Text>
            </Pressable>
          ) : null}
        </View>
      </View>
    );
  }

  const emptySearch = Boolean(submittedSearch || activeFilterCount);
  return (
    <View style={styles.screen}>
      <FlatList
        columnWrapperStyle={wide ? styles.columns : undefined}
        contentContainerStyle={styles.listContent}
        data={state.data.dados}
        key={wide ? "wide" : "narrow"}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={
          <View accessibilityLiveRegion="polite" style={styles.emptyState}>
            <Lucide
              accessible={false}
              color={mobilePatrimonios.textMuted}
              name="package-search"
              size={32}
            />
            <Text style={styles.errorTitle}>
              {emptySearch ? "Nenhum bem encontrado" : "Nenhum bem cadastrado"}
            </Text>
            <Text style={styles.stateText}>
              {emptySearch
                ? "Revise a busca ou os filtros aplicados."
                : "Nenhum patrimônio foi encontrado para esta consulta."}
            </Text>
          </View>
        }
        ListFooterComponent={
          state.data.meta.total > 0 ? (
            <View
              accessibilityLabel={`Página ${state.data.meta.pagina} de ${state.data.meta.ultimaPagina}`}
              style={styles.pagination}
            >
              <Pressable
                accessibilityRole="button"
                accessibilityState={{ disabled: page <= 1 }}
                disabled={page <= 1}
                onPress={() => setPage((current) => current - 1)}
                style={styles.pageButton}
              >
                <Lucide
                  accessible={false}
                  color={
                    page <= 1
                      ? mobilePatrimonios.textSubtle
                      : mobilePatrimonios.action
                  }
                  name="chevron-left"
                  size={18}
                />
                <Text style={styles.pageButtonText}>Anterior</Text>
              </Pressable>
              <Text style={styles.pageText}>
                {state.data.meta.pagina} de {state.data.meta.ultimaPagina}
              </Text>
              <Pressable
                accessibilityRole="button"
                accessibilityState={{
                  disabled: page >= state.data.meta.ultimaPagina,
                }}
                disabled={page >= state.data.meta.ultimaPagina}
                onPress={() => setPage((current) => current + 1)}
                style={styles.pageButton}
              >
                <Text style={styles.pageButtonText}>Próxima</Text>
                <Lucide
                  accessible={false}
                  color={
                    page >= state.data.meta.ultimaPagina
                      ? mobilePatrimonios.textSubtle
                      : mobilePatrimonios.action
                  }
                  name="chevron-right"
                  size={18}
                />
              </Pressable>
            </View>
          ) : undefined
        }
        ListHeaderComponent={header}
        numColumns={wide ? 2 : 1}
        onRefresh={reload}
        refreshing={false}
        renderItem={({ item }) => (
          <View style={wide ? styles.cardColumn : undefined}>
            <PatrimonioCard
              onPress={() =>
                router.push({
                  pathname: "/bens/[patrimonioId]",
                  params: { patrimonioId: item.id },
                })
              }
              patrimonio={item}
            />
          </View>
        )}
      />
      <FilterModal
        catalogsError={
          catalogs.state.status === "error"
            ? patrimonioErrorMessage(catalogs.state.error)
            : undefined
        }
        catalogsLoading={catalogs.state.status === "loading"}
        especies={catalogValues.especies}
        initial={filters}
        key={filtersVisible ? JSON.stringify(filters) : "closed"}
        naturezas={catalogValues.naturezas.map((item) => ({
          value: item.id,
          label: item.nome,
        }))}
        onApply={(next) => {
          setFilters(next);
          setPage(1);
          setFiltersVisible(false);
        }}
        onClose={() => setFiltersVisible(false)}
        onRetryCatalogs={catalogs.reload}
        setores={catalogValues.setores}
        visible={filtersVisible}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { backgroundColor: mobilePatrimonios.canvas, flex: 1 },
  listContent: {
    alignSelf: "center",
    maxWidth: layout.contentMaxWidth,
    paddingBottom: spacing.xxl,
    paddingHorizontal: spacing.xl,
    width: "100%",
  },
  header: { paddingBottom: spacing.md, paddingTop: spacing.xxl },
  eyebrow: {
    color: mobilePatrimonios.textMuted,
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  title: {
    color: mobilePatrimonios.text,
    fontSize: 26,
    fontWeight: "800",
    marginTop: spacing.xs,
  },
  subtitle: {
    color: mobilePatrimonios.textMuted,
    fontSize: 15,
    marginTop: spacing.xs,
  },
  searchBox: {
    alignItems: "center",
    backgroundColor: mobilePatrimonios.surface,
    borderColor: mobilePatrimonios.border,
    borderRadius: radii.md,
    borderWidth: 1,
    flexDirection: "row",
    marginTop: spacing.lg,
    minHeight: layout.comfortableTouchTarget,
    paddingHorizontal: spacing.md,
  },
  searchInput: {
    color: mobilePatrimonios.text,
    flex: 1,
    fontSize: 15,
    minHeight: layout.comfortableTouchTarget,
    paddingHorizontal: spacing.md,
  },
  searchClear: {
    alignItems: "center",
    height: 44,
    justifyContent: "center",
    width: 44,
  },
  searchHint: {
    color: mobilePatrimonios.textSubtle,
    fontSize: 11,
    marginTop: spacing.sm,
  },
  listHeading: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: spacing.xl,
  },
  sectionTitle: {
    color: mobilePatrimonios.text,
    fontSize: 15,
    fontWeight: "800",
  },
  resultCount: {
    color: mobilePatrimonios.textMuted,
    fontSize: 12,
    marginTop: spacing.sm,
  },
  filterButton: {
    alignItems: "center",
    backgroundColor: mobilePatrimonios.surface,
    borderColor: mobilePatrimonios.border,
    borderRadius: radii.md,
    borderWidth: 1,
    flexDirection: "row",
    gap: spacing.sm,
    minHeight: layout.comfortableTouchTarget,
    paddingHorizontal: spacing.lg,
  },
  filterButtonText: { color: mobilePatrimonios.text, fontWeight: "700" },
  clearSearchButton: {
    alignSelf: "flex-end",
    minHeight: 36,
    justifyContent: "center",
  },
  clearSearchText: {
    color: mobilePatrimonios.action,
    fontSize: 12,
    fontWeight: "700",
  },
  columns: { gap: spacing.md },
  cardColumn: { flex: 1 },
  card: {
    backgroundColor: mobilePatrimonios.surface,
    borderColor: mobilePatrimonios.border,
    borderRadius: radii.md,
    borderWidth: 1,
    marginBottom: spacing.md,
    minHeight: 150,
    padding: spacing.md,
  },
  pressed: { opacity: 0.78 },
  cardHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  number: { color: mobilePatrimonios.textMuted, fontSize: 11 },
  badge: {
    backgroundColor: mobilePatrimonios.successSurface,
    borderRadius: radii.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  badgeWarning: { backgroundColor: mobilePatrimonios.warningSurface },
  badgeDanger: { backgroundColor: mobilePatrimonios.dangerSurface },
  badgeText: {
    color: mobilePatrimonios.success,
    fontSize: 10,
    fontWeight: "800",
  },
  badgeWarningText: { color: mobilePatrimonios.warning },
  badgeDangerText: { color: mobilePatrimonios.danger },
  cardTitle: {
    color: mobilePatrimonios.text,
    fontSize: 15,
    fontWeight: "800",
    marginTop: spacing.sm,
  },
  cardLine: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.xs,
    marginTop: spacing.sm,
  },
  cardLineText: { color: mobilePatrimonios.textMuted, flex: 1, fontSize: 12 },
  cardMeta: {
    color: mobilePatrimonios.textMuted,
    fontSize: 11,
    marginTop: spacing.sm,
  },
  cardFooter: {
    alignItems: "flex-end",
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: "auto",
  },
  center: {
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
    padding: spacing.xxl,
  },
  stateText: {
    color: mobilePatrimonios.textMuted,
    fontSize: 14,
    marginTop: spacing.md,
    textAlign: "center",
  },
  errorTitle: {
    color: mobilePatrimonios.text,
    fontSize: 18,
    fontWeight: "800",
    marginTop: spacing.md,
    textAlign: "center",
  },
  errorText: {
    color: mobilePatrimonios.danger,
    fontSize: 14,
    marginTop: spacing.sm,
    textAlign: "center",
  },
  emptyState: {
    alignItems: "center",
    minHeight: 260,
    justifyContent: "center",
    padding: spacing.xxl,
  },
  pagination: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: spacing.lg,
  },
  pageButton: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.xs,
    minHeight: 44,
    justifyContent: "center",
  },
  pageButtonText: { color: mobilePatrimonios.textMuted, fontSize: 12 },
  pageText: { color: mobilePatrimonios.textMuted, fontSize: 12 },
  modalOverlay: {
    backgroundColor: mobilePatrimonios.overlay,
    flex: 1,
    justifyContent: "flex-end",
  },
  modalCard: {
    backgroundColor: mobilePatrimonios.surface,
    borderTopLeftRadius: radii.lg,
    borderTopRightRadius: radii.lg,
    maxHeight: "90%",
    paddingTop: spacing.xl,
  },
  modalHeader: {
    alignItems: "flex-start",
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: spacing.xl,
  },
  modalTitle: {
    color: mobilePatrimonios.text,
    fontSize: 22,
    fontWeight: "800",
  },
  modalSubtitle: {
    color: mobilePatrimonios.textMuted,
    fontSize: 13,
    marginTop: spacing.xs,
  },
  iconButton: {
    alignItems: "center",
    height: 48,
    justifyContent: "center",
    width: 48,
  },
  modalContent: { padding: spacing.xl },
  filterGroup: { marginBottom: spacing.xl },
  filterLabel: {
    color: mobilePatrimonios.text,
    fontSize: 14,
    fontWeight: "800",
    marginBottom: spacing.sm,
  },
  optionList: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  option: {
    borderColor: mobilePatrimonios.border,
    borderRadius: radii.pill,
    borderWidth: 1,
    minHeight: 40,
    justifyContent: "center",
    paddingHorizontal: spacing.md,
  },
  optionSelected: {
    backgroundColor: mobilePatrimonios.actionSurface,
    borderColor: mobilePatrimonios.action,
  },
  optionText: { color: mobilePatrimonios.textMuted, fontSize: 13 },
  optionTextSelected: { color: mobilePatrimonios.action, fontWeight: "800" },
  inlineState: {
    alignItems: "center",
    backgroundColor: mobilePatrimonios.canvas,
    borderRadius: radii.md,
    marginBottom: spacing.xl,
    padding: spacing.lg,
  },
  modalActions: {
    borderTopColor: mobilePatrimonios.border,
    borderTopWidth: 1,
    flexDirection: "row",
    gap: spacing.md,
    padding: spacing.lg,
  },
  primaryButton: {
    alignItems: "center",
    backgroundColor: mobilePatrimonios.action,
    borderRadius: radii.md,
    flex: 1,
    justifyContent: "center",
    minHeight: layout.comfortableTouchTarget,
    paddingHorizontal: spacing.lg,
  },
  primaryButtonText: { color: "#ffffff", fontWeight: "800" },
  secondaryButton: {
    alignItems: "center",
    backgroundColor: mobilePatrimonios.surface,
    borderColor: mobilePatrimonios.border,
    borderRadius: radii.md,
    borderWidth: 1,
    flex: 1,
    justifyContent: "center",
    minHeight: layout.comfortableTouchTarget,
    paddingHorizontal: spacing.lg,
  },
  secondaryButtonText: { color: mobilePatrimonios.text, fontWeight: "700" },
});
