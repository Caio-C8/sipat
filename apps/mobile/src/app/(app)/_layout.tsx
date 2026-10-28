import { Redirect, Stack, type Href } from "expo-router";
import { useSession } from "../../features/auth/session/session-context";
import { protectedRedirect } from "../../features/auth/session/session-routing";

export default function AppLayout() {
  const { state } = useSession();

  const destination = protectedRedirect(state);
  if (destination) return <Redirect href={destination as Href} />;

  return <Stack screenOptions={{ headerShown: false }} />;
}
