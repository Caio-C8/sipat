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
import { colors } from "../theme/tokens";

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <SafeAreaView
        edges={["top", "right", "bottom", "left"]}
        style={styles.safeArea}
      >
        <StatusBar style="dark" />
        {shouldShowDevelopmentCheckBanner(publicAppConfig.environment) ? (
          <DevelopmentCheckBanner />
        ) : null}
        <AppTopbar />
        <View style={styles.content}>
          <Stack screenOptions={{ headerShown: false }} />
        </View>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: colors.surface,
    flex: 1,
  },
  content: {
    backgroundColor: colors.surfaceSubtle,
    flex: 1,
  },
});
