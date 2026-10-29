import { Lucide } from "@react-native-vector-icons/lucide";
import type {
  InventarioResumo,
  SetorInventarioResumo,
  StatusInventario,
  StatusSetorInventario,
} from "@repo/contracts";
import type { ReactNode } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { layout, mobileInventarios, radii, spacing } from "../../theme/tokens";

export function statusLabel(status: StatusInventario | StatusSetorInventario) {
  if (status === "PENDENTE") return "Pendente";
  if (status === "EM_ANDAMENTO") return "Em andamento";
  if (status === "CONCLUIDO") return "Concluído";
  return "Finalizado";
}

export function StatusBadge({
  status,
}: Readonly<{ status: StatusInventario | StatusSetorInventario }>) {
  const complete = status === "CONCLUIDO" || status === "FINALIZADO";
  const pending = status === "PENDENTE";
  return (
    <View
      accessibilityLabel={`Status: ${statusLabel(status)}`}
      style={[
        styles.badge,
        pending && styles.badgePending,
        complete && styles.badgeComplete,
      ]}
    >
      <Text
        style={[
          styles.badgeText,
          pending && styles.badgeTextPending,
          complete && styles.badgeTextComplete,
        ]}
      >
        {statusLabel(status)}
      </Text>
    </View>
  );
}

export function ProgressLine({
  current,
  total,
  label,
}: Readonly<{ current: number; total: number; label: string }>) {
  const percent = total === 0 ? 0 : Math.round((current / total) * 100);
  return (
    <View
      accessibilityLabel={`${label}: ${current} de ${total}, ${percent}%`}
      style={styles.progressBlock}
    >
      <View style={styles.progressHeader}>
        <Text style={styles.progressLabel}>{label}</Text>
        <Text style={styles.progressValue}>
          {current}/{total}
        </Text>
      </View>
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${percent}%` }]} />
      </View>
    </View>
  );
}

export function InventarioCard({
  inventario,
  onPress,
  wide,
}: Readonly<{
  inventario: InventarioResumo;
  onPress: () => void;
  wide: boolean;
}>) {
  return (
    <Pressable
      accessibilityHint="Abre os setores deste inventário"
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        wide && styles.cardWide,
        pressed && styles.pressed,
      ]}
    >
      <View style={styles.cardHeader}>
        <View style={styles.cardTitleBlock}>
          <Text style={styles.cardTitle}>{inventario.nome}</Text>
          <Text style={styles.cardMeta}>{inventario.comissao.nome}</Text>
        </View>
        <StatusBadge status={inventario.status} />
      </View>
      <ProgressLine
        current={inventario.progresso.setoresConcluidos}
        label="Setores concluídos"
        total={inventario.progresso.totalSetores}
      />
      <View style={styles.cardFooter}>
        <Text style={styles.cardMeta}>
          {inventario.progresso.setoresEmAndamento} em andamento
        </Text>
        <Lucide
          accessible={false}
          color={mobileInventarios.action}
          name="chevron-right"
          size={20}
        />
      </View>
    </Pressable>
  );
}

export function SetorCard({
  setor,
  onPress,
  wide,
}: Readonly<{
  setor: SetorInventarioResumo;
  onPress: () => void;
  wide: boolean;
}>) {
  return (
    <Pressable
      accessibilityHint="Abre o resumo da conferência deste setor"
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        wide && styles.cardWide,
        pressed && styles.pressed,
      ]}
    >
      <View style={styles.cardHeader}>
        <View style={styles.sectorIcon}>
          <Lucide
            accessible={false}
            color={mobileInventarios.action}
            name="building-2"
            size={20}
          />
        </View>
        <View style={styles.cardTitleBlock}>
          <Text style={styles.cardTitle}>{setor.setor.nome}</Text>
          <Text style={styles.cardMeta}>
            {setor.progresso.totalItens} itens cadastrados
          </Text>
        </View>
        <StatusBadge status={setor.status} />
      </View>
      <ProgressLine
        current={setor.progresso.itensVerificados}
        label="Itens verificados"
        total={setor.progresso.totalItens}
      />
    </Pressable>
  );
}

export function Pagination({
  page,
  lastPage,
  onPage,
}: Readonly<{
  page: number;
  lastPage: number;
  onPage: (page: number) => void;
}>) {
  return (
    <View
      accessibilityLabel={`Página ${page} de ${lastPage}`}
      style={styles.pagination}
    >
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ disabled: page <= 1 }}
        disabled={page <= 1}
        onPress={() => onPage(page - 1)}
        style={styles.pageButton}
      >
        <Text style={styles.pageButtonText}>Anterior</Text>
      </Pressable>
      <Text style={styles.pageText}>
        {page} de {lastPage}
      </Text>
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ disabled: page >= lastPage }}
        disabled={page >= lastPage}
        onPress={() => onPage(page + 1)}
        style={styles.pageButton}
      >
        <Text style={styles.pageButtonText}>Próxima</Text>
      </Pressable>
    </View>
  );
}

export function Notice({
  title,
  children,
  kind = "info",
}: Readonly<{
  title: string;
  children: ReactNode;
  kind?: "info" | "error";
}>) {
  return (
    <View
      accessibilityLiveRegion={kind === "error" ? "polite" : undefined}
      style={[styles.notice, kind === "error" && styles.noticeError]}
    >
      <Text style={styles.noticeTitle}>{title}</Text>
      <Text style={styles.noticeText}>{children}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    backgroundColor: mobileInventarios.actionSurface,
    borderRadius: radii.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  badgePending: { backgroundColor: mobileInventarios.warningSurface },
  badgeComplete: { backgroundColor: mobileInventarios.successSurface },
  badgeText: {
    color: mobileInventarios.action,
    fontSize: 10,
    fontWeight: "800",
  },
  badgeTextPending: { color: mobileInventarios.warning },
  badgeTextComplete: { color: mobileInventarios.success },
  progressBlock: { marginTop: spacing.lg },
  progressHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  progressLabel: { color: mobileInventarios.textMuted, fontSize: 12 },
  progressValue: {
    color: mobileInventarios.text,
    fontSize: 12,
    fontWeight: "700",
  },
  track: {
    backgroundColor: mobileInventarios.progressTrack,
    borderRadius: radii.pill,
    height: 6,
    marginTop: spacing.sm,
    overflow: "hidden",
  },
  fill: {
    backgroundColor: mobileInventarios.action,
    borderRadius: radii.pill,
    height: 6,
  },
  card: {
    backgroundColor: mobileInventarios.surface,
    borderColor: mobileInventarios.border,
    borderRadius: radii.md,
    borderWidth: 1,
    marginBottom: spacing.md,
    minHeight: 144,
    padding: spacing.lg,
    width: "100%",
  },
  cardWide: { width: "49%" },
  pressed: { opacity: 0.78 },
  cardHeader: { alignItems: "center", flexDirection: "row", gap: spacing.md },
  cardTitleBlock: { flex: 1, minWidth: 0 },
  cardTitle: {
    color: mobileInventarios.text,
    fontSize: 15,
    fontWeight: "800",
  },
  cardMeta: {
    color: mobileInventarios.textMuted,
    fontSize: 12,
    marginTop: spacing.xs,
  },
  cardFooter: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: spacing.md,
  },
  sectorIcon: {
    alignItems: "center",
    backgroundColor: mobileInventarios.actionSurface,
    borderRadius: radii.sm,
    height: 40,
    justifyContent: "center",
    width: 40,
  },
  pagination: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: spacing.md,
  },
  pageButton: {
    justifyContent: "center",
    minHeight: layout.comfortableTouchTarget,
    paddingHorizontal: spacing.sm,
  },
  pageButtonText: { color: mobileInventarios.action, fontSize: 12 },
  pageText: { color: mobileInventarios.textMuted, fontSize: 12 },
  notice: {
    backgroundColor: mobileInventarios.actionSurface,
    borderRadius: radii.md,
    marginBottom: spacing.lg,
    padding: spacing.lg,
  },
  noticeError: { backgroundColor: mobileInventarios.dangerSurface },
  noticeTitle: {
    color: mobileInventarios.text,
    fontSize: 14,
    fontWeight: "800",
  },
  noticeText: {
    color: mobileInventarios.textMuted,
    fontSize: 12,
    lineHeight: 18,
    marginTop: spacing.xs,
  },
});
