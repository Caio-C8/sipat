import { Lucide } from "@react-native-vector-icons/lucide";
import type { PatrimonioDetalhe } from "@repo/contracts";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { layout, mobilePatrimonios, radii, spacing } from "../../theme/tokens";
import { useSession } from "../auth/session/session-context";
import {
  formatCivilDate,
  formatCurrency,
  formatIncorporation,
  formatPatrimonioNumber,
  formatStatus,
  subtractDecimal,
} from "./patrimonio-formatters";
import { patrimonioErrorMessage, usePatrimonioDetail } from "./use-patrimonios";

type DetailTab = "dados" | "valores";

function DetailRow({
  label,
  value,
}: Readonly<{ label: string; value: string | null | undefined }>) {
  if (!value) return null;
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text selectable style={styles.rowValue}>
        {value}
      </Text>
    </View>
  );
}

function DetailCard({
  title,
  children,
}: Readonly<{ title: string; children: React.ReactNode }>) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.card}>{children}</View>
    </View>
  );
}

export function DadosTab({
  patrimonio,
}: Readonly<{ patrimonio: PatrimonioDetalhe }>) {
  return (
    <>
      <DetailCard title="Identificação">
        <DetailRow label="Marca" value={patrimonio.marca} />
        <DetailRow label="Modelo" value={patrimonio.modelo} />
        <DetailRow label="Nº de série" value={patrimonio.numeroSerie} />
        <DetailRow
          label="Identificação"
          value={formatPatrimonioNumber(
            patrimonio.numeroPatrimonio,
            patrimonio.tipoNumeroPatrimonial,
          )}
        />
      </DetailCard>
      <DetailCard title="Classificação e localização">
        <DetailRow label="Espécie" value={patrimonio.especie.nome} />
        <DetailRow label="Natureza" value={patrimonio.especie.natureza.nome} />
        <DetailRow label="Setor" value={patrimonio.setorAtual.nome} />
        <DetailRow
          label="Responsável"
          value={patrimonio.setorAtual.responsavel.nome}
        />
      </DetailCard>
    </>
  );
}

export function ValoresTab({
  patrimonio,
}: Readonly<{ patrimonio: PatrimonioDetalhe }>) {
  const currentValue = subtractDecimal(
    patrimonio.situacaoContabil.valorBrutoAtual,
    patrimonio.situacaoContabil.depreciacaoAcumuladaAtual,
  );
  const process = patrimonio.processoCompra;
  const processLabel = process
    ? [process.numeroProcesso, process.anoProcesso]
        .filter((value) => value !== null)
        .join("/") || "Não informado"
    : null;
  const depreciation = patrimonio.parametroDepreciacaoAtual;

  return (
    <>
      <View style={styles.valueHero}>
        <Text style={styles.valueLabel}>Valor atual do bem</Text>
        <Text selectable style={styles.valueAmount}>
          {formatCurrency(currentValue)}
        </Text>
        <Text style={styles.valueHint}>
          Depreciação acumulada:{" "}
          {formatCurrency(
            patrimonio.situacaoContabil.depreciacaoAcumuladaAtual,
          )}
        </Text>
      </View>
      <View style={styles.card}>
        <DetailRow
          label="Tombamento"
          value={formatCivilDate(patrimonio.dataTombamento)}
        />
        <DetailRow
          label="Tipo"
          value={formatIncorporation(patrimonio.tipoIncorporacao)}
        />
        <DetailRow label="Processo" value={processLabel} />
        <DetailRow
          label="Incorporação"
          value={formatCurrency(patrimonio.valorIncorporacao)}
        />
        <DetailRow
          label="Valor bruto atual"
          value={formatCurrency(patrimonio.situacaoContabil.valorBrutoAtual)}
        />
      </View>
      {depreciation ? (
        <DetailCard title="Depreciação · método linear">
          <DetailRow
            label="Vida útil inicial"
            value={`${depreciation.vidaUtilInicialMeses} meses`}
          />
          <DetailRow
            label="Valor residual"
            value={formatCurrency(depreciation.valorResidual)}
          />
          <DetailRow
            label="Base inicial"
            value={formatCurrency(depreciation.valorBaseInicial)}
          />
          <DetailRow
            label="Percentual residual"
            value={
              depreciation.percentualResidual
                ? `${depreciation.percentualResidual.replace(".", ",")}%`
                : null
            }
          />
          <DetailRow
            label="Início"
            value={formatCivilDate(depreciation.dataInicio)}
          />
          <DetailRow
            label="Fim"
            value={
              depreciation.dataFim
                ? formatCivilDate(depreciation.dataFim)
                : "Vigente"
            }
          />
        </DetailCard>
      ) : (
        <View style={styles.emptyDepreciation}>
          <Text style={styles.emptyDepreciationTitle}>
            Sem depreciação vigente
          </Text>
          <Text style={styles.emptyDepreciationText}>
            A resposta atual não possui parâmetros de depreciação para este bem.
          </Text>
        </View>
      )}
    </>
  );
}

export function PatrimonioDetailContent({
  patrimonio,
}: Readonly<{ patrimonio: PatrimonioDetalhe }>) {
  const router = useRouter();
  const [tab, setTab] = useState<DetailTab>("dados");

  return (
    <ScrollView
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <Pressable
        accessibilityRole="button"
        onPress={() => router.back()}
        style={styles.backButton}
      >
        <Lucide
          accessible={false}
          color={mobilePatrimonios.text}
          name="arrow-left"
          size={18}
        />
        <Text style={styles.backText}>Voltar aos bens</Text>
      </Pressable>
      <Text style={styles.eyebrow}>
        PATRIMÔNIO{" "}
        {formatPatrimonioNumber(
          patrimonio.numeroPatrimonio,
          patrimonio.tipoNumeroPatrimonial,
        )}
      </Text>
      <Text accessibilityRole="header" style={styles.title}>
        {patrimonio.descricao}
      </Text>
      <View style={styles.statusBadge}>
        <Text style={styles.statusText}>{formatStatus(patrimonio.status)}</Text>
      </View>
      <View accessibilityRole="tablist" style={styles.tabs}>
        {(
          [
            ["dados", "Dados"],
            ["valores", "Valores"],
          ] as const
        ).map(([value, label]) => {
          const active = tab === value;
          return (
            <Pressable
              accessibilityRole="tab"
              accessibilityState={{ selected: active }}
              key={value}
              onPress={() => setTab(value)}
              style={[styles.tab, active && styles.tabActive]}
            >
              <Text style={[styles.tabText, active && styles.tabTextActive]}>
                {label}
              </Text>
            </Pressable>
          );
        })}
      </View>
      {tab === "dados" ? (
        <DadosTab patrimonio={patrimonio} />
      ) : (
        <ValoresTab patrimonio={patrimonio} />
      )}
    </ScrollView>
  );
}

export function PatrimonioDetailScreen({
  patrimonioId,
  validId,
}: Readonly<{ patrimonioId: string; validId: boolean }>) {
  const { manager } = useSession();
  const { state, reload } = usePatrimonioDetail(manager, patrimonioId, validId);

  if (state.status === "loading") {
    return (
      <View accessibilityLabel="Carregando patrimônio" style={styles.center}>
        <ActivityIndicator color={mobilePatrimonios.action} size="large" />
        <Text style={styles.stateText}>Carregando patrimônio…</Text>
      </View>
    );
  }

  if (state.status === "error") {
    return (
      <View accessibilityLiveRegion="polite" style={styles.center}>
        <Lucide
          accessible={false}
          color={mobilePatrimonios.danger}
          name="circle-alert"
          size={30}
        />
        <Text accessibilityRole="header" style={styles.errorTitle}>
          Patrimônio indisponível
        </Text>
        <Text style={styles.errorText}>
          {validId
            ? patrimonioErrorMessage(state.error, true)
            : "O endereço informado não contém um identificador de patrimônio válido."}
        </Text>
        {validId && state.error.status !== 401 ? (
          <Pressable
            accessibilityRole="button"
            onPress={reload}
            style={styles.retryButton}
          >
            <Text style={styles.retryText}>Tentar novamente</Text>
          </Pressable>
        ) : null}
      </View>
    );
  }

  return <PatrimonioDetailContent patrimonio={state.data} />;
}

const styles = StyleSheet.create({
  content: {
    alignSelf: "center",
    maxWidth: layout.contentMaxWidth,
    padding: spacing.xl,
    paddingBottom: spacing.xxxl,
    width: "100%",
  },
  backButton: {
    alignItems: "center",
    alignSelf: "flex-start",
    flexDirection: "row",
    gap: spacing.sm,
    minHeight: layout.comfortableTouchTarget,
  },
  backText: { color: mobilePatrimonios.text, fontSize: 14 },
  eyebrow: {
    color: mobilePatrimonios.textMuted,
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.4,
    marginTop: spacing.sm,
  },
  title: {
    color: mobilePatrimonios.text,
    fontSize: 24,
    fontWeight: "800",
    marginTop: spacing.sm,
  },
  statusBadge: {
    alignSelf: "flex-start",
    backgroundColor: mobilePatrimonios.successSurface,
    borderRadius: radii.pill,
    marginTop: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  statusText: {
    color: mobilePatrimonios.success,
    fontSize: 10,
    fontWeight: "800",
  },
  tabs: {
    flexDirection: "row",
    gap: spacing.xs,
    marginBottom: spacing.xl,
    marginTop: spacing.xl,
  },
  tab: {
    alignItems: "center",
    backgroundColor: mobilePatrimonios.surface,
    borderColor: mobilePatrimonios.border,
    borderRadius: radii.sm,
    borderWidth: 1,
    flex: 1,
    justifyContent: "center",
    minHeight: layout.comfortableTouchTarget,
  },
  tabActive: {
    backgroundColor: mobilePatrimonios.action,
    borderColor: mobilePatrimonios.action,
  },
  tabText: { color: mobilePatrimonios.textMuted, fontSize: 13 },
  tabTextActive: { color: "#ffffff", fontWeight: "800" },
  section: { marginBottom: spacing.xl },
  sectionTitle: {
    color: mobilePatrimonios.text,
    fontSize: 15,
    fontWeight: "800",
    marginBottom: spacing.md,
  },
  card: {
    backgroundColor: mobilePatrimonios.surface,
    borderColor: mobilePatrimonios.border,
    borderRadius: radii.md,
    borderWidth: 1,
    marginBottom: spacing.lg,
    padding: spacing.lg,
  },
  row: {
    flexDirection: "row",
    gap: spacing.md,
    paddingVertical: spacing.sm,
  },
  rowLabel: {
    color: mobilePatrimonios.textSubtle,
    flexBasis: 110,
    fontSize: 12,
  },
  rowValue: {
    color: mobilePatrimonios.text,
    flex: 1,
    fontSize: 13,
  },
  valueHero: {
    backgroundColor: mobilePatrimonios.valueSurface,
    borderRadius: radii.md,
    marginBottom: spacing.lg,
    padding: spacing.lg,
  },
  valueLabel: { color: mobilePatrimonios.text, fontSize: 12 },
  valueAmount: {
    color: mobilePatrimonios.text,
    fontSize: 28,
    fontWeight: "800",
    marginTop: spacing.xs,
  },
  valueHint: {
    color: mobilePatrimonios.textMuted,
    fontSize: 11,
    marginTop: spacing.sm,
  },
  emptyDepreciation: {
    backgroundColor: mobilePatrimonios.neutralSurface,
    borderRadius: radii.md,
    padding: spacing.lg,
  },
  emptyDepreciationTitle: {
    color: mobilePatrimonios.text,
    fontSize: 14,
    fontWeight: "800",
  },
  emptyDepreciationText: {
    color: mobilePatrimonios.textMuted,
    fontSize: 12,
    marginTop: spacing.sm,
  },
  center: {
    alignItems: "center",
    backgroundColor: mobilePatrimonios.canvas,
    flex: 1,
    justifyContent: "center",
    padding: spacing.xxl,
  },
  stateText: {
    color: mobilePatrimonios.textMuted,
    fontSize: 14,
    marginTop: spacing.md,
  },
  errorTitle: {
    color: mobilePatrimonios.text,
    fontSize: 20,
    fontWeight: "800",
    marginTop: spacing.md,
  },
  errorText: {
    color: mobilePatrimonios.textMuted,
    fontSize: 14,
    marginTop: spacing.sm,
    maxWidth: 480,
    textAlign: "center",
  },
  retryButton: {
    alignItems: "center",
    backgroundColor: mobilePatrimonios.action,
    borderRadius: radii.md,
    justifyContent: "center",
    marginTop: spacing.xl,
    minHeight: layout.comfortableTouchTarget,
    paddingHorizontal: spacing.xl,
  },
  retryText: { color: "#ffffff", fontWeight: "800" },
});
