import { describe, expect, it } from "vitest";
import type { SessionState } from "./session-manager";
import { authRedirect, protectedRedirect } from "./session-routing";

const identity = {
  id: "id",
  nome: "Nome",
  email: "a@b.com",
  perfil: "ADMINISTRADOR" as const,
  trocaSenhaObrigatoria: false,
};
const anonymous: SessionState = { status: "anonymous" };
const common: SessionState = { status: "authenticated", identity };
const pending: SessionState = {
  status: "authenticated",
  identity: { ...identity, trocaSenhaObrigatoria: true },
};

describe("matriz de rotas autenticadas", () => {
  it("mantém somente login para anônimo", () => {
    expect(authRedirect(anonymous, "/login")).toBeNull();
    expect(authRedirect(anonymous, "/redefinir-senha")).toBe("/login");
    expect(protectedRedirect(anonymous)).toBe("/login");
  });

  it("mantém somente troca obrigatória para sessão pendente", () => {
    expect(authRedirect(pending, "/login")).toBe("/redefinir-senha");
    expect(authRedirect(pending, "/redefinir-senha")).toBeNull();
    expect(protectedRedirect(pending)).toBe("/redefinir-senha");
  });

  it("permite confirmação para sessão comum e protege as demais rotas auth", () => {
    expect(authRedirect(common, "/senha-atualizada")).toBeNull();
    expect(authRedirect(common, "/login")).toBe("/");
    expect(authRedirect(common, "/redefinir-senha")).toBe("/");
    expect(protectedRedirect(common)).toBeNull();
  });
});
