import { afterEach, describe, expect, it, vi } from "vitest";
import { createAuthOperations } from "./auth-operations";

const token = "A".repeat(43);
const identity = {
  id: "550e8400-e29b-41d4-a716-446655440000",
  nome: "Pessoa Teste",
  email: "pessoa@example.invalid",
  perfil: "ADMINISTRADOR",
  trocaSenhaObrigatoria: false,
};
const credentials = {
  accessToken: token,
  refreshToken: "R".repeat(43),
  accessTokenExpiraEm: "2026-10-27T12:10:00.000Z",
  sessaoExpiraEm: "2026-10-27T20:00:00.000Z",
};

afterEach(() => vi.unstubAllGlobals());

describe("operações de autenticação mobile", () => {
  it("valida a response de login e não envia Bearer", async () => {
    const fetchMock = vi.fn(
      async () =>
        new Response(
          JSON.stringify({
            status: 200,
            sucesso: true,
            mensagem: "Autenticado.",
            dados: { identidade: identity, credenciais: credentials },
          }),
          { status: 200, headers: { "content-type": "application/json" } },
        ),
    );
    vi.stubGlobal("fetch", fetchMock);

    await expect(
      createAuthOperations("https://api.example.test").login({
        email: identity.email,
        senha: "senha",
      }),
    ).resolves.toEqual({ identidade: identity, credenciais: credentials });

    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.example.test/api/auth/mobile/login",
      expect.objectContaining({
        method: "POST",
        headers: expect.not.objectContaining({
          Authorization: expect.anything(),
        }),
      }),
    );
  });

  it("recusa response fora do schema antes de alterar a sessão", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(
        async () =>
          new Response(
            JSON.stringify({
              status: 200,
              sucesso: true,
              mensagem: "Autenticado.",
              dados: {
                identidade: identity,
                credenciais: { ...credentials, refreshToken: "curto" },
              },
            }),
            { status: 200, headers: { "content-type": "application/json" } },
          ),
      ),
    );

    await expect(
      createAuthOperations("https://api.example.test").login({
        email: identity.email,
        senha: "senha",
      }),
    ).rejects.toMatchObject({ kind: "invalid-response" });
  });

  it("usa refresh apenas no Authorization do endpoint de logout", async () => {
    const fetchMock = vi.fn(async () => new Response(null, { status: 204 }));
    vi.stubGlobal("fetch", fetchMock);

    await createAuthOperations("https://api.example.test").logout(
      credentials.refreshToken,
    );

    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.example.test/api/auth/mobile/logout",
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: `Bearer ${credentials.refreshToken}`,
        }),
      }),
    );
  });
});
