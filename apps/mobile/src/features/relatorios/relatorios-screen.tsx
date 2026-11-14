import { Lucide, type LucideIconName } from "@react-native-vector-icons/lucide";
import type {
  CatalogoRelatoriosResponse,
  TipoRelatorio,
} from "@repo/contracts";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import type { ApiError } from "../../lib/api/api-error";
import type { RemoteQueryState } from "../../lib/query/remote-query-state";
import { layout, mobileRelatorios, radii, spacing } from "../../theme/tokens";
import { useSession } from "../auth/session/session-context";
import { relatorioErrorMessage, useRelatoriosCatalog } from "./use-relatorios";

const PRESENTATION = {
  patrimonios: {
    description: "Bens, localização, responsável e valores.",
    icon: "package",
  },
  "ficha-bem": {
    description: "Dados do bem e resumo do histórico.",
    icon: "file-text",
  },
  inventarios: {
    description: "Conferências e histórico das correções.",
    icon: "clipboard-check",
  },
  movimentacoes: {
    description: "Transferências de bens entre setores.",
    icon: "arrow-left-right",
  },
  manutencoes: {
    description: "Serviços, fornecedores e retornos.",
    icon: "wrench",
  },
  depreciacoes: {
    description: "Valores por bem e por período.",
    icon: "chart-no-axes-column-decreasing",
  },
  "pendencias-depreciacao": {
    description: "Pendências por bem, setor e competência.",
    icon: "triangle-alert",
  },
  reavaliacoes: {
    description: "Valor anterior, novo valor e justificativa.",
    icon: "chart-no-axes-combined",
  },
  emprestimos: {
    description: "Saídas, prazos e devoluções.",
    icon: "handshake",
  },
  baixas: {
    description: "Bens baixados e histórico dos registros.",
    icon: "archive",
  },
} as const satisfies Record<
  TipoRelatorio,
  Readonly<{ description: string; icon: LucideIconName }>
>;

type CatalogState = RemoteQueryState<CatalogoRelatoriosResponse>;

function ErrorState({
  error,
  onRetry,
}: Readonly<{ error: ApiError; onRetry(): void }>) {
  const canRetry = error.status !== 401 && error.status !== 403;
  return (
    <View accessibilityLiveRegion="polite" style={styles.feedbackCard}>
      <View style={styles.feedbackIcon}>
        <Lucide
          accessible={false}
          color={mobileRelatorios.danger}
          name={error.status === 403 ? "shield-x" : "circle-alert"}
          size={22}
        />
      </View>
      <View style={styles.feedbackContent}>
        <Text accessibilityRole="header" style={styles.feedbackTitle}>
          Relatórios indisponíveis
        </Text>
        <Text style={styles.feedbackText}>{relatorioErrorMessage(error)}</Text>
        {canRetry ? (
          <Pressable
            accessibilityRole="button"
            onPress={onRetry}
            style={({ pressed }) => [
              styles.retryButton,
              pressed && styles.retryButtonPressed,
            ]}
          >
            <Lucide
              accessible={false}
              color={mobileRelatorios.action}
              name="refresh-cw"
              size={16}
            />
            <Text style={styles.retryText}>Tentar novamente</Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

function CatalogCard({
  item,
  wide,
}: Readonly<{
  item: CatalogoRelatoriosResponse["dados"]["tipos"][number];
  wide: boolean;
}>) {
  const presentation = PRESENTATION[item.tipo];
  return (
    <View
      accessible
      accessibilityLabel={`${item.titulo}. ${presentation.description}. ${
        item.disponivel
          ? "Disponível"
          : `Indisponível${item.motivo ? `: ${item.motivo}` : ""}`
      }`}
      style={[
        styles.catalogCard,
        wide && styles.catalogCardWide,
        !item.disponivel && styles.catalogCardUnavailable,
      ]}
    >
      <View style={styles.catalogIcon}>
        <Lucide
          accessible={false}
          color={
            item.disponivel
              ? mobileRelatorios.action
              : mobileRelatorios.textSubtle
          }
          name={presentation.icon}
          size={21}
        />
      </View>
      <View style={styles.catalogContent}>
        <Text style={styles.catalogTitle}>{item.titulo}</Text>
        <Text style={styles.catalogDescription}>
          {presentation.description}
        </Text>
        <View style={styles.capabilities}>
          {!item.disponivel ? (
            <Text style={styles.unavailableBadge}>Indisponível</Text>
          ) : null}
          {item.previa ? (
            <Text style={styles.capabilityBadge}>Prévia</Text>
          ) : null}
          {item.pdf ? <Text style={styles.capabilityBadge}>PDF</Text> : null}
        </View>
        {item.motivo ? (
          <Text
            accessibilityLiveRegion={item.disponivel ? "none" : "polite"}
            style={styles.catalogReason}
          >
            {item.motivo}
          </Text>
        ) : null}
      </View>
      <Lucide
        accessible={false}
        color={mobileRelatorios.textSubtle}
        name={item.disponivel ? "chevron-right" : "lock-keyhole"}
        size={18}
      />
    </View>
  );
}

export function RelatoriosContent({
  state,
  onRetry,
}: Readonly<{ state: CatalogState; onRetry(): void }>) {
  const { width } = useWindowDimensions();
  const wide = width >= 760;

  return (
    <ScrollView contentContainerStyle={styles.scrollContent}>
      <View style={[styles.content, wide && styles.contentWide]}>
        <View>
          <Text style={styles.eyebrow}>RELATÓRIOS</Text>
          <Text accessibilityRole="header" style={styles.title}>
            Relatórios
          </Text>
          <Text style={styles.subtitle}>
            Consulte o patrimônio e gere seus relatórios.
          </Text>
        </View>

        <View style={styles.guidance}>
          <Lucide
            accessible={false}
            color={mobileRelatorios.action}
            name="file-down"
            size={21}
          />
          <Text style={styles.guidanceText}>
            Escolha um relatório, defina os filtros e confira a prévia antes de
            exportar.
          </Text>
        </View>

        {state.status === "loading" ? (
          <View
            accessibilityLabel="Carregando catálogo de relatórios"
            accessibilityLiveRegion="polite"
            style={styles.loadingCard}
          >
            <ActivityIndicator color={mobileRelatorios.action} size="large" />
            <Text style={styles.feedbackText}>Consultando relatórios…</Text>
          </View>
        ) : state.status === "error" ? (
          <ErrorState error={state.error} onRetry={onRetry} />
        ) : (
          <View style={styles.catalogSection}>
            <View style={styles.sectionHeading}>
              <Text accessibilityRole="header" style={styles.sectionTitle}>
                Escolha o relatório
              </Text>
              <Text style={styles.count}>
                {state.data.dados.tipos.length.toLocaleString("pt-BR")} modelos
              </Text>
            </View>
            <View style={[styles.catalogGrid, wide && styles.catalogGridWide]}>
              {state.data.dados.tipos.map((item) => (
                <CatalogCard item={item} key={item.tipo} wide={wide} />
              ))}
            </View>
          </View>
        )}

        <Text style={styles.footer}>SIPAT · Relatórios patrimoniais</Text>
      </View>
    </ScrollView>
  );
}

export function RelatoriosScreen() {
  const { manager, state: session } = useSession();
  if (session.status !== "authenticated") return null;
  return <AuthenticatedRelatorios manager={manager} />;
}

function AuthenticatedRelatorios({
  manager,
}: Readonly<{
  manager: Parameters<typeof useRelatoriosCatalog>[0];
}>) {
  const catalog = useRelatoriosCatalog(manager);
  return (
    <RelatoriosContent
      onRetry={() => void catalog.reload()}
      state={catalog.state}
    />
  );
}

const styles = StyleSheet.create({
  scrollContent: { flexGrow: 1, paddingBottom: spacing.xl },
  content: {
    alignSelf: "center",
    gap: spacing.xxl,
    maxWidth: layout.contentMaxWidth,
    padding: spacing.lg,
    width: "100%",
  },
  contentWide: {
    paddingHorizontal: spacing.xxxl,
    paddingVertical: spacing.xxl,
  },
  eyebrow: {
    color: mobileRelatorios.textMuted,
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  title: {
    color: mobileRelatorios.text,
    fontSize: 26,
    fontWeight: "800",
    lineHeight: 34,
    marginTop: spacing.xs,
  },
  subtitle: {
    color: mobileRelatorios.textMuted,
    fontSize: 13,
    lineHeight: 19,
    marginTop: spacing.xs,
  },
  guidance: {
    alignItems: "flex-start",
    backgroundColor: mobileRelatorios.actionSurface,
    borderRadius: radii.md,
    flexDirection: "row",
    gap: spacing.md,
    padding: spacing.lg,
  },
  guidanceText: {
    color: mobileRelatorios.information,
    flex: 1,
    fontSize: 12,
    lineHeight: 18,
  },
  catalogSection: { gap: spacing.md },
  sectionHeading: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  sectionTitle: {
    color: mobileRelatorios.information,
    fontSize: 15,
    fontWeight: "800",
    lineHeight: 21,
  },
  count: { color: mobileRelatorios.textMuted, fontSize: 11 },
  catalogGrid: { gap: spacing.sm },
  catalogGridWide: { flexDirection: "row", flexWrap: "wrap" },
  catalogCard: {
    alignItems: "center",
    backgroundColor: mobileRelatorios.surface,
    borderColor: mobileRelatorios.border,
    borderRadius: radii.md,
    borderWidth: 1,
    flexDirection: "row",
    gap: spacing.md,
    minHeight: 82,
    padding: spacing.md,
  },
  catalogCardWide: { flexBasis: "48%", flexGrow: 1, minWidth: 320 },
  catalogCardUnavailable: { backgroundColor: mobileRelatorios.surfaceMuted },
  catalogIcon: {
    alignItems: "center",
    backgroundColor: mobileRelatorios.actionSurface,
    borderRadius: radii.sm,
    height: 38,
    justifyContent: "center",
    width: 38,
  },
  catalogContent: { flex: 1, minWidth: 0 },
  catalogTitle: {
    color: mobileRelatorios.information,
    fontSize: 13,
    fontWeight: "800",
    lineHeight: 18,
  },
  catalogDescription: {
    color: mobileRelatorios.textMuted,
    fontSize: 11,
    lineHeight: 16,
    marginTop: spacing.xs,
  },
  capabilities: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xs,
    marginTop: spacing.sm,
  },
  capabilityBadge: {
    backgroundColor: mobileRelatorios.actionSurface,
    borderRadius: radii.pill,
    color: mobileRelatorios.action,
    fontSize: 9,
    fontWeight: "700",
    overflow: "hidden",
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  unavailableBadge: {
    backgroundColor: mobileRelatorios.dangerSurface,
    borderRadius: radii.pill,
    color: mobileRelatorios.danger,
    fontSize: 9,
    fontWeight: "700",
    overflow: "hidden",
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  catalogReason: {
    color: mobileRelatorios.textSubtle,
    fontSize: 10,
    lineHeight: 15,
    marginTop: spacing.sm,
  },
  loadingCard: {
    alignItems: "center",
    backgroundColor: mobileRelatorios.surface,
    borderColor: mobileRelatorios.border,
    borderRadius: radii.md,
    borderWidth: 1,
    gap: spacing.md,
    padding: spacing.xxl,
  },
  feedbackCard: {
    alignItems: "flex-start",
    backgroundColor: mobileRelatorios.dangerSurface,
    borderColor: mobileRelatorios.dangerBorder,
    borderRadius: radii.md,
    borderWidth: 1,
    flexDirection: "row",
    gap: spacing.md,
    padding: spacing.lg,
  },
  feedbackIcon: { paddingTop: 2 },
  feedbackContent: { flex: 1, minWidth: 0 },
  feedbackTitle: {
    color: mobileRelatorios.danger,
    fontSize: 14,
    fontWeight: "800",
  },
  feedbackText: {
    color: mobileRelatorios.textMuted,
    fontSize: 12,
    lineHeight: 18,
    marginTop: spacing.xs,
  },
  retryButton: {
    alignItems: "center",
    alignSelf: "flex-start",
    flexDirection: "row",
    gap: spacing.sm,
    minHeight: layout.comfortableTouchTarget,
    marginTop: spacing.md,
  },
  retryButtonPressed: { opacity: 0.7 },
  retryText: {
    color: mobileRelatorios.action,
    fontSize: 12,
    fontWeight: "800",
  },
  footer: {
    color: mobileRelatorios.textSubtle,
    fontSize: 10,
    textAlign: "center",
  },
});
