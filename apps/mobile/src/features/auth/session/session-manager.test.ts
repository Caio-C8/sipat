import { describe, expect, it, vi } from "vitest";
import type { AuthOperations } from "../api/auth-operations";
import type { RefreshTokenStorage } from "../storage/refresh-token-storage";
import { ApiError } from "../../../lib/api/api-error";
import { SessionManager } from "./session-manager";

const identity = {
  id: "550e8400-e29b-41d4-a716-446655440000",
  nome: "Pessoa Teste",
  email: "pessoa@example.invalid",
  perfil: "ADMINISTRADOR" as const,
  trocaSenhaObrigatoria: false,
};

function credentials(refreshToken = "R".repeat(43), future = true) {
  return {
    accessToken: "A".repeat(43),
    refreshToken,
    accessTokenExpiraEm: new Date(
      Date.now() + (future ? 60_000 : -60_000),
    ).toISOString(),
    sessaoExpiraEm: new Date(Date.now() + 3_600_000).toISOString(),
  };
}

function createStorage(initial: string | null = null) {
  let value = initial;
  const storage: RefreshTokenStorage = {
    read: vi.fn(async () => value),
    write: vi.fn(async (token) => {
      value = token;
    }),
    remove: vi.fn(async () => {
      value = null;
    }),
  };
  return storage;
}

function createOperations(overrides: Partial<AuthOperations> = {}) {
  return {
    login: vi.fn(async () => ({
      identidade: identity,
      credenciais: credentials(),
    })),
    refresh: vi.fn(async () => credentials("N".repeat(43))),
    me: vi.fn(async () => identity),
    completeFirstAccess: vi.fn(async () => ({
      identidade: identity,
      credenciais: credentials("C".repeat(43)),
    })),
    logout: vi.fn(async () => undefined),
    ...overrides,
  } as AuthOperations;
}

describe("SessionManager", () => {
  it("restaura, rotaciona o refresh persistido e só então publica a identidade", async () => {
    const storage = createStorage("R".repeat(43));
    const operations = createOperations();
    const manager = new SessionManager(operations, storage);

    await manager.restore();

    expect(operations.refresh).toHaveBeenCalledWith("R".repeat(43));
    expect(storage.write).toHaveBeenCalledWith("N".repeat(43));
    expect(operations.me).toHaveBeenCalledWith("A".repeat(43));
    expect(manager.getSnapshot()).toMatchObject({
      status: "authenticated",
      identity,
    });
  });

  it("preserva o refresh em falha temporária de rede durante a restauração", async () => {
    const storage = createStorage("R".repeat(43));
    const operations = createOperations({
      refresh: vi.fn(async () => {
        throw new ApiError("network");
      }),
    });
    const manager = new SessionManager(operations, storage);

    await manager.restore();

    expect(storage.remove).not.toHaveBeenCalled();
    expect(manager.getSnapshot()).toEqual({
      status: "temporarily-unavailable",
    });
  });

  it("remove a credencial quando o servidor confirma 401", async () => {
    const storage = createStorage("R".repeat(43));
    const operations = createOperations({
      refresh: vi.fn(async () => {
        throw new ApiError("http", 401);
      }),
    });
    const manager = new SessionManager(operations, storage);

    await manager.restore();

    expect(storage.remove).toHaveBeenCalledOnce();
    expect(manager.getSnapshot()).toEqual({ status: "anonymous" });
  });

  it("coordena refresh concorrente em uma única operação", async () => {
    const storage = createStorage();
    const operations = createOperations({
      login: vi.fn(async () => ({
        identidade: identity,
        credenciais: credentials("R".repeat(43), false),
      })),
    });
    const manager = new SessionManager(operations, storage);
    await manager.login({ email: identity.email, senha: "senha inicial" });

    await Promise.all([
      manager.authorizedRequest(async () => "ok", true),
      manager.authorizedRequest(async () => "ok", true),
    ]);

    expect(operations.refresh).toHaveBeenCalledOnce();
  });

  it("tenta revogar o par novo quando a gravação segura do login falha", async () => {
    const storage = createStorage();
    storage.write = vi.fn(async () => {
      throw new Error("keystore indisponível");
    });
    const operations = createOperations();
    const manager = new SessionManager(operations, storage);

    await expect(
      manager.login({ email: identity.email, senha: "senha" }),
    ).rejects.toThrow();

    expect(operations.logout).toHaveBeenCalledWith("R".repeat(43));
    expect(manager.getSnapshot()).toEqual({
      status: "storage-error",
      operation: "write",
    });
  });
});
