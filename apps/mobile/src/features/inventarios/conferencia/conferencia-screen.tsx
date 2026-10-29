import { Lucide } from "@react-native-vector-icons/lucide";
import type { VerificarItemInventarioResultado } from "@repo/contracts";
import {
  CameraView,
  type BarcodeScanningResult,
  useCameraPermissions,
} from "expo-camera";
import { useIsFocused, useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from "react-native";
import {
  layout,
  mobileInventarios,
  radii,
  spacing,
} from "../../../theme/tokens";
import { useSession } from "../../auth/session/session-context";
import { Notice, ProgressLine } from "../inventario-components";
import { inventarioErrorMessage } from "../use-inventarios";
import {
  conferenciaErrorMessage,
  shouldMountCamera,
} from "./conferencia-state";
import { useConferencia } from "./use-conferencia";

export function ConferenciaScreen({
  inventarioId,
  setorInventarioId,
  validIds,
}: Readonly<{
  inventarioId: string;
  setorInventarioId: string;
  validIds: boolean;
}>) {
  const router = useRouter();
  const focused = useIsFocused();
  const { width } = useWindowDimensions();
  const { manager, state: session } = useSession();
  const conference = useConferencia(
    manager,
    inventarioId,
    setorInventarioId,
    validIds,
  );
  const [permission, requestPermission] = useCameraPermissions();
  const [cameraAvailable, setCameraAvailable] = useState<boolean | null>(() =>
    Platform.OS === "web" ? null : true,
  );
  const [cameraMountError, setCameraMountError] = useState(false);
  const [manualValue, setManualValue] = useState("");

  const isDirector =
    session.status === "authenticated" &&
    session.identity.perfil === "DIRETOR_PATRIMONIO";

  useEffect(() => {
    if (Platform.OS !== "web") return;
    let current = true;
    void CameraView.isAvailableAsync()
      .then((available) => {
        if (current) setCameraAvailable(available);
      })
      .catch(() => {
        if (current) setCameraAvailable(false);
      });
    return () => {
      current = false;
    };
  }, []);

  const cameraHeight = useMemo(
    () => Math.min(320, Math.max(166, (width - spacing.xl * 2) * (166 / 350))),
    [width],
  );

  if (conference.detail.state.status === "loading") {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={mobileInventarios.action} size="large" />
        <Text style={styles.stateText}>Carregando conferência…</Text>
      </View>
    );
  }

  if (conference.detail.state.status === "error") {
    return (
      <View accessibilityLiveRegion="polite" style={styles.center}>
        <Text accessibilityRole="header" style={styles.stateTitle}>
          Conferência indisponível
        </Text>
        <Text style={styles.stateText}>
          {validIds
            ? inventarioErrorMessage(conference.detail.state.error, true)
            : "O endereço informado não contém identificadores válidos."}
        </Text>
      </View>
    );
  }

  const { inventario, setor } = conference.detail.state.data;
  if (!isDirector || setor.status !== "EM_ANDAMENTO") {
    return (
      <View style={styles.center}>
        <Text accessibilityRole="header" style={styles.stateTitle}>
          Conferência não disponível
        </Text>
        <Text style={styles.stateText}>
          {!isDirector
            ? "Somente o Diretor de Patrimônio pode registrar leituras."
            : "Este setor não está em andamento. Volte ao resumo para atualizar os dados."}
        </Text>
        <Pressable
          accessibilityRole="button"
          onPress={() => router.back()}
          style={styles.primaryButton}
        >
          <Text style={styles.primaryButtonText}>Voltar ao setor</Text>
        </Pressable>
      </View>
    );
  }

  const modalOpen = conference.divergenceOpen;
  const mountCamera = shouldMountCamera({
    available: cameraAvailable === true && !cameraMountError,
    focused,
    granted: permission?.granted === true,
    modalOpen,
    submitting: conference.submitting,
  });

  const submit = async (value: string) => {
    const success = await conference.submit(value);
    if (success) setManualValue("");
  };
  const scan = (result: BarcodeScanningResult) => void submit(result.data);

  return (
    <>
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
          <Text style={styles.backText}>Resumo do setor</Text>
        </Pressable>

        <Text style={styles.eyebrow}>CONFERÊNCIA EM ANDAMENTO</Text>
        <Text accessibilityRole="header" style={styles.title}>
          {setor.setor.nome}
        </Text>
        <Text style={styles.subtitle}>{inventario.nome}</Text>

        <View style={styles.progressCard}>
          <ProgressLine
            current={setor.progresso.itensVerificados}
            label="Ativos esperados do setor"
            total={setor.progresso.totalItens}
          />
          <Text style={styles.progressMeta}>
            {setor.progresso.divergencias} divergência(s) ·{" "}
            {setor.progresso.naoLocalizados} não localizado(s)
          </Text>
        </View>

        {conference.mutationError ? (
          <Notice kind="error" title="Leitura não registrada">
            {conferenciaErrorMessage(conference.mutationError)}
          </Notice>
        ) : null}

        <CameraPanel
          available={cameraAvailable}
          canAskAgain={permission?.canAskAgain ?? true}
          granted={permission?.granted === true}
          height={cameraHeight}
          mountCamera={mountCamera}
          mountError={cameraMountError}
          onMountError={() => setCameraMountError(true)}
          onRequestPermission={() => void requestPermission()}
          onScan={scan}
          paused={conference.submitting || modalOpen || !focused}
          permissionLoaded={permission !== null}
        />

        <Text style={styles.manualLabel}>Ou digite o código manualmente</Text>
        <View style={styles.inputRow}>
          <TextInput
            accessibilityLabel="Número patrimonial"
            autoCapitalize="characters"
            autoCorrect={false}
            editable={!conference.submitting}
            onChangeText={setManualValue}
            onSubmitEditing={() => void submit(manualValue)}
            placeholder="Número patrimonial ou SP-XXXX"
            placeholderTextColor={mobileInventarios.textSubtle}
            returnKeyType="done"
            style={styles.input}
            value={manualValue}
          />
          <Pressable
            accessibilityLabel="Verificar número patrimonial"
            accessibilityRole="button"
            accessibilityState={{ disabled: conference.submitting }}
            disabled={conference.submitting}
            onPress={() => void submit(manualValue)}
            style={styles.inputAction}
          >
            {conference.submitting ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Lucide
                accessible={false}
                color="#ffffff"
                name="arrow-right"
                size={20}
              />
            )}
          </Pressable>
        </View>
        {conference.inputError ? (
          <Text accessibilityLiveRegion="polite" style={styles.inputError}>
            {conference.inputError}
          </Text>
        ) : null}

        {conference.lastResult ? (
          <LastReading result={conference.lastResult} />
        ) : (
          <View style={styles.emptyReading}>
            <Text style={styles.readingEyebrow}>ÚLTIMA LEITURA</Text>
            <Text style={styles.emptyReadingText}>
              Aponte a câmera para uma etiqueta ou informe o número patrimonial.
            </Text>
          </View>
        )}
      </ScrollView>

      <DivergenceModal
        onContinue={() => conference.setDivergenceOpen(false)}
        result={
          conference.divergenceOpen &&
          conference.lastResult?.item.situacao === "DIVERGENCIA"
            ? conference.lastResult
            : null
        }
      />
    </>
  );
}

function CameraPanel({
  available,
  canAskAgain,
  granted,
  height,
  mountCamera,
  mountError,
  onMountError,
  onRequestPermission,
  onScan,
  paused,
  permissionLoaded,
}: Readonly<{
  available: boolean | null;
  canAskAgain: boolean;
  granted: boolean;
  height: number;
  mountCamera: boolean;
  mountError: boolean;
  onMountError: () => void;
  onRequestPermission: () => void;
  onScan: (result: BarcodeScanningResult) => void;
  paused: boolean;
  permissionLoaded: boolean;
}>) {
  let message = "Preparando câmera…";
  if (available === false) message = "Câmera indisponível neste dispositivo.";
  else if (mountError) message = "Não foi possível iniciar a câmera.";
  else if (!permissionLoaded) message = "Carregando permissão da câmera…";
  else if (!granted && !canAskAgain)
    message =
      "Permissão de câmera bloqueada. Ative-a nos ajustes do dispositivo.";
  else if (!granted)
    message = "Permita a câmera para ler etiquetas patrimoniais.";
  else if (paused) message = "Câmera pausada durante o processamento.";

  return (
    <View style={[styles.cameraFrame, { height }]}>
      {mountCamera ? (
        <CameraView
          active
          facing="back"
          onBarcodeScanned={onScan}
          onMountError={onMountError}
          style={StyleSheet.absoluteFill}
        />
      ) : (
        <View style={styles.cameraFallback}>
          <Lucide
            accessible={false}
            color="#ffffff"
            name="scan-barcode"
            size={34}
          />
          <Text style={styles.cameraMessage}>{message}</Text>
          {permissionLoaded &&
          !granted &&
          canAskAgain &&
          available !== false ? (
            <Pressable
              accessibilityRole="button"
              onPress={onRequestPermission}
              style={styles.permissionButton}
            >
              <Text style={styles.permissionButtonText}>Permitir câmera</Text>
            </Pressable>
          ) : null}
        </View>
      )}
      {mountCamera ? (
        <View pointerEvents="none" style={styles.scanGuide}>
          <Text style={styles.scanGuideText}>
            Posicione o código dentro da área
          </Text>
          <View style={styles.scanLine} />
        </View>
      ) : null}
    </View>
  );
}

function LastReading({
  result,
}: Readonly<{ result: VerificarItemInventarioResultado }>) {
  const { item } = result;
  const correct = item.situacao === "CORRETO";
  return (
    <View
      accessibilityLiveRegion="polite"
      style={[styles.readingCard, !correct && styles.readingCardWarning]}
    >
      <Text style={styles.readingEyebrow}>
        {result.tipo === "LEITURA_IDEMPOTENTE"
          ? "LEITURA JÁ REGISTRADA"
          : "ÚLTIMA LEITURA"}
      </Text>
      <Text style={styles.readingTitle}>{item.patrimonio.descricao}</Text>
      <Text style={styles.readingNumber}>
        {item.patrimonio.numeroPatrimonio}
      </Text>
      <Text style={styles.readingText}>
        {correct
          ? `${item.setorEsperado.nome} · setor correto.`
          : item.situacao === "DIVERGENCIA"
            ? `Cadastrado em ${item.setorEsperado.nome}; encontrado em ${item.setorEncontrado.nome}.`
            : "Leitura registrada."}
      </Text>
    </View>
  );
}

function DivergenceModal({
  onContinue,
  result,
}: Readonly<{
  onContinue: () => void;
  result: VerificarItemInventarioResultado | null;
}>) {
  const item = result?.item;
  const visible = item?.situacao === "DIVERGENCIA";
  return (
    <Modal
      animationType="slide"
      onRequestClose={onContinue}
      transparent
      visible={visible}
    >
      <View style={styles.overlay}>
        <View accessibilityViewIsModal style={styles.sheet}>
          <View style={styles.sheetHandle} />
          <View style={styles.sheetTitleRow}>
            <Lucide
              accessible={false}
              color={mobileInventarios.warning}
              name="triangle-alert"
              size={24}
            />
            <Text accessibilityRole="header" style={styles.sheetTitle}>
              Setor incorreto
            </Text>
          </View>
          {item?.situacao === "DIVERGENCIA" ? (
            <>
              <Text style={styles.sheetItem}>{item.patrimonio.descricao}</Text>
              <Text style={styles.sheetNumber}>
                {item.patrimonio.numeroPatrimonio}
              </Text>
              <View style={styles.locationCard}>
                <Text style={styles.locationLabel}>Setor cadastrado</Text>
                <Text style={styles.locationValue}>
                  {item.setorEsperado.nome}
                </Text>
                <Text style={styles.locationLabel}>Encontrado em</Text>
                <Text style={styles.locationValue}>
                  {item.setorEncontrado.nome}
                </Text>
              </View>
              <Pressable
                accessibilityRole="button"
                onPress={onContinue}
                style={styles.primaryButton}
              >
                <Text style={styles.primaryButtonText}>
                  Continuar conferência
                </Text>
              </Pressable>
              <Pressable
                accessibilityHint="A correção será habilitada pela próxima etapa do fluxo de inventário"
                accessibilityRole="button"
                accessibilityState={{ disabled: true }}
                disabled
                style={[styles.secondaryButton, styles.disabledButton]}
              >
                <Text style={styles.secondaryButtonText}>
                  Corrigir localização agora
                </Text>
              </Pressable>
              <Text style={styles.correctionHint}>
                A divergência já foi salva e permanece pendente até o fluxo de
                correção.
              </Text>
            </>
          ) : null}
        </View>
      </View>
    </Modal>
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
  stateTitle: {
    color: mobileInventarios.text,
    fontSize: 22,
    fontWeight: "800",
    textAlign: "center",
  },
  stateText: {
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
    color: mobileInventarios.action,
    fontSize: 11,
    fontWeight: "800",
    marginTop: spacing.sm,
  },
  title: {
    color: mobileInventarios.text,
    fontSize: 28,
    fontWeight: "800",
    marginTop: spacing.xs,
  },
  subtitle: {
    color: mobileInventarios.textMuted,
    fontSize: 13,
    marginTop: spacing.xs,
  },
  progressCard: {
    backgroundColor: mobileInventarios.surface,
    borderColor: mobileInventarios.border,
    borderRadius: radii.md,
    borderWidth: 1,
    marginVertical: spacing.lg,
    padding: spacing.lg,
  },
  progressMeta: {
    color: mobileInventarios.textMuted,
    fontSize: 11,
    marginTop: spacing.md,
  },
  cameraFrame: {
    backgroundColor: "#0f2f55",
    borderRadius: radii.md,
    marginTop: spacing.sm,
    overflow: "hidden",
    width: "100%",
  },
  cameraFallback: {
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
    padding: spacing.lg,
  },
  cameraMessage: {
    color: "#ffffff",
    fontSize: 13,
    marginTop: spacing.sm,
    textAlign: "center",
  },
  permissionButton: {
    borderColor: "rgba(255,255,255,0.7)",
    borderRadius: radii.sm,
    borderWidth: 1,
    marginTop: spacing.md,
    minHeight: 44,
    paddingHorizontal: spacing.lg,
    justifyContent: "center",
  },
  permissionButtonText: { color: "#ffffff", fontWeight: "700" },
  scanGuide: {
    alignItems: "center",
    bottom: 0,
    justifyContent: "center",
    left: 0,
    padding: spacing.lg,
    position: "absolute",
    right: 0,
    top: 0,
  },
  scanGuideText: {
    color: "#ffffff",
    fontSize: 12,
    textShadowColor: "#000000",
    textShadowRadius: 3,
  },
  scanLine: {
    backgroundColor: "#ffffff",
    height: 2,
    marginTop: spacing.xl,
    opacity: 0.85,
    width: "68%",
  },
  manualLabel: {
    color: mobileInventarios.text,
    fontSize: 13,
    marginTop: spacing.lg,
  },
  inputRow: {
    alignItems: "stretch",
    flexDirection: "row",
    marginTop: spacing.sm,
  },
  input: {
    backgroundColor: mobileInventarios.surface,
    borderColor: mobileInventarios.border,
    borderRadius: radii.md,
    borderWidth: 1,
    color: mobileInventarios.text,
    flex: 1,
    fontSize: 14,
    minHeight: 52,
    paddingHorizontal: spacing.md,
  },
  inputAction: {
    alignItems: "center",
    backgroundColor: mobileInventarios.action,
    borderRadius: radii.md,
    justifyContent: "center",
    marginLeft: spacing.sm,
    width: 52,
  },
  inputError: {
    color: mobileInventarios.danger,
    fontSize: 12,
    marginTop: spacing.sm,
  },
  emptyReading: {
    backgroundColor: mobileInventarios.actionSurface,
    borderRadius: radii.md,
    marginTop: spacing.xl,
    padding: spacing.lg,
  },
  emptyReadingText: {
    color: mobileInventarios.textMuted,
    fontSize: 13,
    lineHeight: 19,
    marginTop: spacing.sm,
  },
  readingCard: {
    backgroundColor: mobileInventarios.successSurface,
    borderRadius: radii.md,
    marginTop: spacing.xl,
    padding: spacing.lg,
  },
  readingCardWarning: { backgroundColor: mobileInventarios.warningSurface },
  readingEyebrow: {
    color: mobileInventarios.textMuted,
    fontSize: 10,
    fontWeight: "800",
  },
  readingTitle: {
    color: mobileInventarios.text,
    fontSize: 16,
    fontWeight: "800",
    marginTop: spacing.sm,
  },
  readingNumber: {
    color: mobileInventarios.textMuted,
    fontSize: 12,
    marginTop: spacing.xs,
  },
  readingText: {
    color: mobileInventarios.textMuted,
    fontSize: 12,
    lineHeight: 18,
    marginTop: spacing.md,
  },
  primaryButton: {
    alignItems: "center",
    backgroundColor: mobileInventarios.action,
    borderRadius: radii.md,
    justifyContent: "center",
    marginTop: spacing.xl,
    minHeight: 52,
    paddingHorizontal: spacing.lg,
  },
  primaryButtonText: { color: "#ffffff", fontWeight: "800" },
  overlay: {
    backgroundColor: mobileInventarios.overlay,
    flex: 1,
    justifyContent: "flex-end",
  },
  sheet: {
    alignSelf: "center",
    backgroundColor: mobileInventarios.surface,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    maxHeight: "90%",
    maxWidth: 720,
    padding: spacing.xl,
    paddingBottom: Platform.OS === "ios" ? spacing.xxxl : spacing.xl,
    width: "100%",
  },
  sheetHandle: {
    alignSelf: "center",
    backgroundColor: mobileInventarios.border,
    borderRadius: radii.pill,
    height: 4,
    marginBottom: spacing.lg,
    width: 46,
  },
  sheetTitleRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.md,
  },
  sheetTitle: {
    color: mobileInventarios.text,
    fontSize: 22,
    fontWeight: "800",
  },
  sheetItem: {
    color: mobileInventarios.text,
    fontSize: 16,
    marginTop: spacing.lg,
  },
  sheetNumber: {
    color: mobileInventarios.textMuted,
    fontSize: 12,
    marginTop: spacing.xs,
  },
  locationCard: {
    backgroundColor: mobileInventarios.actionSurface,
    borderRadius: radii.md,
    marginTop: spacing.lg,
    padding: spacing.lg,
  },
  locationLabel: {
    color: mobileInventarios.textMuted,
    fontSize: 11,
    marginTop: spacing.xs,
  },
  locationValue: {
    color: mobileInventarios.text,
    fontSize: 14,
    fontWeight: "800",
    marginBottom: spacing.md,
    marginTop: spacing.xs,
  },
  secondaryButton: {
    alignItems: "center",
    borderColor: mobileInventarios.border,
    borderRadius: radii.md,
    borderWidth: 1,
    justifyContent: "center",
    marginTop: spacing.md,
    minHeight: 52,
  },
  secondaryButtonText: { color: mobileInventarios.text, fontWeight: "800" },
  disabledButton: { opacity: 0.55 },
  correctionHint: {
    color: mobileInventarios.textMuted,
    fontSize: 11,
    lineHeight: 16,
    marginTop: spacing.sm,
    textAlign: "center",
  },
});
