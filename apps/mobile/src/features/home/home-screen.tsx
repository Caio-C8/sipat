import { Lucide, type LucideIconName } from "@react-native-vector-icons/lucide";
import type { IdentidadeAutenticada, PerfilUsuario } from "@repo/contracts";
import { useRouter, type Href } from "expo-router";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { useReloadOnReturn } from "../../lib/navigation/use-reload-on-return";
import { layout, mobileHome, radii, spacing } from "../../theme/tokens";
import { useSession } from "../auth/session/session-context";
import type { SessionManager } from "../auth/session/session-manager";
import type { InventariosHome } from "./api/home-operations";
import {
  homeErrorMessage,
  type HomeBlock,
  type HomeBlockName,
  type HomeDashboardState,
  useHomeDashboard,
} from "./use-home-dashboard";

type HomeContentProps = Readonly<{
  name: string;
  profile: PerfilUsuario;
  state: HomeDashboardState;
  onRefresh(): void;
  onRetry(block: HomeBlockName): void;
  onOpenInventories(): void;
  onOpenInventory(inventoryId: string): void;
}>;

const STATUS_LABELS = {
  PENDENTE: "Pendente",
  EM_ANDAMENTO: "Em andamento",
  FINALIZADO: "Concluído",
} as const;

function civilDate(value: string | null) {
  if (!value) return null;
  const [year, month, day] = value.split("-");
  return year && month && day ? `${day}/${month}/${year}` : value;
}

function StatCard({
  icon,
  label,
  value,
  hint,
  tone = "blue",
}: Readonly<{
  icon: LucideIconName;
  label: string;
  value: number | null;
  hint: string;
  tone?: "blue" | "amber";
}>) {
  return (
    <View style={styles.statCard}>
      <View style={[styles.statIcon, tone === "amber" && styles.statIconAmber]}>
        <Lucide
          accessible={false}
          color={tone === "amber" ? mobileHome.warning : mobileHome.action}
          name={icon}
          size={18}
        />
      </View>
      <Text style={[styles.statValue, tone === "amber" && styles.warningText]}>
        {value === null ? "—" : value.toLocaleString("pt-BR")}
      </Text>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statHint}>{hint}</Text>
    </View>
  );
}

function ErrorCard({
  block,
  error,
  onRetry,
}: Readonly<{
  block: HomeBlockName;
  error: Extract<HomeBlock<unknown>, { status: "error" }>["error"];
  onRetry(block: HomeBlockName): void;
}>) {
  return (
    <View accessibilityLiveRegion="polite" style={styles.errorCard}>
      <Lucide
        accessible={false}
        color={mobileHome.error}
        name="circle-alert"
        size={20}
      />
      <View style={styles.errorContent}>
        <Text style={styles.errorTitle}>Dados indisponíveis</Text>
        <Text style={styles.errorText}>{homeErrorMessage(error)}</Text>
      </View>
      {error.status !== 401 ? (
        <Pressable
          accessibilityRole="button"
          onPress={() => onRetry(block)}
          style={styles.retryButton}
        >
          <Text style={styles.retryText}>Tentar novamente</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

function CountBlock({
  block,
  blockName,
  icon,
  label,
  hint,
  onRetry,
}: Readonly<{
  block: HomeBlock<number>;
  blockName: HomeBlockName;
  icon: LucideIconName;
  label: string;
  hint: string;
  onRetry(block: HomeBlockName): void;
}>) {
  if (block.status === "loading") {
    return (
      <View accessibilityLabel={`Carregando ${label}`} style={styles.statCard}>
        <ActivityIndicator color={mobileHome.action} />
        <Text style={styles.statLabel}>{label}</Text>
        <Text style={styles.statHint}>Consultando dados…</Text>
      </View>
    );
  }
  if (block.status === "error") {
    return (
      <ErrorCard block={blockName} error={block.error} onRetry={onRetry} />
    );
  }
  return <StatCard hint={hint} icon={icon} label={label} value={block.data} />;
}

function Action({
  icon,
  label,
  prominent = false,
  onPress,
}: Readonly<{
  icon: LucideIconName;
  label: string;
  prominent?: boolean;
  onPress?: () => void;
}>) {
  const disabled = onPress === undefined;
  return (
    <Pressable
      accessibilityLabel={label}
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={[styles.disabledAction, prominent && styles.heroAction]}
    >
      <Lucide
        accessible={false}
        color={prominent ? mobileHome.action : mobileHome.textMuted}
        name={icon}
        size={18}
      />
      <Text
        style={[styles.disabledActionText, prominent && styles.heroActionText]}
      >
        {label}
      </Text>
      {prominent ? (
        <Lucide
          accessible={false}
          color={mobileHome.action}
          name="arrow-right"
          size={20}
        />
      ) : null}
    </Pressable>
  );
}

function Hero({
  profile,
  onOpenInventories,
}: Readonly<{
  profile: PerfilUsuario;
  onOpenInventories(): void;
}>) {
  const director = profile === "DIRETOR_PATRIMONIO";
  return (
    <View style={styles.hero}>
      <View style={styles.heroDecoration} />
      <View style={styles.heroLabelRow}>
        <View style={styles.heroIcon}>
          <Lucide
            accessible={false}
            color={mobileHome.heroText}
            name={director ? "scan-barcode" : "clipboard-list"}
            size={19}
          />
        </View>
        <Text style={styles.heroLabel}>
          {director ? "INVENTÁRIO" : "ACOMPANHAMENTO"}
        </Text>
      </View>
      <Text style={styles.heroTitle}>
        {director ? "Fazer inventário" : "Gestão patrimonial"}
      </Text>
      <Text style={styles.heroDescription}>
        {director
          ? "Escolha um setor e confira os bens pela câmera ou pelo código."
          : "Acompanhe setores, bens e o andamento dos inventários do sistema."}
      </Text>
      <Action
        icon={director ? "scan-barcode" : "clipboard-list"}
        label={director ? "Iniciar conferência" : "Ver inventários"}
        onPress={onOpenInventories}
        prominent
      />
    </View>
  );
}

function InventoryStatusCards({ data }: Readonly<{ data: InventariosHome }>) {
  return (
    <View style={styles.statusGrid}>
      <StatCard
        hint="Aguardando início"
        icon="clock-3"
        label="Pendentes"
        value={data.pendentes}
      />
      <StatCard
        hint="Conferência ativa"
        icon="scan-barcode"
        label="Em andamento"
        value={data.emAndamento}
        tone="amber"
      />
      <StatCard
        hint="Inventários concluídos"
        icon="circle-check"
        label="Finalizados"
        value={data.finalizados}
      />
    </View>
  );
}

function ProgressCard({
  data,
  includePending,
  onOpenInventory,
}: Readonly<{
  data: InventariosHome;
  includePending: boolean;
  onOpenInventory(inventoryId: string): void;
}>) {
  const inventory =
    data.emAndamentoMaisRecente ??
    (includePending && data.maisRecente?.status === "PENDENTE"
      ? data.maisRecente
      : null);
  if (!inventory) {
    return (
      <View style={styles.emptyCard}>
        <Text style={styles.emptyTitle}>Nenhum inventário em andamento</Text>
        <Text style={styles.emptyText}>
          Consulte a lista para selecionar outro inventário disponível.
        </Text>
      </View>
    );
  }

  const { progresso } = inventory;
  const percent =
    progresso.totalItens === 0
      ? null
      : Math.round((progresso.itensVerificados / progresso.totalItens) * 100);

  return (
    <Pressable
      accessibilityHint="Abre os setores deste inventário"
      accessibilityLabel={`Abrir ${inventory.nome}`}
      accessibilityRole="button"
      onPress={() => onOpenInventory(inventory.id)}
      style={styles.inventoryCard}
    >
      <View style={styles.inventoryHeading}>
        <View style={styles.inventoryIcon}>
          <Lucide
            accessible={false}
            color={mobileHome.action}
            name="clipboard-list"
            size={20}
          />
        </View>
        <View style={styles.inventoryTitleBlock}>
          <Text style={styles.inventoryTitle}>{inventory.nome}</Text>
          <Text style={styles.inventorySubtitle}>
            {progresso.itensVerificados.toLocaleString("pt-BR")} de{" "}
            {progresso.totalItens.toLocaleString("pt-BR")} bens conferidos
          </Text>
        </View>
        <Text style={styles.statusBadge}>
          {STATUS_LABELS[inventory.status]}
        </Text>
      </View>
      <View style={styles.progressTrack}>
        <View
          accessibilityLabel={
            percent === null
              ? "Progresso não disponível"
              : `${percent}% concluído`
          }
          style={[styles.progressFill, { width: `${percent ?? 0}%` }]}
        />
      </View>
      <View style={styles.inventoryMetaRow}>
        <Text style={styles.inventoryMeta}>
          {percent === null
            ? "Nenhum bem neste inventário"
            : `${percent}% concluído`}
        </Text>
        <Text style={styles.inventoryMetaWarning}>
          {progresso.correcoesPendentes.toLocaleString("pt-BR")} ocorrências
          pendentes
        </Text>
      </View>
    </Pressable>
  );
}

function LastConference({
  data,
  onOpenInventory,
}: Readonly<{
  data: InventariosHome;
  onOpenInventory(inventoryId: string): void;
}>) {
  const inventory = data.finalizadoMaisRecente;
  return (
    <View style={styles.conferenceSection}>
      <View style={styles.sectionHeading}>
        <Text accessibilityRole="header" style={styles.sectionTitle}>
          Última conferência
        </Text>
      </View>
      {inventory ? (
        <Pressable
          accessibilityHint="Abre os registros deste inventário por setor"
          accessibilityLabel={`Abrir ${inventory.nome}`}
          accessibilityRole="button"
          onPress={() => onOpenInventory(inventory.id)}
          style={styles.inventoryCard}
        >
          <View style={styles.inventoryHeading}>
            <View style={styles.inventoryIcon}>
              <Lucide
                accessible={false}
                color={mobileHome.action}
                name="building-2"
                size={20}
              />
            </View>
            <View style={styles.inventoryTitleBlock}>
              <Text style={styles.inventoryTitle}>{inventory.nome}</Text>
              <Text style={styles.inventorySubtitle}>
                {inventory.dataFim
                  ? `Finalizado em ${civilDate(inventory.dataFim)}`
                  : "Data de finalização indisponível"}
              </Text>
            </View>
            <Text style={styles.successBadge}>Concluído</Text>
          </View>
          <View style={styles.inventoryMetaRow}>
            <Text style={styles.inventoryMetaPill}>
              {inventory.progresso.totalItens.toLocaleString("pt-BR")} ativos
              previstos
            </Text>
            <Text style={styles.warningPill}>
              {inventory.progresso.divergencias.toLocaleString("pt-BR")}{" "}
              ocorrências registradas
            </Text>
          </View>
        </Pressable>
      ) : (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyTitle}>Nenhuma conferência finalizada</Text>
          <Text style={styles.emptyText}>
            Não há histórico concluído disponível para exibir.
          </Text>
        </View>
      )}
    </View>
  );
}

function InventoryBlock({
  block,
  profile,
  onRetry,
  onOpenInventory,
}: Readonly<{
  block: HomeBlock<InventariosHome>;
  profile: PerfilUsuario;
  onRetry(block: HomeBlockName): void;
  onOpenInventory(inventoryId: string): void;
}>) {
  if (block.status === "loading") {
    return (
      <View
        accessibilityLabel="Carregando inventários"
        style={styles.loadingCard}
      >
        <ActivityIndicator color={mobileHome.action} size="large" />
        <Text style={styles.emptyText}>Consultando inventários…</Text>
      </View>
    );
  }
  if (block.status === "error") {
    return (
      <ErrorCard block="inventarios" error={block.error} onRetry={onRetry} />
    );
  }
  return (
    <View style={styles.inventorySections}>
      {profile === "ADMINISTRADOR" ? (
        <>
          <Text accessibilityRole="header" style={styles.sectionTitle}>
            Inventários
          </Text>
          <InventoryStatusCards data={block.data} />
          <Text accessibilityRole="header" style={styles.sectionTitle}>
            Inventário atual
          </Text>
          <ProgressCard
            data={block.data}
            includePending={false}
            onOpenInventory={onOpenInventory}
          />
        </>
      ) : (
        <>
          <Text accessibilityRole="header" style={styles.sectionTitle}>
            Inventário atual
          </Text>
          <ProgressCard
            data={block.data}
            includePending
            onOpenInventory={onOpenInventory}
          />
        </>
      )}
      <LastConference data={block.data} onOpenInventory={onOpenInventory} />
    </View>
  );
}

function FutureReportAction() {
  return (
    <View style={styles.reportSection}>
      <View>
        <Text style={styles.reportTitle}>Relatórios</Text>
        <Text style={styles.reportText}>
          A consulta e a geração serão liberadas quando a página estiver
          disponível.
        </Text>
      </View>
      <Action icon="file-text" label="Gerar relatório" />
    </View>
  );
}

export function HomeContent({
  name,
  profile,
  state,
  onRefresh,
  onRetry,
  onOpenInventories,
  onOpenInventory,
}: HomeContentProps) {
  const { width } = useWindowDimensions();
  const wide = width >= 760;
  const director = profile === "DIRETOR_PATRIMONIO";

  return (
    <ScrollView contentContainerStyle={styles.scrollContent}>
      <View style={[styles.content, wide && styles.contentWide]}>
        <View style={styles.greetingRow}>
          <View style={styles.greetingText}>
            <Text accessibilityRole="header" style={styles.greeting}>
              Olá, {name}
            </Text>
            <Text style={styles.profileLabel}>
              {director ? "Diretor de Patrimônio" : "Administrador"}
            </Text>
          </View>
        </View>

        <Hero onOpenInventories={onOpenInventories} profile={profile} />

        <View style={[styles.primaryGrid, wide && styles.primaryGridWide]}>
          {profile === "ADMINISTRADOR" && state.setores ? (
            <CountBlock
              block={state.setores}
              blockName="setores"
              hint="Consulte os bens por setor"
              icon="building-2"
              label="Setores cadastrados"
              onRetry={onRetry}
            />
          ) : null}
          <CountBlock
            block={state.patrimonios}
            blockName="patrimonios"
            hint="Total do patrimônio"
            icon="package"
            label="Bens cadastrados"
            onRetry={onRetry}
          />
        </View>

        <InventoryBlock
          block={state.inventarios}
          onOpenInventory={onOpenInventory}
          onRetry={onRetry}
          profile={profile}
        />
        <FutureReportAction />

        <Pressable
          accessibilityRole="button"
          onPress={onRefresh}
          style={styles.refreshButton}
        >
          <Lucide
            accessible={false}
            color={mobileHome.action}
            name="refresh-cw"
            size={17}
          />
          <Text style={styles.refreshText}>Atualizar dados</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

export function HomeScreen() {
  const { manager, state: session } = useSession();
  if (session.status !== "authenticated") return null;
  return <AuthenticatedHome identity={session.identity} manager={manager} />;
}

function AuthenticatedHome({
  identity,
  manager,
}: Readonly<{
  identity: IdentidadeAutenticada;
  manager: SessionManager;
}>) {
  const router = useRouter();
  const dashboard = useHomeDashboard(manager, identity.perfil);
  useReloadOnReturn(dashboard.refresh);

  return (
    <HomeContent
      name={identity.nome}
      onOpenInventories={() => router.push("/inventarios" as Href)}
      onOpenInventory={(inventoryId) =>
        router.push(`/inventarios/${inventoryId}` as Href)
      }
      onRefresh={dashboard.refresh}
      onRetry={(block) => void dashboard.retry(block)}
      profile={identity.perfil}
      state={dashboard.state}
    />
  );
}

const styles = StyleSheet.create({
  scrollContent: { flexGrow: 1, paddingBottom: spacing.xl },
  content: {
    alignSelf: "center",
    gap: spacing.lg,
    maxWidth: layout.contentMaxWidth,
    padding: spacing.lg,
    width: "100%",
  },
  contentWide: {
    paddingHorizontal: spacing.xxxl,
    paddingVertical: spacing.xxl,
  },
  greetingRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  greetingText: { flex: 1 },
  greeting: {
    color: mobileHome.text,
    fontSize: 24,
    fontWeight: "800",
    lineHeight: 30,
  },
  profileLabel: { color: mobileHome.textMuted, fontSize: 12, lineHeight: 18 },
  hero: {
    backgroundColor: mobileHome.action,
    borderRadius: 22,
    overflow: "hidden",
    padding: spacing.xl,
    position: "relative",
  },
  heroDecoration: {
    backgroundColor: mobileHome.heroDecoration,
    borderRadius: 60,
    height: 120,
    position: "absolute",
    right: -28,
    top: -25,
    transform: [{ rotate: "18deg" }],
    width: 90,
  },
  heroLabelRow: { alignItems: "center", flexDirection: "row", gap: spacing.sm },
  heroIcon: {
    alignItems: "center",
    backgroundColor: mobileHome.heroIconSurface,
    borderRadius: radii.sm,
    height: 36,
    justifyContent: "center",
    width: 36,
  },
  heroLabel: {
    color: mobileHome.heroTextMuted,
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.4,
  },
  heroTitle: {
    color: mobileHome.heroText,
    fontSize: 26,
    fontWeight: "800",
    lineHeight: 32,
    marginTop: spacing.md,
  },
  heroDescription: {
    color: mobileHome.heroTextMuted,
    fontSize: 13,
    lineHeight: 19,
    marginTop: spacing.xs,
    maxWidth: 280,
  },
  disabledAction: {
    alignItems: "center",
    borderColor: mobileHome.border,
    borderRadius: radii.sm,
    borderWidth: 1,
    flexDirection: "row",
    gap: spacing.sm,
    justifyContent: "center",
    minHeight: layout.comfortableTouchTarget,
    opacity: 0.72,
    paddingHorizontal: spacing.md,
  },
  disabledActionText: {
    color: mobileHome.textMuted,
    flex: 1,
    fontSize: 13,
    fontWeight: "700",
  },
  heroAction: {
    backgroundColor: mobileHome.surface,
    borderWidth: 0,
    marginTop: spacing.xl,
    opacity: 1,
  },
  heroActionText: { color: mobileHome.text },
  primaryGrid: { flexDirection: "row", gap: spacing.md },
  primaryGridWide: { maxWidth: 760 },
  statCard: {
    backgroundColor: mobileHome.surface,
    borderColor: mobileHome.border,
    borderRadius: radii.lg,
    borderWidth: 1,
    flex: 1,
    minHeight: 132,
    minWidth: 0,
    padding: spacing.md,
  },
  statIcon: {
    alignItems: "center",
    alignSelf: "flex-end",
    backgroundColor: mobileHome.actionSurface,
    borderRadius: radii.sm,
    height: 34,
    justifyContent: "center",
    width: 34,
  },
  statIconAmber: { backgroundColor: mobileHome.warningSurface },
  statValue: {
    color: mobileHome.text,
    fontSize: 28,
    fontWeight: "800",
    lineHeight: 32,
    marginTop: -26,
  },
  warningText: { color: mobileHome.warning },
  statLabel: {
    color: mobileHome.text,
    fontSize: 12,
    lineHeight: 17,
    marginTop: spacing.xs,
  },
  statHint: {
    color: mobileHome.textSubtle,
    fontSize: 10,
    lineHeight: 15,
    marginTop: spacing.xs,
  },
  statusGrid: { flexDirection: "row", gap: spacing.sm },
  inventorySections: { gap: spacing.md },
  conferenceSection: { gap: spacing.md },
  sectionHeading: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  sectionTitle: {
    color: mobileHome.text,
    fontSize: 17,
    fontWeight: "800",
    lineHeight: 23,
  },
  disabledLink: {
    color: mobileHome.action,
    fontSize: 11,
    fontWeight: "700",
    opacity: 0.6,
  },
  inventoryCard: {
    backgroundColor: mobileHome.surface,
    borderColor: mobileHome.border,
    borderRadius: radii.lg,
    borderWidth: 1,
    gap: spacing.md,
    padding: spacing.md,
  },
  inventoryHeading: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.md,
  },
  inventoryIcon: {
    alignItems: "center",
    backgroundColor: mobileHome.actionSurface,
    borderRadius: radii.sm,
    height: 42,
    justifyContent: "center",
    width: 42,
  },
  inventoryTitleBlock: { flex: 1, minWidth: 0 },
  inventoryTitle: {
    color: mobileHome.text,
    fontSize: 14,
    fontWeight: "800",
    lineHeight: 20,
  },
  inventorySubtitle: {
    color: mobileHome.textSubtle,
    fontSize: 11,
    lineHeight: 16,
  },
  statusBadge: {
    backgroundColor: mobileHome.actionSurface,
    borderRadius: radii.pill,
    color: mobileHome.action,
    fontSize: 9,
    fontWeight: "800",
    overflow: "hidden",
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  successBadge: {
    backgroundColor: mobileHome.successSurface,
    borderRadius: radii.pill,
    color: mobileHome.success,
    fontSize: 9,
    fontWeight: "800",
    overflow: "hidden",
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  progressTrack: {
    backgroundColor: mobileHome.progressTrack,
    borderRadius: radii.pill,
    height: 8,
    overflow: "hidden",
  },
  progressFill: {
    backgroundColor: mobileHome.action,
    borderRadius: radii.pill,
    height: 8,
  },
  inventoryMetaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    justifyContent: "space-between",
  },
  inventoryMeta: { color: mobileHome.textMuted, fontSize: 10, lineHeight: 15 },
  inventoryMetaWarning: {
    color: mobileHome.warning,
    fontSize: 10,
    lineHeight: 15,
  },
  inventoryMetaPill: {
    backgroundColor: mobileHome.surfaceMuted,
    borderRadius: radii.sm,
    color: mobileHome.textMuted,
    fontSize: 10,
    overflow: "hidden",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  warningPill: {
    backgroundColor: mobileHome.warningSurface,
    borderRadius: radii.sm,
    color: mobileHome.warning,
    fontSize: 10,
    overflow: "hidden",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  emptyCard: {
    backgroundColor: mobileHome.surface,
    borderColor: mobileHome.border,
    borderRadius: radii.lg,
    borderWidth: 1,
    padding: spacing.lg,
  },
  emptyTitle: { color: mobileHome.text, fontSize: 14, fontWeight: "800" },
  emptyText: {
    color: mobileHome.textMuted,
    fontSize: 12,
    lineHeight: 18,
    marginTop: spacing.xs,
  },
  loadingCard: {
    alignItems: "center",
    backgroundColor: mobileHome.surface,
    borderColor: mobileHome.border,
    borderRadius: radii.lg,
    borderWidth: 1,
    padding: spacing.xl,
  },
  errorCard: {
    alignItems: "flex-start",
    backgroundColor: mobileHome.errorSurface,
    borderColor: mobileHome.errorBorder,
    borderRadius: radii.lg,
    borderWidth: 1,
    flex: 1,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    minWidth: 0,
    padding: spacing.md,
  },
  errorContent: { flex: 1, minWidth: 130 },
  errorTitle: { color: mobileHome.error, fontSize: 12, fontWeight: "800" },
  errorText: {
    color: mobileHome.error,
    fontSize: 11,
    lineHeight: 16,
    marginTop: spacing.xs,
  },
  retryButton: {
    justifyContent: "center",
    minHeight: 36,
    paddingHorizontal: spacing.sm,
  },
  retryText: { color: mobileHome.error, fontSize: 11, fontWeight: "800" },
  reportSection: {
    backgroundColor: mobileHome.surface,
    borderColor: mobileHome.border,
    borderRadius: radii.lg,
    borderWidth: 1,
    gap: spacing.md,
    padding: spacing.md,
  },
  reportTitle: { color: mobileHome.text, fontSize: 14, fontWeight: "800" },
  reportText: {
    color: mobileHome.textMuted,
    fontSize: 11,
    lineHeight: 16,
    marginTop: spacing.xs,
  },
  refreshButton: {
    alignItems: "center",
    alignSelf: "center",
    flexDirection: "row",
    gap: spacing.sm,
    justifyContent: "center",
    minHeight: layout.comfortableTouchTarget,
    paddingHorizontal: spacing.lg,
  },
  refreshText: { color: mobileHome.action, fontSize: 13, fontWeight: "800" },
});
