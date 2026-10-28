import { describe, expect, it, vi } from "vitest";
import { createRefreshTokenStorage } from "./refresh-token-storage";

describe("RefreshTokenStorage", () => {
  it("encapsula leitura, gravação e exclusão sem expor a chave nativa", async () => {
    const driver = {
      get: vi.fn(async () => "token"),
      set: vi.fn(async () => undefined),
      delete: vi.fn(async () => undefined),
    };
    const storage = createRefreshTokenStorage(driver);

    await expect(storage.read()).resolves.toBe("token");
    await storage.write("novo");
    await storage.remove();

    expect(driver.set).toHaveBeenCalledWith("novo");
    expect(driver.delete).toHaveBeenCalledOnce();
  });

  it("normaliza falhas por operação sem incluir o token na mensagem", async () => {
    const storage = createRefreshTokenStorage({
      get: async () => null,
      set: async () => {
        throw new Error("falha");
      },
      delete: async () => undefined,
    });

    await expect(storage.write("segredo-sensivel")).rejects.toMatchObject({
      name: "RefreshTokenStorageError",
      operation: "write",
    });
    await expect(storage.write("segredo-sensivel")).rejects.not.toThrow(
      /segredo-sensivel/,
    );
  });
});
