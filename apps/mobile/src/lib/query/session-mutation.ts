import type { SessionManager } from "../../features/auth/session/session-manager";

export function currentSessionIdentity(manager: SessionManager) {
  const state = manager.getSnapshot();
  return state.status === "authenticated" ? state.identity.id : null;
}

export function isCurrentSession(
  manager: SessionManager,
  identityId: string | null,
) {
  return identityId !== null && currentSessionIdentity(manager) === identityId;
}
