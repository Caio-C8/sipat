import { describe, expect, it, vi } from "vitest";
import { createApiClient } from "../create-api-client";
describe("download PDF no cliente central", () => {
  it("usa sessão do fetch, no-store, AbortSignal e resposta binária", async () => {
    const fetcher = vi.fn<typeof fetch>(
      async () =>
        new Response("%PDF-1.7\nPDF sintético de transporte", {
          headers: { "Content-Type": "application/pdf" },
        }),
    );
    const client = createApiClient({
      baseUrl: "/api/backend",
      fetchImplementation: fetcher,
    });
    const r = await client.request<Blob>({
      path: "/relatorios/baixas/pdf",
      responseType: "pdf",
      cache: "no-store",
    });
    expect(await r.text()).toContain("%PDF-");
    expect(fetcher.mock.calls[0]?.[1]).toMatchObject({
      cache: "no-store",
      method: "GET",
    });
  });
  it("rejeita MIME, assinatura e volume sem mascarar o erro como falha de rede", async () => {
    for (const response of [
      new Response("%PDF-x", { headers: { "Content-Type": "text/html" } }),
      new Response("HTML", { headers: { "Content-Type": "application/pdf" } }),
      new Response("%PDF-x", {
        headers: {
          "Content-Type": "application/pdf",
          "Content-Length": "10485761",
        },
      }),
    ]) {
      const client = createApiClient({
        baseUrl: "/api/backend",
        fetchImplementation: async () => response,
      });
      await expect(
        client.request({ path: "/pdf", responseType: "pdf" }),
      ).rejects.toMatchObject({
        codigo: "PDF_RESPOSTA_INVALIDA",
        categoria: "resposta_invalida",
      });
    }
  });
  it("preserva o erro JSON autenticado na emissão", async () => {
    const client = createApiClient({
      baseUrl: "/api/backend",
      fetchImplementation: async () =>
        new Response(
          JSON.stringify({
            status: 422,
            sucesso: false,
            codigo: "RELATORIO_LIMITE_EXCEDIDO",
            mensagem: "Reduza os filtros.",
            erros: [],
            requisicaoId: "teste",
          }),
          { status: 422, headers: { "Content-Type": "application/json" } },
        ),
    });
    await expect(
      client.request({ path: "/pdf", responseType: "pdf" }),
    ).rejects.toMatchObject({
      status: 422,
      codigo: "RELATORIO_LIMITE_EXCEDIDO",
    });
  });
});
