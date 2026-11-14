import { afterEach, describe, expect, it, vi } from "vitest";
import { apiRequest } from "./api-client";

afterEach(() => vi.unstubAllGlobals());

describe("apiRequest query", () => {
  it("serializa valores definidos e preserva a ordem declarada", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(
        new Response("{}", {
          status: 200,
          headers: { "content-type": "application/json" },
        }),
      );
    vi.stubGlobal("fetch", fetchMock);

    await apiRequest({
      baseUrl: "https://api.example.test/api",
      path: "/itens",
      method: "GET",
      query: { tipo: "ficha-bem", busca: "Bem 1", pagina: 2, vazio: undefined },
    });

    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.example.test/api/itens?tipo=ficha-bem&busca=Bem+1&pagina=2",
      expect.objectContaining({ method: "GET" }),
    );
  });
});
