import { Redirect, Stack, usePathname, type Href } from "expo-router";
import { useSession } from "../../features/auth/session/session-context";
import { authRedirect } from "../../features/auth/session/session-routing";

export default function AuthLayout() {
  const pathname = usePathname();
  const { state } = useSession();

  const destination = authRedirect(state, pathname);
  if (destination) return <Redirect href={destination as Href} />;

  return <Stack screenOptions={{ headerShown: false }} />;
}
