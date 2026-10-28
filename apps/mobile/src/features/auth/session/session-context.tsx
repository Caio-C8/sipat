import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useSyncExternalStore,
  type PropsWithChildren,
} from "react";
import { AppState } from "react-native";
import { ApiError } from "../../../lib/api/api-error";
import { publicAppConfig } from "../../../config/public-app-config";
import { createAuthOperations } from "../api/auth-operations";
import { refreshTokenStorage } from "../storage/secure-refresh-token-storage";
import { SessionManager } from "./session-manager";

const SessionContext = createContext<SessionManager | null>(null);

function createUnavailableOperations() {
  const fail = async () => {
    throw new ApiError("network");
  };
  return {
    login: fail,
    refresh: fail,
    me: fail,
    completeFirstAccess: fail,
    logout: fail,
  } as unknown as ReturnType<typeof createAuthOperations>;
}

export function SessionProvider({ children }: Readonly<PropsWithChildren>) {
  const manager = useMemo(
    () =>
      new SessionManager(
        publicAppConfig.apiBaseUrl
          ? createAuthOperations(publicAppConfig.apiBaseUrl)
          : createUnavailableOperations(),
        refreshTokenStorage,
      ),
    [],
  );

  useEffect(() => {
    void manager.restore();
    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active") void manager.revalidate();
    });
    return () => subscription.remove();
  }, [manager]);

  return (
    <SessionContext.Provider value={manager}>
      {children}
    </SessionContext.Provider>
  );
}

export function useSession() {
  const manager = useContext(SessionContext);
  if (!manager) throw new Error("useSession exige SessionProvider.");
  const state = useSyncExternalStore(
    manager.subscribe,
    manager.getSnapshot,
    manager.getSnapshot,
  );
  return { manager, state };
}
