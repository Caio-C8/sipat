import { Lucide } from "@react-native-vector-icons/lucide";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { layout, mobileInventarios, radii, spacing } from "../../theme/tokens";
import { useSession } from "../auth/session/session-context";
import { Notice, ProgressLine, StatusBadge } from "./inventario-components";
import {
  inventarioErrorMessage,
  useSetorInventarioDetail,
} from "./use-inventarios";

export function SetorInventarioScreen({
  inventarioId,
  setorInventarioId,
  validIds,
}: Readonly<{
  inventarioId: string;
  setorInventarioId: string;
  validIds: boolean;
}>) {
  const router = useRouter();
  const { manager, state: session } = useSession();
  const remote = useSetorInventarioDetail(
    manager,
    inventarioId,
    setorInventarioId,
    validIds,
  );
  const [confirmationVisible, setConfirmationVisible] = useState(false);
  const [resumeNotice, setResumeNotice] = useState(false);
  const isDirector =
    session.status === "authenticated" &&
    session.identity.perfil === "DIRETOR_PATRIMONIO";

  if (remote.state.status === "loading") {
    return (
      <View
        accessibilityLabel="Carregando setor do inventário"
        style={styles.center}
      >
        <ActivityIndicator color={mobileInventarios.action} size="large" />
        <Text style={styles.stateText}>Carregando resumo do setor…</Text>
      </View>
    );
  }

  if (remote.state.status === "error") {
    return (
      <View accessibilityLiveRegion="polite" style={styles.center}>
        <Lucide
          accessible={false}
          color={mobileInventarios.danger}
          name="circle-alert"
          size={30}
        />
        <Text accessibilityRole="header" style={styles.errorTitle}>
          Setor indisponível
        </Text>
        <Text style={styles.errorText}>
          {validIds
            ? inventarioErrorMessage(remote.state.error, true)
            : "O endereço informado não contém identificadores válidos de inventário e setor."}
        </Text>
        {validIds && remote.state.error.status !== 401 ? (
          <Pressable
            accessibilityRole="button"
            onPress={remote.reload}
            style={styles.primaryButton}
          >
            <Text style={styles.primaryButtonText}>Tentar novamente</Text>
          </Pressable>
        ) : null}
      </View>
    );
  }

  const { inventario, setor, setorEmAndamento } = remote.state.data;
  const conflictingSector =
    setorEmAndamento && setorEmAndamento.id !== setor.id
      ? setorEmAndamento
      : null;

  return (
    <>
      <ScrollView contentContainerStyle={styles.content}>
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
          <Text style={styles.backText}>Todos os setores</Text>
        </Pressable>
        <Text style={styles.eyebrow}>{inventario.nome}</Text>
        <View style={styles.titleRow}>
          <Text accessibilityRole="header" style={styles.title}>
            {setor.setor.nome}
          </Text>
          <StatusBadge status={setor.status} />
        </View>
        <Text style={styles.subtitle}>Resumo da conferência deste setor</Text>

        {remote.mutationError ? (
          <Notice kind="error" title="Não foi possível iniciar">
            {inventarioErrorMessage(remote.mutationError, true)}
          </Notice>
        ) : null}
        {conflictingSector ? (
          <Notice title="Setor que permaneceu em andamento">
            {conflictingSector.setor.nome} continua em conferência. Conclua esse
            setor antes de iniciar outro.
          </Notice>
        ) : null}
        {!isDirector ? (
          <Notice title="Resumo somente leitura">
            Iniciar e retomar conferências é restrito ao Diretor de Patrimônio.
          </Notice>
        ) : null}
        {resumeNotice ? (
          <Notice title="Setor selecionado">
            A conferência em andamento foi selecionada para continuar. Leitura e
            verificação de itens pertencem à próxima etapa do fluxo.
          </Notice>
        ) : null}

        <View style={styles.summaryCard}>
          <Text style={styles.cardEyebrow}>PROGRESSO DO SETOR</Text>
          <ProgressLine
            current={setor.progresso.itensVerificados}
            label="Itens verificados"
            total={setor.progresso.totalItens}
          />
          <View style={styles.metricsGrid}>
            <Metric label="Pendentes" value={setor.progresso.itensPendentes} />
            <Metric label="Corretos" value={setor.progresso.corretos} />
            <Metric label="Divergências" value={setor.progresso.divergencias} />
            <Metric
              label="Não localizados"
              value={setor.progresso.naoLocalizados}
            />
          </View>
        </View>

        {setor.status === "CONCLUIDO" ? (
          <Notice title="Conferência concluída">
            Este setor está encerrado e permanece disponível somente para
            consulta.
          </Notice>
        ) : null}

        {isDirector && setor.status === "PENDENTE" ? (
          <Pressable
            accessibilityRole="button"
            accessibilityState={{
              disabled: remote.starting || Boolean(conflictingSector),
            }}
            disabled={remote.starting || Boolean(conflictingSector)}
            onPress={() => setConfirmationVisible(true)}
            style={[
              styles.primaryButton,
              (remote.starting || conflictingSector) && styles.disabledButton,
            ]}
          >
            <Lucide
              accessible={false}
              color="#ffffff"
              name="scan-barcode"
              size={20}
            />
            <Text style={styles.primaryButtonText}>
              {remote.starting ? "Iniciando…" : "Iniciar conferência"}
            </Text>
          </Pressable>
        ) : null}
        {isDirector && setor.status === "EM_ANDAMENTO" ? (
          <Pressable
            accessibilityRole="button"
            onPress={() => setResumeNotice(true)}
            style={styles.primaryButton}
          >
            <Lucide
              accessible={false}
              color="#ffffff"
              name="scan-barcode"
              size={20}
            />
            <Text style={styles.primaryButtonText}>Retomar conferência</Text>
          </Pressable>
        ) : null}
        <Pressable
          accessibilityRole="button"
          onPress={remote.reload}
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

      <Modal
        animationType="fade"
        onRequestClose={() => setConfirmationVisible(false)}
        transparent
        visible={confirmationVisible}
      >
        <View style={styles.overlay}>
          <View accessibilityViewIsModal style={styles.dialog}>
            <Text accessibilityRole="header" style={styles.dialogTitle}>
              Iniciar conferência?
            </Text>
            <Text style={styles.dialogText}>
              Você iniciará a conferência de {setor.setor.nome}. Somente um
              setor pode permanecer em andamento.
            </Text>
            <View style={styles.dialogActions}>
              <Pressable
                accessibilityRole="button"
                onPress={() => setConfirmationVisible(false)}
                style={styles.secondaryButton}
              >
                <Text style={styles.secondaryButtonText}>Cancelar</Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                onPress={() => {
                  setConfirmationVisible(false);
                  void remote.start();
                }}
                style={styles.primaryDialogButton}
              >
                <Text style={styles.primaryButtonText}>Confirmar início</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

function Metric({ label, value }: Readonly<{ label: string; value: number }>) {
  return (
    <View style={styles.metric}>
      <Text style={styles.metricValue}>{value.toLocaleString("pt-BR")}</Text>
      <Text style={styles.metricLabel}>{label}</Text>
    </View>
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
    marginTop: spacing.md,
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
    letterSpacing: 0.5,
    marginTop: spacing.md,
    textTransform: "uppercase",
  },
  titleRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.md,
    marginTop: spacing.xs,
  },
  title: {
    color: mobileInventarios.text,
    flex: 1,
    fontSize: 26,
    fontWeight: "800",
  },
  subtitle: {
    color: mobileInventarios.textMuted,
    fontSize: 14,
    marginBottom: spacing.xl,
    marginTop: spacing.xs,
  },
  summaryCard: {
    backgroundColor: mobileInventarios.surface,
    borderColor: mobileInventarios.border,
    borderRadius: radii.md,
    borderWidth: 1,
    marginBottom: spacing.lg,
    padding: spacing.lg,
  },
  cardEyebrow: {
    color: mobileInventarios.textMuted,
    fontSize: 11,
    fontWeight: "800",
  },
  metricsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    marginTop: spacing.lg,
  },
  metric: {
    backgroundColor: mobileInventarios.canvas,
    borderRadius: radii.sm,
    minWidth: 130,
    padding: spacing.md,
    flexGrow: 1,
  },
  metricValue: {
    color: mobileInventarios.text,
    fontSize: 20,
    fontWeight: "800",
  },
  metricLabel: {
    color: mobileInventarios.textMuted,
    fontSize: 11,
    marginTop: spacing.xs,
  },
  primaryButton: {
    alignItems: "center",
    backgroundColor: mobileInventarios.action,
    borderRadius: radii.md,
    flexDirection: "row",
    gap: spacing.sm,
    justifyContent: "center",
    minHeight: 52,
    paddingHorizontal: spacing.lg,
  },
  disabledButton: { opacity: 0.5 },
  primaryButtonText: { color: "#ffffff", fontWeight: "800" },
  refreshButton: {
    alignItems: "center",
    alignSelf: "center",
    flexDirection: "row",
    gap: spacing.sm,
    marginTop: spacing.md,
    minHeight: 48,
    paddingHorizontal: spacing.lg,
  },
  refreshText: {
    color: mobileInventarios.action,
    fontSize: 13,
    fontWeight: "700",
  },
  overlay: {
    alignItems: "center",
    backgroundColor: mobileInventarios.overlay,
    flex: 1,
    justifyContent: "center",
    padding: spacing.xl,
  },
  dialog: {
    backgroundColor: mobileInventarios.surface,
    borderRadius: radii.lg,
    maxWidth: 480,
    padding: spacing.xl,
    width: "100%",
  },
  dialogTitle: {
    color: mobileInventarios.text,
    fontSize: 21,
    fontWeight: "800",
  },
  dialogText: {
    color: mobileInventarios.textMuted,
    fontSize: 14,
    lineHeight: 21,
    marginTop: spacing.sm,
  },
  dialogActions: {
    flexDirection: "row",
    gap: spacing.md,
    marginTop: spacing.xl,
  },
  secondaryButton: {
    alignItems: "center",
    borderColor: mobileInventarios.border,
    borderRadius: radii.md,
    borderWidth: 1,
    flex: 1,
    justifyContent: "center",
    minHeight: 48,
  },
  secondaryButtonText: { color: mobileInventarios.text, fontWeight: "700" },
  primaryDialogButton: {
    alignItems: "center",
    backgroundColor: mobileInventarios.action,
    borderRadius: radii.md,
    flex: 1,
    justifyContent: "center",
    minHeight: 48,
  },
});
