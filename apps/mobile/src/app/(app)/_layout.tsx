import { Redirect, Stack, type Href } from "expo-router";
import { StyleSheet, View } from "react-native";
import { AppBottomBar } from "../../components/shared/app-bottom-bar";
import { useSession } from "../../features/auth/session/session-context";
import { protectedRedirect } from "../../features/auth/session/session-routing";
import { mobileShell } from "../../theme/tokens";

export default function AppLayout() {
  const { state } = useSession();

  const destination = protectedRedirect(state);
  if (destination) return <Redirect href={destination as Href} />;

  return (
    <View style={styles.shell}>
      <View style={styles.content}>
        <Stack screenOptions={{ headerShown: false }} />
      </View>
      <AppBottomBar />
    </View>
  );
}

const styles = StyleSheet.create({
  shell: {
    backgroundColor: mobileShell.navigationSurface,
    flex: 1,
  },
  content: {
    backgroundColor: mobileShell.canvas,
    flex: 1,
  },
});
