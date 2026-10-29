import type { SessionState } from "./session-manager";

export function authRedirect(
  state: SessionState,
  pathname: string,
): "/" | "/login" | "/redefinir-senha" | null {
  if (state.status === "anonymous")
    return pathname === "/login" || pathname === "/esqueci-senha"
      ? null
      : "/login";
  if (state.status !== "authenticated") return null;
  if (state.identity.trocaSenhaObrigatoria) {
    return pathname === "/redefinir-senha" ? null : "/redefinir-senha";
  }
  if (pathname === "/senha-atualizada") return null;
  if (pathname === "/redefinir-senha" && state.firstAccessJustCompleted)
    return null;
  return "/";
}

export function protectedRedirect(
  state: SessionState,
): "/login" | "/redefinir-senha" | null {
  if (state.status === "anonymous") return "/login";
  if (
    state.status === "authenticated" &&
    state.identity.trocaSenhaObrigatoria
  ) {
    return "/redefinir-senha";
  }
  return null;
}
