import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { StyleSheet, View } from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { AppTopbar } from "../components/shared/app-topbar";
import {
  DevelopmentCheckBanner,
  shouldShowDevelopmentCheckBanner,
} from "../components/shared/development-check-banner";
import { publicAppConfig } from "../config/public-app-config";
import { SessionGate } from "../features/auth/session/session-gate";
import { SessionProvider } from "../features/auth/session/session-context";
import { colors, mobileShell } from "../theme/tokens";

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <View style={styles.root}>
        <StatusBar style="light" />
        <SessionProvider>
          <SafeAreaView
            edges={["top", "right", "left"]}
            style={styles.headerSafeArea}
          >
            {shouldShowDevelopmentCheckBanner(publicAppConfig.environment) ? (
              <DevelopmentCheckBanner />
            ) : null}
            <AppTopbar />
          </SafeAreaView>
          <SafeAreaView
            edges={["right", "bottom", "left"]}
            style={styles.contentSafeArea}
          >
            <View style={styles.content}>
              <SessionGate>
                <Stack screenOptions={{ headerShown: false }} />
              </SessionGate>
            </View>
          </SafeAreaView>
        </SessionProvider>
      </View>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  root: {
    backgroundColor: colors.surface,
    flex: 1,
  },
  headerSafeArea: {
    backgroundColor: mobileShell.header,
    zIndex: 10,
  },
  contentSafeArea: {
    backgroundColor: mobileShell.navigationSurface,
    flex: 1,
  },
  content: {
    backgroundColor: colors.surface,
    flex: 1,
  },
});
