import { Lucide } from "@react-native-vector-icons/lucide";
import type { TipoRelatorio } from "@repo/contracts";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import {
  layout,
  mobileRelatorios,
  radii,
  spacing,
} from "../../../theme/tokens";
import { useSession } from "../../auth/session/session-context";
import type { RelatorioDraft } from "../relatorio-form-config";
import { relatorioTitles } from "../relatorio-form-config";
import {
  appliedFilterEntries,
  formatRelatorioValue,
  relatorioCadastroEntries,
  relatorioDisplayEntries,
  relatorioEventEntries,
  relatorioEventMetadata,
  relatorioFieldLabel,
  relatorioRecordFields,
  relatorioRecordSubtitle,
  relatorioRecordTitle,
  type RelatorioDisplayEntry,
} from "../relatorio-presentation";
import {
  relatorioPreviaErrorMessage,
  useRelatorioPrevia,
  type RelatorioPreviaRequest,
} from "../use-relatorio-previa";

type PreviewResponse = ReturnType<typeof useRelatorioPrevia>["state"];

function StepIndicator() {
  return (
    <View accessibilityLabel="Etapa 2 de 3: Prévia" style={styles.steps}>
      {["Filtros", "Prévia", "Documento"].map((step, index) => (
        <View key={step} style={styles.stepItem}>
          <View style={[styles.stepDot, index <= 1 && styles.stepDotActive]}>
            {index === 0 ? (
              <Lucide
                accessible={false}
                color="#ffffff"
                name="check"
                size={15}
              />
            ) : (
              <Text
                style={[
                  styles.stepNumber,
                  index === 1 && styles.stepNumberActive,
                ]}
              >
                {index + 1}
              </Text>
            )}
          </View>
          <Text
            style={[styles.stepLabel, index === 1 && styles.stepLabelActive]}
          >
            {step}
          </Text>
          {index < 2 ? (
            <View
              style={[styles.stepLine, index === 0 && styles.stepLineActive]}
            />
          ) : null}
        </View>
      ))}
    </View>
  );
}

function InitialFeedback({
  state,
  onRetry,
}: Readonly<{
  state: PreviewResponse;
  onRetry(): void;
}>) {
  if (state.status === "loading") {
    return (
      <View accessibilityLiveRegion="polite" style={styles.feedbackCard}>
        <ActivityIndicator color={mobileRelatorios.action} size="large" />
        <Text style={styles.feedbackTitle}>Consultando a prévia</Text>
        <Text style={styles.feedbackText}>
          Os registros reais serão validados antes de aparecerem aqui.
        </Text>
      </View>
    );
  }
  if (state.status !== "error") return null;
  return (
    <View accessibilityLiveRegion="assertive" style={styles.errorCard}>
      <Lucide
        accessible={false}
        color={mobileRelatorios.danger}
        name="triangle-alert"
        size={24}
      />
      <Text style={styles.feedbackTitle}>Não foi possível gerar a prévia</Text>
      <Text style={styles.feedbackText}>
        {relatorioPreviaErrorMessage(state.error)}
      </Text>
      <Pressable
        accessibilityRole="button"
        onPress={onRetry}
        style={styles.retryButton}
      >
        <Text style={styles.link}>Tentar novamente</Text>
      </Pressable>
    </View>
  );
}

function SummaryCards({
  summary,
}: Readonly<{ summary: Record<string, unknown> }>) {
  return (
    <View style={styles.summaryGrid}>
      {Object.entries(summary).map(([key, value]) => (
        <View key={key} style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>{relatorioFieldLabel(key)}</Text>
          <Text selectable style={styles.summaryValue}>
            {formatRelatorioValue(value)}
          </Text>
        </View>
      ))}
    </View>
  );
}

function DataFields({
  entries,
}: Readonly<{ entries: readonly RelatorioDisplayEntry[] }>) {
  return (
    <View style={styles.dataFields}>
      {entries.map((entry) => (
        <View key={entry.key} style={styles.dataField}>
          <Text style={styles.dataLabel}>{entry.label}</Text>
          <Text selectable style={styles.dataValue}>
            {entry.value}
          </Text>
        </View>
      ))}
    </View>
  );
}

function EventCard({
  event,
  index,
}: Readonly<{ event: Record<string, unknown>; index: number }>) {
  const title = formatRelatorioValue(event.tipo ?? `Evento ${index + 1}`);
  const occurrence = formatRelatorioValue(event.ocorrencia);
  const metadata = relatorioEventMetadata(event).filter(
    (entry) => entry.key !== "ocorrencia",
  );
  const details = relatorioEventEntries(event);
  return (
    <View style={styles.recordCard}>
      <Text style={styles.recordOverline}>EVENTO {index + 1}</Text>
      <Text style={styles.recordTitle}>{title}</Text>
      {event.ocorrencia ? (
        <View style={styles.eventOccurrence}>
          <Lucide
            accessible={false}
            color={mobileRelatorios.textMuted}
            name="calendar-days"
            size={15}
          />
          <Text style={styles.eventOccurrenceText}>{occurrence}</Text>
        </View>
      ) : null}
      {metadata.length ? <DataFields entries={metadata} /> : null}
      {details.length ? (
        <View style={styles.eventDetails}>
          <Text style={styles.sectionEyebrow}>DETALHES DO EVENTO</Text>
          <DataFields entries={details} />
        </View>
      ) : null}
    </View>
  );
}

export function RelatorioPreviaScreen({
  tipo,
  request,
  draft,
  selectedLabels,
  onAdjust,
  onBack,
  onPage,
}: Readonly<{
  tipo: TipoRelatorio;
  request: RelatorioPreviaRequest;
  draft: RelatorioDraft;
  selectedLabels: Readonly<Record<string, string>>;
  onAdjust(): void;
  onBack(): void;
  onPage(page: number): void;
}>) {
  const { manager } = useSession();
  const { width } = useWindowDimensions();
  const preview = useRelatorioPrevia(manager, request);
  const wide = width >= 760;
  const data = preview.state.status === "success" ? preview.state.data : null;
  const response = data?.response;
  const filters = response
    ? appliedFilterEntries(
        tipo,
        response.consulta.filtros,
        draft,
        selectedLabels,
      )
    : [];
  const canGoNext = response
    ? response.meta.pagina < response.meta.ultimaPagina &&
      response.meta.pagina * response.meta.limite <= 50_000
    : false;

  return (
    <View style={styles.screen}>
      <ScrollView
        contentContainerStyle={[styles.content, wide && styles.contentWide]}
      >
        <Pressable
          accessibilityLabel="Voltar aos filtros"
          accessibilityRole="button"
          onPress={onBack}
          style={styles.back}
        >
          <Lucide
            accessible={false}
            color={mobileRelatorios.information}
            name="arrow-left"
            size={19}
          />
          <Text style={styles.backText}>Voltar aos filtros</Text>
        </Pressable>

        <View>
          <Text style={styles.eyebrow}>PRÉVIA DO RELATÓRIO</Text>
          <Text accessibilityRole="header" style={styles.title}>
            {relatorioTitles[tipo]}
          </Text>
          <Text style={styles.subtitle}>
            Confira os registros antes de avançar para o documento.
          </Text>
        </View>
        <StepIndicator />

        <InitialFeedback state={preview.state} onRetry={preview.reload} />

        {response ? (
          <>
            {preview.isFetching ? (
              <View accessibilityLiveRegion="polite" style={styles.updating}>
                <ActivityIndicator
                  color={mobileRelatorios.action}
                  size="small"
                />
                <Text style={styles.updatingText}>Atualizando prévia…</Text>
              </View>
            ) : null}

            <View style={styles.filterCard}>
              <Text style={styles.sectionEyebrow}>FILTROS APLICADOS</Text>
              {filters.length ? (
                filters.map((filter) => (
                  <Text key={filter.key} style={styles.filterText}>
                    <Text style={styles.filterLabel}>{filter.label}: </Text>
                    {filter.value}
                  </Text>
                ))
              ) : (
                <Text style={styles.filterText}>Sem filtros adicionais.</Text>
              )}
              <Pressable
                accessibilityRole="button"
                onPress={onAdjust}
                style={styles.adjustButton}
              >
                <Lucide
                  accessible={false}
                  color={mobileRelatorios.action}
                  name="sliders-horizontal"
                  size={16}
                />
                <Text style={styles.link}>Ajustar filtros</Text>
              </Pressable>
            </View>

            <SummaryCards
              summary={response.resumo as unknown as Record<string, unknown>}
            />

            {response.consulta.excluidosDataDesconhecida > 0 ||
            response.consulta.avisos.length ? (
              <View style={styles.noticeCard}>
                <Text style={styles.sectionTitle}>Observações importantes</Text>
                {response.consulta.excluidosDataDesconhecida > 0 ? (
                  <View style={styles.warning}>
                    <Lucide
                      accessible={false}
                      color="#9b6508"
                      name="info"
                      size={16}
                    />
                    <Text style={styles.warningText}>
                      {response.consulta.excluidosDataDesconhecida} registro(s)
                      com data desconhecida não aparecem neste resultado.
                    </Text>
                  </View>
                ) : null}
                {response.consulta.avisos.map((warning, index) => (
                  <View key={`${warning}-${index}`} style={styles.warning}>
                    <Lucide
                      accessible={false}
                      color="#9b6508"
                      name="info"
                      size={16}
                    />
                    <Text style={styles.warningText}>{warning}</Text>
                  </View>
                ))}
              </View>
            ) : null}

            {data?.kind === "ficha" ? (
              <>
                <View>
                  <Text style={styles.listTitle}>Cadastro atual do bem</Text>
                  <View style={styles.recordCard}>
                    <DataFields
                      entries={relatorioCadastroEntries(
                        data.ficha.dados.cadastro as unknown as Record<
                          string,
                          unknown
                        >,
                      )}
                    />
                  </View>
                </View>
                <View>
                  <Text style={styles.listTitle}>Seções da ficha</Text>
                  <View style={styles.recordCard}>
                    {data.ficha.dados.secoes.map((section) => (
                      <View key={section.tipo} style={styles.sectionRow}>
                        <Text style={styles.dataLabel}>
                          {formatRelatorioValue(section.tipo)}
                        </Text>
                        <Text style={styles.dataValue}>
                          {section.disponivel
                            ? `${section.quantidade} registro(s)`
                            : "Indisponível"}
                        </Text>
                      </View>
                    ))}
                  </View>
                </View>
              </>
            ) : null}

            <View>
              <View style={styles.listHeader}>
                <Text style={styles.listTitle}>
                  {tipo === "ficha-bem" ? "Eventos do bem" : "Registros"}
                </Text>
                <Text style={styles.count}>{response.meta.total} no total</Text>
              </View>
              {response.dados.length === 0 ? (
                <View accessibilityLiveRegion="polite" style={styles.emptyCard}>
                  <Lucide
                    accessible={false}
                    color={mobileRelatorios.textMuted}
                    name="file-search"
                    size={24}
                  />
                  <Text style={styles.feedbackTitle}>
                    Nenhum registro corresponde aos filtros
                  </Text>
                  <Text style={styles.feedbackText}>
                    Este é um resultado válido. Os filtros e avisos foram
                    preservados; um documento vazio poderá ser gerado quando a
                    etapa de PDF estiver disponível.
                  </Text>
                </View>
              ) : (
                response.dados.map((item, index) => {
                  const record = item as unknown as Record<string, unknown>;
                  if (tipo === "ficha-bem") {
                    return (
                      <EventCard
                        event={record}
                        index={index}
                        key={`${String(record.id)}-${index}`}
                      />
                    );
                  }
                  const entries = relatorioDisplayEntries(
                    record,
                    relatorioRecordFields(tipo),
                  ).filter(
                    (entry) =>
                      ![
                        "numeroPatrimonio",
                        "numeroPatrimonioAtual",
                        "numeroSnapshot",
                        "descricao",
                        "descricaoAtual",
                        "descricaoSnapshot",
                      ].includes(entry.key),
                  );
                  return (
                    <View
                      key={`${String(record.id)}-${index}`}
                      style={styles.recordCard}
                    >
                      <Text style={styles.recordOverline}>
                        {relatorioRecordTitle(record)}
                      </Text>
                      {relatorioRecordSubtitle(record) ? (
                        <Text style={styles.recordTitle}>
                          {relatorioRecordSubtitle(record)}
                        </Text>
                      ) : null}
                      <DataFields entries={entries} />
                    </View>
                  );
                })
              )}
            </View>

            <View accessibilityRole="toolbar" style={styles.pagination}>
              <Pressable
                accessibilityRole="button"
                accessibilityState={{ disabled: response.meta.pagina <= 1 }}
                disabled={response.meta.pagina <= 1 || preview.isFetching}
                onPress={() => onPage(response.meta.pagina - 1)}
                style={styles.pageButton}
              >
                <Text style={styles.link}>Anterior</Text>
              </Pressable>
              <Text style={styles.pageText}>
                Página {response.meta.pagina} de {response.meta.ultimaPagina}
              </Text>
              <Pressable
                accessibilityRole="button"
                accessibilityState={{ disabled: !canGoNext }}
                disabled={!canGoNext || preview.isFetching}
                onPress={() => onPage(response.meta.pagina + 1)}
                style={styles.pageButton}
              >
                <Text style={styles.link}>Próxima</Text>
              </Pressable>
            </View>

            {!canGoNext && response.meta.pagina < response.meta.ultimaPagina ? (
              <Text accessibilityLiveRegion="polite" style={styles.limitText}>
                Refine os filtros: o deslocamento público máximo é de 50.000
                registros.
              </Text>
            ) : null}

            <Text style={styles.pdfNotice}>
              O documento fará uma nova consulta. Alterações posteriores à
              prévia poderão aparecer nele.
            </Text>
          </>
        ) : null}
      </ScrollView>

      <View style={styles.actionBar}>
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ disabled: true }}
          disabled
          style={styles.documentButton}
        >
          <Lucide
            accessible={false}
            color="#7b8ba0"
            name="file-text"
            size={18}
          />
          <Text style={styles.documentText}>Abrir documento</Text>
        </Pressable>
        <Text style={styles.disabledHint}>Disponível na próxima etapa.</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: {
    alignSelf: "center",
    gap: spacing.lg,
    maxWidth: layout.contentMaxWidth,
    padding: spacing.lg,
    paddingBottom: spacing.xl,
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
  backText: {
    color: mobileRelatorios.information,
    fontSize: 13,
    fontWeight: "800",
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
  stepLineActive: { backgroundColor: mobileRelatorios.action },
  feedbackCard: {
    alignItems: "center",
    backgroundColor: mobileRelatorios.surface,
    borderColor: mobileRelatorios.border,
    borderRadius: radii.lg,
    borderWidth: 1,
    gap: spacing.sm,
    padding: spacing.xl,
  },
  errorCard: {
    alignItems: "center",
    backgroundColor: mobileRelatorios.dangerSurface,
    borderColor: mobileRelatorios.dangerBorder,
    borderRadius: radii.lg,
    borderWidth: 1,
    gap: spacing.sm,
    padding: spacing.xl,
  },
  feedbackTitle: {
    color: mobileRelatorios.text,
    fontSize: 15,
    fontWeight: "800",
    textAlign: "center",
  },
  feedbackText: {
    color: mobileRelatorios.textMuted,
    fontSize: 12,
    lineHeight: 18,
    textAlign: "center",
  },
  retryButton: {
    minHeight: 44,
    justifyContent: "center",
    paddingHorizontal: spacing.md,
  },
  updating: { alignItems: "center", flexDirection: "row", gap: spacing.sm },
  updatingText: { color: mobileRelatorios.textMuted, fontSize: 12 },
  filterCard: {
    backgroundColor: mobileRelatorios.surface,
    borderColor: mobileRelatorios.border,
    borderRadius: radii.lg,
    borderWidth: 1,
    gap: spacing.sm,
    padding: spacing.lg,
  },
  sectionEyebrow: {
    color: mobileRelatorios.textMuted,
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.4,
  },
  filterText: { color: mobileRelatorios.text, fontSize: 12, lineHeight: 18 },
  filterLabel: { color: mobileRelatorios.information, fontWeight: "800" },
  adjustButton: {
    alignItems: "center",
    alignSelf: "flex-start",
    flexDirection: "row",
    gap: spacing.sm,
    minHeight: 40,
  },
  summaryGrid: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  summaryCard: {
    backgroundColor: mobileRelatorios.actionSurface,
    borderRadius: radii.md,
    flexBasis: "46%",
    flexGrow: 1,
    minWidth: 145,
    padding: spacing.md,
  },
  summaryLabel: {
    color: mobileRelatorios.textMuted,
    fontSize: 11,
    lineHeight: 15,
  },
  summaryValue: {
    color: mobileRelatorios.information,
    fontSize: 18,
    fontWeight: "800",
    lineHeight: 24,
    marginTop: spacing.xs,
  },
  noticeCard: {
    backgroundColor: mobileRelatorios.surface,
    borderColor: mobileRelatorios.border,
    borderRadius: radii.md,
    borderWidth: 1,
    gap: spacing.sm,
    padding: spacing.md,
  },
  sectionTitle: {
    color: mobileRelatorios.information,
    fontSize: 14,
    fontWeight: "800",
  },
  warning: {
    alignItems: "flex-start",
    backgroundColor: "#fff8e8",
    borderRadius: radii.sm,
    flexDirection: "row",
    gap: spacing.sm,
    padding: spacing.sm,
  },
  warningText: { color: "#7b5208", flex: 1, fontSize: 11, lineHeight: 17 },
  listHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: spacing.sm,
  },
  listTitle: {
    color: mobileRelatorios.information,
    fontSize: 15,
    fontWeight: "800",
    marginBottom: spacing.sm,
  },
  count: { color: mobileRelatorios.textMuted, fontSize: 11 },
  recordCard: {
    backgroundColor: mobileRelatorios.surface,
    borderColor: mobileRelatorios.border,
    borderRadius: radii.md,
    borderWidth: 1,
    gap: spacing.sm,
    marginBottom: spacing.sm,
    padding: spacing.md,
  },
  recordOverline: { color: mobileRelatorios.textMuted, fontSize: 10 },
  recordTitle: {
    color: mobileRelatorios.information,
    fontSize: 14,
    fontWeight: "800",
  },
  eventOccurrence: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.sm,
  },
  eventOccurrenceText: {
    color: mobileRelatorios.textMuted,
    fontSize: 12,
    lineHeight: 18,
  },
  eventDetails: {
    borderTopColor: mobileRelatorios.border,
    borderTopWidth: 1,
    gap: spacing.xs,
    marginTop: spacing.xs,
    paddingTop: spacing.md,
  },
  dataFields: { gap: spacing.sm, marginTop: spacing.xs },
  dataField: {
    borderTopColor: "#edf2f7",
    borderTopWidth: 1,
    paddingTop: spacing.sm,
  },
  dataLabel: {
    color: mobileRelatorios.textMuted,
    fontSize: 10,
    fontWeight: "700",
  },
  dataValue: {
    color: mobileRelatorios.text,
    fontSize: 12,
    lineHeight: 18,
    marginTop: 2,
  },
  sectionRow: {
    alignItems: "center",
    borderBottomColor: "#edf2f7",
    borderBottomWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: spacing.sm,
  },
  emptyCard: {
    alignItems: "center",
    backgroundColor: mobileRelatorios.surface,
    borderColor: mobileRelatorios.border,
    borderRadius: radii.md,
    borderWidth: 1,
    gap: spacing.sm,
    padding: spacing.xl,
  },
  pagination: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  pageButton: {
    justifyContent: "center",
    minHeight: 44,
    paddingHorizontal: spacing.sm,
  },
  pageText: { color: mobileRelatorios.textMuted, fontSize: 11 },
  limitText: {
    color: mobileRelatorios.danger,
    fontSize: 11,
    textAlign: "center",
  },
  pdfNotice: {
    color: mobileRelatorios.textMuted,
    fontSize: 11,
    lineHeight: 17,
    textAlign: "center",
  },
  actionBar: {
    backgroundColor: mobileRelatorios.surface,
    borderTopColor: mobileRelatorios.border,
    borderTopWidth: 1,
    padding: spacing.md,
    paddingBottom: spacing.sm,
  },
  documentButton: {
    alignItems: "center",
    backgroundColor: "#e8eef6",
    borderRadius: radii.md,
    flexDirection: "row",
    gap: spacing.sm,
    justifyContent: "center",
    minHeight: 50,
  },
  documentText: { color: "#7b8ba0", fontSize: 14, fontWeight: "800" },
  disabledHint: {
    color: mobileRelatorios.textSubtle,
    fontSize: 10,
    marginTop: spacing.xs,
    textAlign: "center",
  },
});
