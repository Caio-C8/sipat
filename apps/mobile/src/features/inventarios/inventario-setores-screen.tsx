import { Lucide } from "@react-native-vector-icons/lucide";
import type { StatusSetorInventario } from "@repo/contracts";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from "react-native";
import { layout, mobileInventarios, radii, spacing } from "../../theme/tokens";
import { useSession } from "../auth/session/session-context";
import {
  Notice,
  Pagination,
  SetorCard,
  StatusBadge,
} from "./inventario-components";
import {
  inventarioErrorMessage,
  useInventarioSetores,
} from "./use-inventarios";

const statusOptions: readonly [StatusSetorInventario | undefined, string][] = [
  [undefined, "Todos"],
  ["PENDENTE", "Pendentes"],
  ["EM_ANDAMENTO", "Em andamento"],
  ["CONCLUIDO", "Concluídos"],
];

export function InventarioSetoresScreen({
  inventarioId,
  validId,
}: Readonly<{ inventarioId: string; validId: boolean }>) {
  const router = useRouter();
  const { manager, state: session } = useSession();
  const { width } = useWindowDimensions();
  const wide = width >= layout.wideMinWidth;
  const [searchText, setSearchText] = useState("");
  const [submittedSearch, setSubmittedSearch] = useState<string>();
  const [status, setStatus] = useState<StatusSetorInventario>();
  const [page, setPage] = useState(1);
  const { state, reload } = useInventarioSetores(
    manager,
    inventarioId,
    validId,
    submittedSearch,
    status,
    page,
  );
  const isAdmin =
    session.status === "authenticated" &&
    session.identity.perfil === "ADMINISTRADOR";
  const reloadRef = useRef(reload);
  const focusedOnce = useRef(false);

  useEffect(() => {
    reloadRef.current = reload;
  }, [reload]);

  useFocusEffect(
    useCallback(() => {
      if (focusedOnce.current) void reloadRef.current();
      else focusedOnce.current = true;
    }, []),
  );

  const submitSearch = () => {
    setPage(1);
    const normalized = searchText.trim();
    setSubmittedSearch(normalized || undefined);
  };

  if (state.status === "loading") {
    return (
      <View
        accessibilityLabel="Carregando setores do inventário"
        style={styles.center}
      >
        <ActivityIndicator color={mobileInventarios.action} size="large" />
        <Text style={styles.stateText}>Carregando inventário e setores…</Text>
      </View>
    );
  }

  if (state.status === "error") {
    return (
      <View accessibilityLiveRegion="polite" style={styles.center}>
        <Lucide
          accessible={false}
          color={mobileInventarios.danger}
          name="circle-alert"
          size={30}
        />
        <Text accessibilityRole="header" style={styles.errorTitle}>
          Inventário indisponível
        </Text>
        <Text style={styles.errorText}>
          {validId
            ? inventarioErrorMessage(state.error, true)
            : "O endereço informado não contém um identificador de inventário válido."}
        </Text>
        {validId && state.error.status !== 401 ? (
          <Pressable
            accessibilityRole="button"
            onPress={reload}
            style={styles.primaryButton}
          >
            <Text style={styles.primaryButtonText}>Tentar novamente</Text>
          </Pressable>
        ) : null}
      </View>
    );
  }

  const { inventario, setores } = state.data;
  return (
    <ScrollView
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      <Pressable
        accessibilityRole="button"
        onPress={() => router.back()}
        style={styles.backButton}
      >
        <Lucide
          accessible={false}
          color={mobileInventarios.text}
          name="arrow-left"
          size={18}
        />
        <Text style={styles.backText}>Voltar aos inventários</Text>
      </Pressable>
      <View style={styles.titleRow}>
        <View style={styles.titleBlock}>
          <Text style={styles.eyebrow}>INVENTÁRIO SELECIONADO</Text>
          <Text accessibilityRole="header" style={styles.title}>
            {inventario.nome}
          </Text>
          <Text style={styles.subtitle}>{inventario.comissao.nome}</Text>
        </View>
        <StatusBadge status={inventario.status} />
      </View>
      <Notice title="Inventário selecionado">
        Os setores abaixo pertencem a {inventario.nome}. Volte para trocar de
        inventário.
      </Notice>
      {isAdmin ? (
        <Notice title="Conferência restrita">
          Você pode consultar o progresso, mas iniciar ou retomar setores exige
          o perfil Diretor de Patrimônio.
        </Notice>
      ) : null}
      <View style={styles.searchBox}>
        <Lucide
          accessible={false}
          color={mobileInventarios.textMuted}
          name="search"
          size={20}
        />
        <TextInput
          accessibilityLabel="Buscar setor do inventário"
          enterKeyHint="search"
          maxLength={200}
          onChangeText={setSearchText}
          onSubmitEditing={submitSearch}
          placeholder="Buscar setor"
          placeholderTextColor={mobileInventarios.textSubtle}
          returnKeyType="search"
          style={styles.searchInput}
          value={searchText}
        />
        {searchText ? (
          <Pressable
            accessibilityLabel="Limpar busca"
            accessibilityRole="button"
            onPress={() => {
              setSearchText("");
              setSubmittedSearch(undefined);
              setPage(1);
            }}
            style={styles.clearButton}
          >
            <Lucide
              accessible={false}
              color={mobileInventarios.textMuted}
              name="x"
              size={18}
            />
          </Pressable>
        ) : null}
      </View>
      <ScrollView
        accessibilityRole="tablist"
        contentContainerStyle={styles.tabs}
        horizontal
        showsHorizontalScrollIndicator={false}
      >
        {statusOptions.map(([value, label]) => {
          const active = status === value;
          return (
            <Pressable
              accessibilityRole="tab"
              accessibilityState={{ selected: active }}
              key={value ?? "todos"}
              onPress={() => {
                setStatus(value);
                setPage(1);
              }}
              style={[styles.tab, active && styles.tabActive]}
            >
              <Text style={[styles.tabText, active && styles.tabTextActive]}>
                {label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
      <View style={styles.listHeader}>
        <Text style={styles.sectionTitle}>Setores cadastrados</Text>
        <Text style={styles.countText}>
          {setores.meta.total.toLocaleString("pt-BR")}
        </Text>
      </View>
      {setores.dados.length === 0 ? (
        <View accessibilityLiveRegion="polite" style={styles.emptyState}>
          <Text style={styles.emptyTitle}>Nenhum setor encontrado</Text>
          <Text style={styles.stateText}>
            Revise a busca ou o status selecionado.
          </Text>
        </View>
      ) : (
        <View style={styles.grid}>
          {setores.dados.map((setor) => (
            <SetorCard
              key={setor.id}
              onPress={() =>
                router.push({
                  pathname:
                    "/inventarios/[inventarioId]/setores/[setorInventarioId]",
                  params: { inventarioId, setorInventarioId: setor.id },
                })
              }
              setor={setor}
              wide={wide}
            />
          ))}
        </View>
      )}
      <Pagination
        lastPage={setores.meta.ultimaPagina}
        onPage={setPage}
        page={page}
      />
      <Pressable
        accessibilityRole="button"
        onPress={reload}
        style={styles.refreshButton}
      >
        <Lucide
          accessible={false}
          color={mobileInventarios.action}
          name="refresh-cw"
          size={18}
        />
        <Text style={styles.refreshText}>Atualizar dados</Text>
      </Pressable>
    </ScrollView>
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
  stateText: {
    color: mobileInventarios.textMuted,
    fontSize: 14,
    marginTop: spacing.sm,
    textAlign: "center",
  },
  errorTitle: {
    color: mobileInventarios.text,
    fontSize: 20,
    fontWeight: "800",
    marginTop: spacing.md,
  },
  errorText: {
    color: mobileInventarios.textMuted,
    fontSize: 14,
    marginTop: spacing.sm,
    maxWidth: 520,
    textAlign: "center",
  },
  primaryButton: {
    backgroundColor: mobileInventarios.action,
    borderRadius: radii.md,
    justifyContent: "center",
    marginTop: spacing.xl,
    minHeight: 48,
    paddingHorizontal: spacing.xl,
  },
  primaryButtonText: { color: "#ffffff", fontWeight: "800" },
  backButton: {
    alignItems: "center",
    alignSelf: "flex-start",
    flexDirection: "row",
    gap: spacing.sm,
    minHeight: 48,
  },
  backText: { color: mobileInventarios.text, fontSize: 14 },
  titleRow: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: spacing.md,
    marginBottom: spacing.lg,
    marginTop: spacing.sm,
  },
  titleBlock: { flex: 1 },
  eyebrow: {
    color: mobileInventarios.textMuted,
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  title: {
    color: mobileInventarios.text,
    fontSize: 26,
    fontWeight: "800",
    marginTop: spacing.xs,
  },
  subtitle: {
    color: mobileInventarios.textMuted,
    fontSize: 14,
    marginTop: spacing.xs,
  },
  searchBox: {
    alignItems: "center",
    backgroundColor: mobileInventarios.surface,
    borderColor: mobileInventarios.border,
    borderRadius: radii.md,
    borderWidth: 1,
    flexDirection: "row",
    marginTop: spacing.sm,
    minHeight: 48,
    paddingLeft: spacing.md,
  },
  searchInput: {
    color: mobileInventarios.text,
    flex: 1,
    fontSize: 15,
    minHeight: 48,
    paddingHorizontal: spacing.md,
  },
  clearButton: {
    alignItems: "center",
    height: 48,
    justifyContent: "center",
    width: 48,
  },
  tabs: { gap: spacing.sm, paddingVertical: spacing.lg },
  tab: {
    backgroundColor: mobileInventarios.surface,
    borderColor: mobileInventarios.border,
    borderRadius: radii.pill,
    borderWidth: 1,
    justifyContent: "center",
    minHeight: 42,
    paddingHorizontal: spacing.lg,
  },
  tabActive: {
    backgroundColor: mobileInventarios.action,
    borderColor: mobileInventarios.action,
  },
  tabText: { color: mobileInventarios.textMuted, fontSize: 13 },
  tabTextActive: { color: "#ffffff", fontWeight: "800" },
  listHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: spacing.md,
  },
  sectionTitle: {
    color: mobileInventarios.text,
    fontSize: 17,
    fontWeight: "800",
  },
  countText: { color: mobileInventarios.textMuted, fontSize: 12 },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  emptyState: {
    alignItems: "center",
    backgroundColor: mobileInventarios.surface,
    borderRadius: radii.md,
    minHeight: 180,
    justifyContent: "center",
    padding: spacing.xl,
  },
  emptyTitle: {
    color: mobileInventarios.text,
    fontSize: 16,
    fontWeight: "800",
  },
  refreshButton: {
    alignItems: "center",
    alignSelf: "center",
    flexDirection: "row",
    gap: spacing.sm,
    minHeight: 48,
    paddingHorizontal: spacing.lg,
  },
  refreshText: {
    color: mobileInventarios.action,
    fontSize: 13,
    fontWeight: "700",
  },
});
