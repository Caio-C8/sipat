import { Lucide } from "@react-native-vector-icons/lucide";
import type { VerificarItemInventarioResultado } from "@repo/contracts";
import {
  CameraView,
  type BarcodeScanningResult,
  useCameraPermissions,
} from "expo-camera";
import { useIsFocused, useRouter, type Href } from "expo-router";
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
import { useReloadOnReturn } from "../../../lib/navigation/use-reload-on-return";
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
  READING_TOAST_DURATION_MS,
  ReadingToast,
} from "./conferencia-feedback";
import {
  composeNumeroPatrimonial,
  conferenciaErrorMessage,
  numeroPatrimonialDigits,
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
  useReloadOnReturn(conference.detail.reload);
  const [permission, requestPermission] = useCameraPermissions();
  const [cameraAvailable, setCameraAvailable] = useState<boolean | null>(() =>
    Platform.OS === "web" ? null : true,
  );
  const [cameraMountError, setCameraMountError] = useState(false);
  const [manualValue, setManualValue] = useState("");
  const [withoutOfficialNumber, setWithoutOfficialNumber] = useState(false);

  const isDirector =
    session.status === "authenticated" &&
    session.identity.perfil === "DIRETOR_PATRIMONIO";

  useEffect(() => {
    if (!conference.lastResult || conference.divergenceOpen) return;
    const timeout = setTimeout(
      conference.dismissLastResult,
      READING_TOAST_DURATION_MS,
    );
    return () => clearTimeout(timeout);
  }, [
    conference.dismissLastResult,
    conference.divergenceOpen,
    conference.lastResult,
  ]);

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
  const submitManual = () =>
    submit(composeNumeroPatrimonial(manualValue, withoutOfficialNumber));
  const scan = (result: BarcodeScanningResult) => void submit(result.data);

  return (
    <View style={styles.screen}>
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        style={styles.scroll}
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
        <Pressable
          accessibilityLabel="Bem sem número oficial, usar prefixo SP"
          accessibilityRole="checkbox"
          accessibilityState={{
            checked: withoutOfficialNumber,
            disabled: conference.submitting,
          }}
          disabled={conference.submitting}
          onPress={() => setWithoutOfficialNumber((current) => !current)}
          style={styles.checkRow}
        >
          <View
            style={[
              styles.checkbox,
              withoutOfficialNumber && styles.checkboxChecked,
            ]}
          >
            {withoutOfficialNumber ? (
              <Lucide
                accessible={false}
                color="#ffffff"
                name="check"
                size={14}
              />
            ) : null}
          </View>
          <Text style={styles.checkText}>Bem sem número oficial (SP)</Text>
        </Pressable>
        <View style={styles.inputRow}>
          <View style={styles.inputShell}>
            {withoutOfficialNumber ? (
              <Text accessibilityLabel="Prefixo SP" style={styles.inputPrefix}>
                SP-
              </Text>
            ) : null}
            <TextInput
              accessibilityLabel={
                withoutOfficialNumber
                  ? "Parte numérica do patrimônio sem número oficial"
                  : "Número patrimonial oficial"
              }
              autoCorrect={false}
              editable={!conference.submitting}
              inputMode="numeric"
              keyboardType="number-pad"
              onChangeText={(value) =>
                setManualValue(numeroPatrimonialDigits(value))
              }
              onSubmitEditing={() => void submitManual()}
              placeholder="000001"
              placeholderTextColor={mobileInventarios.textSubtle}
              returnKeyType="done"
              style={styles.input}
              value={manualValue}
            />
          </View>
          <Pressable
            accessibilityLabel="Verificar número patrimonial"
            accessibilityRole="button"
            accessibilityState={{ disabled: conference.submitting }}
            disabled={conference.submitting}
            onPress={() => void submitManual()}
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

      </ScrollView>

      {conference.lastResult && !conference.divergenceOpen ? (
        <ReadingToast
          onClose={conference.dismissLastResult}
          result={conference.lastResult}
        />
      ) : null}

      <DivergenceModal
        onCorrect={() => {
          const item = conference.lastResult?.item;
          if (
            item?.situacao !== "DIVERGENCIA" &&
            item?.localizacaoPosterior?.statusCorrecao !== "PENDENTE"
          )
            return;
          conference.setDivergenceOpen(false);
          router.push(
            `/inventarios/${inventarioId}/itens/${item.id}/correcao` as Href,
          );
        }}
        onContinue={() => conference.setDivergenceOpen(false)}
        result={conference.divergenceOpen ? conference.lastResult : null}
      />
    </View>
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

function DivergenceModal({
  onCorrect,
  onContinue,
  result,
}: Readonly<{
  onCorrect: () => void;
  onContinue: () => void;
  result: VerificarItemInventarioResultado | null;
}>) {
  const item = result?.item;
  const localizacaoPosterior = item?.localizacaoPosterior;
  const setorEncontrado =
    item?.situacao === "DIVERGENCIA"
      ? item.setorEncontrado
      : localizacaoPosterior?.setorEncontrado;
  const posterior = result?.tipo.startsWith("LOCALIZACAO_POSTERIOR_") ?? false;
  const visible =
    item?.situacao === "DIVERGENCIA" ||
    (posterior && localizacaoPosterior?.statusCorrecao === "PENDENTE");
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
              {posterior ? "Bem encontrado" : "Setor incorreto"}
            </Text>
          </View>
          {item && setorEncontrado ? (
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
                <Text style={styles.locationValue}>{setorEncontrado.nome}</Text>
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
                accessibilityRole="button"
                onPress={onCorrect}
                style={styles.secondaryButton}
              >
                <Text style={styles.secondaryButtonText}>
                  Corrigir localização agora
                </Text>
              </Pressable>
              <Text style={styles.correctionHint}>
                {posterior
                  ? "A localização posterior foi salva e pode ser corrigida agora ou pelo resumo do setor."
                  : "A divergência já foi salva e pode ser corrigida agora ou pelo resumo do setor."}
              </Text>
            </>
          ) : null}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: mobileInventarios.canvas,
    flex: 1,
  },
  scroll: { flex: 1 },
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
  checkRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.sm,
    minHeight: layout.comfortableTouchTarget,
  },
  checkbox: {
    alignItems: "center",
    borderColor: mobileInventarios.border,
    borderRadius: 5,
    borderWidth: 1,
    height: 20,
    justifyContent: "center",
    width: 20,
  },
  checkboxChecked: {
    backgroundColor: mobileInventarios.action,
    borderColor: mobileInventarios.action,
  },
  checkText: { color: mobileInventarios.text, flex: 1, fontSize: 14 },
  inputRow: {
    alignItems: "stretch",
    flexDirection: "row",
    marginTop: spacing.sm,
  },
  inputShell: {
    alignItems: "center",
    backgroundColor: mobileInventarios.surface,
    borderColor: mobileInventarios.border,
    borderRadius: radii.md,
    borderWidth: 1,
    flex: 1,
    flexDirection: "row",
    minHeight: 52,
    paddingHorizontal: spacing.md,
  },
  inputPrefix: {
    color: mobileInventarios.text,
    fontSize: 14,
    fontWeight: "700",
    marginRight: spacing.xs,
  },
  input: {
    color: mobileInventarios.text,
    flex: 1,
    fontSize: 14,
    minHeight: 50,
    paddingHorizontal: 0,
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
