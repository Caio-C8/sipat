import { afterEach, describe, expect, it, vi } from "vitest";
import { getApiHealth } from "./api-health";

const validHealth = {
  status: "ok",
  service: "api",
  environment: "test",
  version: "0.1.0",
  timestamp: "2026-10-16T12:00:00.000Z",
} as const;

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("getApiHealth", () => {
  it("consulta e valida o health check da API", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify(validHealth), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );
    vi.stubGlobal("fetch", fetchMock);
    const signal = new AbortController().signal;

    await expect(
      getApiHealth("https://api.example.test/api/health", signal),
    ).resolves.toEqual(validHealth);
    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.example.test/api/health",
      {
        headers: { Accept: "application/json" },
        signal,
      },
    );
  });

  it("rejeita respostas HTTP sem sucesso", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response(null, { status: 503 })),
    );

    await expect(
      getApiHealth(
        "https://api.example.test/api/health",
        new AbortController().signal,
      ),
    ).rejects.toThrow("A API respondeu com HTTP 503.");
  });

  it("rejeita payloads que não atendem ao contrato", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({ ...validHealth, timestamp: "inválido" }),
          {
            status: 200,
            headers: { "Content-Type": "application/json" },
          },
        ),
      ),
    );

    await expect(
      getApiHealth(
        "https://api.example.test/api/health",
        new AbortController().signal,
      ),
    ).rejects.toThrow("A API retornou um health check inválido.");
  });
});
