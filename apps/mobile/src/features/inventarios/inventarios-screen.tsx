import { Lucide } from "@react-native-vector-icons/lucide";
import type {
  ListarInventariosResponse,
  StatusInventario,
} from "@repo/contracts";
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
import { InventarioCard, Notice, Pagination } from "./inventario-components";
import {
  inventarioErrorMessage,
  useInventarios,
  type RemoteState,
} from "./use-inventarios";

function InventorySection({
  title,
  status,
  state,
  page,
  onPage,
  onRetry,
  wide,
}: Readonly<{
  title: string;
  status: Extract<StatusInventario, "PENDENTE" | "EM_ANDAMENTO">;
  state: RemoteState<ListarInventariosResponse>;
  page: number;
  onPage: (page: number) => void;
  onRetry: () => void;
  wide: boolean;
}>) {
  const router = useRouter();
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text accessibilityRole="header" style={styles.sectionTitle}>
          {title}
        </Text>
        {state.status === "success" ? (
          <Text style={styles.countText}>
            {state.data.meta.total.toLocaleString("pt-BR")}
          </Text>
        ) : null}
      </View>
      {state.status === "loading" ? (
        <View
          accessibilityLabel={`Carregando ${title.toLowerCase()}`}
          style={styles.inlineState}
        >
          <ActivityIndicator color={mobileInventarios.action} />
          <Text style={styles.stateText}>Carregando…</Text>
        </View>
      ) : state.status === "error" ? (
        <View accessibilityLiveRegion="polite" style={styles.inlineState}>
          <Text style={styles.errorText}>
            {inventarioErrorMessage(state.error)}
          </Text>
          {state.error.status !== 401 ? (
            <Pressable
              accessibilityRole="button"
              onPress={onRetry}
              style={styles.retryButton}
            >
              <Text style={styles.retryText}>Tentar novamente</Text>
            </Pressable>
          ) : null}
        </View>
      ) : state.data.dados.length === 0 ? (
        <View accessibilityLiveRegion="polite" style={styles.inlineState}>
          <Text style={styles.emptyTitle}>
            Nenhum inventário{" "}
            {status === "PENDENTE" ? "pendente" : "em andamento"}
          </Text>
          <Text style={styles.stateText}>
            A consulta não retornou resultados nesta página.
          </Text>
        </View>
      ) : (
        <>
          <View style={styles.grid}>
            {state.data.dados.map((inventario) => (
              <InventarioCard
                inventario={inventario}
                key={inventario.id}
                onPress={() =>
                  router.push({
                    pathname: "/inventarios/[inventarioId]",
                    params: { inventarioId: inventario.id },
                  })
                }
                wide={wide}
              />
            ))}
          </View>
          <Pagination
            lastPage={state.data.meta.ultimaPagina}
            onPage={onPage}
            page={page}
          />
        </>
      )}
    </View>
  );
}

export function InventariosScreen() {
  const { manager, state: session } = useSession();
  const { width } = useWindowDimensions();
  const wide = width >= layout.wideMinWidth;
  const [searchText, setSearchText] = useState("");
  const [submittedSearch, setSubmittedSearch] = useState<string>();
  const [pendingPage, setPendingPage] = useState(1);
  const [ongoingPage, setOngoingPage] = useState(1);
  const pending = useInventarios(
    manager,
    "PENDENTE",
    submittedSearch,
    pendingPage,
  );
  const ongoing = useInventarios(
    manager,
    "EM_ANDAMENTO",
    submittedSearch,
    ongoingPage,
  );
  const isAdmin =
    session.status === "authenticated" &&
    session.identity.perfil === "ADMINISTRADOR";
  const reloadsRef = useRef({
    pending: pending.reload,
    ongoing: ongoing.reload,
  });
  const focusedOnce = useRef(false);

  useEffect(() => {
    reloadsRef.current = { pending: pending.reload, ongoing: ongoing.reload };
  }, [ongoing.reload, pending.reload]);

  useFocusEffect(
    useCallback(() => {
      if (focusedOnce.current) {
        void reloadsRef.current.pending();
        void reloadsRef.current.ongoing();
      } else {
        focusedOnce.current = true;
      }
    }, []),
  );

  const submitSearch = () => {
    setPendingPage(1);
    setOngoingPage(1);
    const normalized = searchText.trim();
    setSubmittedSearch(normalized || undefined);
  };

  return (
    <ScrollView
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.headingRow}>
        <View style={styles.headingBlock}>
          <Text style={styles.eyebrow}>INVENTÁRIO</Text>
          <Text accessibilityRole="header" style={styles.title}>
            Selecionar inventário
          </Text>
          <Text style={styles.subtitle}>
            Escolha um inventário aberto antes de consultar seus setores.
          </Text>
        </View>
        <Pressable
          accessibilityLabel="Atualizar inventários"
          accessibilityRole="button"
          onPress={() => {
            void pending.reload();
            void ongoing.reload();
          }}
          style={styles.iconButton}
        >
          <Lucide
            accessible={false}
            color={mobileInventarios.action}
            name="refresh-cw"
            size={20}
          />
        </Pressable>
      </View>
      {isAdmin ? (
        <Notice title="Consulta somente leitura">
          Iniciar ou retomar conferências é uma ação restrita ao Diretor de
          Patrimônio.
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
          accessibilityLabel="Buscar inventário"
          enterKeyHint="search"
          maxLength={200}
          onChangeText={setSearchText}
          onSubmitEditing={submitSearch}
          placeholder="Nome do inventário"
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
              setPendingPage(1);
              setOngoingPage(1);
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
      <InventorySection
        onPage={setOngoingPage}
        onRetry={ongoing.reload}
        page={ongoingPage}
        state={ongoing.state}
        status="EM_ANDAMENTO"
        title="Em andamento"
        wide={wide}
      />
      <InventorySection
        onPage={setPendingPage}
        onRetry={pending.reload}
        page={pendingPage}
        state={pending.state}
        status="PENDENTE"
        title="Pendentes"
        wide={wide}
      />
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
  headingRow: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: spacing.md,
  },
  headingBlock: { flex: 1 },
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
    lineHeight: 20,
    marginTop: spacing.xs,
  },
  iconButton: {
    alignItems: "center",
    height: 48,
    justifyContent: "center",
    width: 48,
  },
  searchBox: {
    alignItems: "center",
    backgroundColor: mobileInventarios.surface,
    borderColor: mobileInventarios.border,
    borderRadius: radii.md,
    borderWidth: 1,
    flexDirection: "row",
    marginTop: spacing.xl,
    minHeight: layout.comfortableTouchTarget,
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
  section: { marginTop: spacing.xxl },
  sectionHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: spacing.md,
  },
  sectionTitle: {
    color: mobileInventarios.text,
    fontSize: 18,
    fontWeight: "800",
  },
  countText: { color: mobileInventarios.textMuted, fontSize: 12 },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  inlineState: {
    alignItems: "center",
    backgroundColor: mobileInventarios.surface,
    borderRadius: radii.md,
    minHeight: 130,
    justifyContent: "center",
    padding: spacing.xl,
  },
  stateText: {
    color: mobileInventarios.textMuted,
    fontSize: 13,
    marginTop: spacing.sm,
    textAlign: "center",
  },
  errorText: {
    color: mobileInventarios.danger,
    fontSize: 13,
    textAlign: "center",
  },
  emptyTitle: {
    color: mobileInventarios.text,
    fontSize: 15,
    fontWeight: "800",
  },
  retryButton: {
    backgroundColor: mobileInventarios.action,
    borderRadius: radii.md,
    marginTop: spacing.md,
    minHeight: 44,
    justifyContent: "center",
    paddingHorizontal: spacing.lg,
  },
  retryText: { color: "#ffffff", fontWeight: "800" },
});
