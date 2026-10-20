import { describe, expect, it } from "vitest";
import nextConfig from "../../../next.config";

describe("rewrites da API", () => {
  it("encaminha a rota privada de anexo de nota fiscal para a API", async () => {
    const rewrites = await nextConfig.rewrites?.();
    expect(Array.isArray(rewrites)).toBe(true);
    if (!Array.isArray(rewrites)) return;

    const rewrite = rewrites.find(
      (item) => item.source === "/api/backend/:path*",
    );
    expect(rewrite).toBeDefined();

    const origem = "/api/backend/notas-fiscais/nota-id/anexo";
    const path = origem.replace("/api/backend/", "");
    const destino = rewrite!.destination.replace(":path*", path);
    const apiUrl = process.env.API_INTERNAL_URL ?? "http://localhost:3001";

    expect(destino).toBe(`${apiUrl}/api/notas-fiscais/nota-id/anexo`);
  });
});
