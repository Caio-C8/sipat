import { afterEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "./api-error";
import {
  apiBinaryRequest,
  ApiRequestCancelledError,
} from "./binary-api-client";

const validPdf = new TextEncoder().encode("%PDF-1.7\nconteúdo\n%%EOF\n");

function request(overrides: Record<string, unknown> = {}) {
  return apiBinaryRequest({
    baseUrl: "https://api.example.test/api",
    path: "/relatorios/baixas/pdf",
    token: "access-token",
    ...overrides,
  });
}

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe("apiBinaryRequest", () => {
  it("envia Bearer e aceita somente um PDF íntegro dentro do limite", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(validPdf, {
        status: 200,
        headers: { "content-type": "application/pdf; charset=binary" },
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    await expect(request({ query: { tipo: "FURTO" } })).resolves.toEqual(
      validPdf,
    );
    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.example.test/api/relatorios/baixas/pdf?tipo=FURTO",
      expect.objectContaining({
        method: "GET",
        headers: {
          Accept: "application/pdf",
          Authorization: "Bearer access-token",
        },
      }),
    );
  });

  it.each([
    ["MIME incorreto", "text/plain", validPdf],
    [
      "assinatura inválida",
      "application/pdf",
      new TextEncoder().encode("não é PDF%%EOF"),
    ],
    [
      "trailer ausente",
      "application/pdf",
      new TextEncoder().encode("%PDF-1.7 sem trailer"),
    ],
  ])("rejeita %s sem preservar conteúdo", async (_case, contentType, body) => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(body, {
          status: 200,
          headers: { "content-type": contentType },
        }),
      ),
    );
    await expect(request()).rejects.toMatchObject({
      kind: "invalid-response",
    });
  });

  it("rejeita tamanho declarado ou efetivo acima do limite", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(validPdf, {
          status: 200,
          headers: {
            "content-type": "application/pdf",
            "content-length": "21",
          },
        }),
      ),
    );
    await expect(request({ maxBytes: 20 })).rejects.toBeInstanceOf(ApiError);

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(validPdf, {
          status: 200,
          headers: { "content-type": "application/pdf" },
        }),
      ),
    );
    await expect(request({ maxBytes: 20 })).rejects.toMatchObject({
      kind: "invalid-response",
    });
  });

  it("preserva erro público e Retry-After", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            status: 429,
            sucesso: false,
            codigo: "RELATORIO_LIMITE_EXCEDIDO",
            mensagem: "Limite atingido.",
            erros: [],
            requisicaoId: "00000000-0000-4000-8000-000000000001",
          }),
          {
            status: 429,
            headers: {
              "content-type": "application/json",
              "retry-after": "12",
            },
          },
        ),
      ),
    );
    await expect(request()).rejects.toMatchObject({
      kind: "http",
      status: 429,
      code: "RELATORIO_LIMITE_EXCEDIDO",
      retryAfterSeconds: 12,
    });
  });

  it("distingue cancelamento do chamador de timeout", async () => {
    const pendingFetch = vi.fn(
      async (_url: string, options: RequestInit) =>
        new Promise<Response>((_resolve, reject) =>
          options.signal?.addEventListener("abort", () =>
            reject(new DOMException("Aborted", "AbortError")),
          ),
        ),
    );
    vi.stubGlobal("fetch", pendingFetch);
    const controller = new AbortController();
    const cancelled = request({ signal: controller.signal });
    controller.abort();
    await expect(cancelled).rejects.toBeInstanceOf(ApiRequestCancelledError);

    vi.useFakeTimers();
    const timedOut = request({ timeoutMs: 10 });
    const timedOutExpectation = expect(timedOut).rejects.toMatchObject({
      kind: "timeout",
    });
    await vi.advanceTimersByTimeAsync(10);
    await timedOutExpectation;
  });
});
