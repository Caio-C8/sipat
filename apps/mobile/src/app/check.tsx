import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import type { HealthResponse } from "@repo/contracts";
import { FoundationScreen } from "../components/shared/foundation-screen";
import { publicAppConfig } from "../config/public-app-config";
import { getApiHealth } from "../lib/api-health";
import { layout } from "../theme/tokens";

const API_TIMEOUT_MS = 8_000;

type ApiCheckState =
  | { status: "loading" }
  | { status: "success"; health: HealthResponse }
  | { status: "error"; message: string }
  | { status: "not-configured" };

const { apiHealthUrl, appName, appVersion, environment } = publicAppConfig;

function formatTimestamp(value: string): string {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "medium",
  }).format(new Date(value));
}

function StatusIndicator({ available }: Readonly<{ available: boolean }>) {
  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[
        styles.statusIndicator,
        available ? styles.statusAvailable : styles.statusUnavailable,
      ]}
    />
  );
}

export default function CheckScreen() {
  const { width } = useWindowDimensions();
  const isDevelopment = environment === "development";
  const activeRequest = useRef<AbortController | null>(null);
  const [apiCheck, setApiCheck] = useState<ApiCheckState>(
    isDevelopment && apiHealthUrl
      ? { status: "loading" }
      : { status: "not-configured" },
  );

  const checkApi = useCallback(async () => {
    if (!isDevelopment || !apiHealthUrl) {
      setApiCheck({ status: "not-configured" });
      return;
    }

    activeRequest.current?.abort();

    const controller = new AbortController();
    let timedOut = false;
    activeRequest.current = controller;
    setApiCheck({ status: "loading" });

    const timeout = setTimeout(() => {
      timedOut = true;
      controller.abort();
    }, API_TIMEOUT_MS);

    try {
      const health = await getApiHealth(apiHealthUrl, controller.signal);

      if (activeRequest.current === controller) {
        setApiCheck({ status: "success", health });
      }
    } catch (error) {
      if (activeRequest.current !== controller) {
        return;
      }

      if (timedOut) {
        setApiCheck({
          status: "error",
          message: "A API não respondeu dentro de 8 segundos.",
        });
        return;
      }

      if (error instanceof Error && error.name === "AbortError") {
        return;
      }

      setApiCheck({
        status: "error",
        message:
          Platform.OS === "web" &&
          error instanceof TypeError &&
          error.message === "Failed to fetch"
            ? "Não foi possível acessar a API. Confirme se ela está ativa e se o CORS permite esta origem."
            : error instanceof Error
              ? error.message
              : "Não foi possível consultar a API.",
      });
    } finally {
      clearTimeout(timeout);

      if (activeRequest.current === controller) {
        activeRequest.current = null;
      }
    }
  }, [isDevelopment]);

  useEffect(() => {
    if (!isDevelopment) {
      return;
    }

    const initialCheck = setTimeout(() => void checkApi(), 0);

    return () => {
      clearTimeout(initialCheck);
      activeRequest.current?.abort();
    };
  }, [checkApi, isDevelopment]);

  if (!isDevelopment) {
    return (
      <FoundationScreen
        description="As verificações técnicas ficam disponíveis somente no ambiente de desenvolvimento."
        title="Verificação indisponível"
      />
    );
  }

  const apiAvailable = apiCheck.status === "success";
  const apiLoading = apiCheck.status === "loading";
  const usesWideLayout = width >= layout.wideMinWidth;

  return (
    <ScrollView
      contentContainerStyle={styles.scrollContent}
      refreshControl={
        <RefreshControl
          refreshing={apiLoading}
          onRefresh={() => void checkApi()}
          tintColor="#ffffff"
        />
      }
    >
      <View style={styles.hero}>
        <View style={styles.environmentBadge}>
          <Text style={styles.environmentText}>{environment}</Text>
        </View>

        <Text style={styles.eyebrow}>GESTÃO PATRIMONIAL</Text>
        <Text style={styles.title}>{appName}</Text>
        <Text style={styles.lead}>
          O aplicativo móvel está pronto para receber os fluxos patrimoniais.
          Use as verificações abaixo para confirmar o runtime e a conexão com a
          API.
        </Text>
      </View>

      <View style={[styles.content, usesWideLayout && styles.contentWide]}>
        <Text style={styles.sectionTitle}>Verificações da infraestrutura</Text>

        <View
          style={[styles.cardsGrid, usesWideLayout && styles.cardsGridWide]}
        >
          <View
            accessibilityLabel={`Aplicativo móvel operacional, versão ${appVersion}`}
            style={[styles.card, usesWideLayout && styles.cardWide]}
          >
            <View style={styles.cardHeader}>
              <View style={styles.cardHeading}>
                <StatusIndicator available />
                <Text style={styles.cardTitle}>Aplicativo móvel</Text>
              </View>
              <Text style={[styles.statusBadge, styles.statusBadgeSuccess]}>
                Operacional
              </Text>
            </View>

            <Text style={styles.cardDescription}>
              Runtime React Native inicializado neste dispositivo.
            </Text>

            <View style={styles.metadataGrid}>
              <View style={styles.metadataItem}>
                <Text style={styles.metadataLabel}>Plataforma</Text>
                <Text style={styles.metadataValue}>{Platform.OS}</Text>
              </View>
              <View style={styles.metadataItem}>
                <Text style={styles.metadataLabel}>Versão</Text>
                <Text style={styles.metadataValue}>{appVersion}</Text>
              </View>
            </View>
          </View>

          <View
            accessibilityLiveRegion="polite"
            accessibilityLabel={
              apiAvailable
                ? "API backend disponível"
                : "API backend indisponível ou aguardando verificação"
            }
            style={[styles.card, usesWideLayout && styles.cardWide]}
          >
            <View style={styles.cardHeader}>
              <View style={styles.cardHeading}>
                <StatusIndicator available={apiAvailable} />
                <Text style={styles.cardTitle}>API backend</Text>
              </View>

              {apiLoading ? (
                <ActivityIndicator color="#1f6848" size="small" />
              ) : (
                <Text
                  style={[
                    styles.statusBadge,
                    apiAvailable
                      ? styles.statusBadgeSuccess
                      : styles.statusBadgeError,
                  ]}
                >
                  {apiAvailable ? "Disponível" : "Indisponível"}
                </Text>
              )}
            </View>

            {apiCheck.status === "loading" && (
              <Text style={styles.cardDescription}>
                Consultando o health check da API…
              </Text>
            )}

            {apiCheck.status === "success" && (
              <>
                <Text style={styles.cardDescription}>
                  A integração com o backend respondeu corretamente.
                </Text>

                <View style={styles.metadataGrid}>
                  <View style={styles.metadataItem}>
                    <Text style={styles.metadataLabel}>Serviço</Text>
                    <Text style={styles.metadataValue}>
                      {apiCheck.health.service}
                    </Text>
                  </View>
                  <View style={styles.metadataItem}>
                    <Text style={styles.metadataLabel}>Versão</Text>
                    <Text style={styles.metadataValue}>
                      {apiCheck.health.version}
                    </Text>
                  </View>
                </View>

                <Text style={styles.lastCheck}>
                  Atualizado em {formatTimestamp(apiCheck.health.timestamp)}
                </Text>
              </>
            )}

            {apiCheck.status === "error" && (
              <Text style={styles.errorMessage}>{apiCheck.message}</Text>
            )}

            {apiCheck.status === "not-configured" && (
              <Text style={styles.errorMessage}>
                Configure EXPO_PUBLIC_API_URL para verificar a API neste build.
              </Text>
            )}

            <Text numberOfLines={2} selectable style={styles.endpoint}>
              {apiHealthUrl ?? "Endpoint não configurado"}
            </Text>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Verificar novamente a API"
              disabled={apiLoading || !apiHealthUrl}
              onPress={() => void checkApi()}
              style={({ pressed }) => [
                styles.button,
                (apiLoading || !apiHealthUrl) && styles.buttonDisabled,
                pressed && styles.buttonPressed,
              ]}
            >
              <Text style={styles.buttonText}>
                {apiLoading ? "Verificando…" : "Verificar novamente"}
              </Text>
            </Pressable>
          </View>
        </View>

        <Text style={styles.footer}>
          Deslize para baixo para atualizar as verificações.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    flexGrow: 1,
    backgroundColor: "#f1f5f2",
  },
  hero: {
    backgroundColor: "#123f32",
    paddingHorizontal: 24,
    paddingTop: 28,
    paddingBottom: 44,
  },
  environmentBadge: {
    alignSelf: "flex-start",
    borderRadius: 999,
    backgroundColor: "rgba(255, 255, 255, 0.12)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginBottom: 28,
  },
  environmentText: {
    color: "#d5eadd",
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  eyebrow: {
    color: "#8dc6a6",
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 1.5,
  },
  title: {
    color: "#ffffff",
    fontSize: 42,
    fontWeight: "800",
    letterSpacing: -1.2,
    marginTop: 6,
  },
  lead: {
    color: "#d5eadd",
    fontSize: 16,
    lineHeight: 24,
    marginTop: 14,
    maxWidth: 560,
  },
  content: {
    flex: 1,
    gap: 16,
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 32,
  },
  contentWide: {
    paddingHorizontal: 32,
  },
  sectionTitle: {
    color: "#173c31",
    fontSize: 20,
    fontWeight: "800",
    marginBottom: 2,
    marginLeft: 4,
  },
  cardsGrid: {
    gap: 16,
  },
  cardsGridWide: {
    alignItems: "stretch",
    flexDirection: "row",
  },
  card: {
    backgroundColor: "#ffffff",
    borderColor: "#dbe5de",
    borderRadius: 18,
    borderWidth: 1,
    padding: 20,
    shadowColor: "#173c31",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 3,
  },
  cardWide: {
    flex: 1,
  },
  cardHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  cardHeading: {
    alignItems: "center",
    flexDirection: "row",
    flexShrink: 1,
    gap: 10,
  },
  statusIndicator: {
    borderRadius: 999,
    height: 10,
    width: 10,
  },
  statusAvailable: {
    backgroundColor: "#2e8b62",
  },
  statusUnavailable: {
    backgroundColor: "#b75447",
  },
  cardTitle: {
    color: "#173c31",
    fontSize: 18,
    fontWeight: "800",
  },
  statusBadge: {
    borderRadius: 999,
    fontSize: 11,
    fontWeight: "800",
    overflow: "hidden",
    paddingHorizontal: 10,
    paddingVertical: 6,
    textTransform: "uppercase",
  },
  statusBadgeSuccess: {
    backgroundColor: "#e1f2e8",
    color: "#1f6848",
  },
  statusBadgeError: {
    backgroundColor: "#f9e7e3",
    color: "#8e3f34",
  },
  cardDescription: {
    color: "#52665c",
    fontSize: 15,
    lineHeight: 22,
    marginTop: 14,
  },
  metadataGrid: {
    flexDirection: "row",
    gap: 12,
    marginTop: 18,
  },
  metadataItem: {
    backgroundColor: "#f3f7f4",
    borderRadius: 12,
    flex: 1,
    padding: 12,
  },
  metadataLabel: {
    color: "#728278",
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  metadataValue: {
    color: "#173c31",
    fontSize: 14,
    fontWeight: "700",
    marginTop: 5,
  },
  lastCheck: {
    color: "#728278",
    fontSize: 12,
    marginTop: 12,
  },
  errorMessage: {
    color: "#8e3f34",
    fontSize: 14,
    lineHeight: 21,
    marginTop: 14,
  },
  endpoint: {
    backgroundColor: "#edf2ef",
    borderRadius: 10,
    color: "#40564b",
    fontFamily: Platform.select({ ios: "Menlo", android: "monospace" }),
    fontSize: 12,
    lineHeight: 17,
    marginTop: 16,
    padding: 12,
  },
  button: {
    alignItems: "center",
    backgroundColor: "#1f6848",
    borderRadius: 12,
    marginTop: 14,
    minHeight: 48,
    justifyContent: "center",
    paddingHorizontal: 18,
    paddingVertical: 12,
  },
  buttonDisabled: {
    opacity: 0.48,
  },
  buttonPressed: {
    backgroundColor: "#184f38",
    transform: [{ scale: 0.99 }],
  },
  buttonText: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "800",
  },
  footer: {
    color: "#718077",
    fontSize: 12,
    textAlign: "center",
    marginTop: 4,
  },
});
