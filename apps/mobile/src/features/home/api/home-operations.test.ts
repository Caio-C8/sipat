import { afterEach, describe, expect, it, vi } from "vitest";
import { createHomeOperations } from "./home-operations";

function jsonResponse(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { "content-type": "application/json" },
  });
}

function paginated(total: number, limit = 1) {
  return {
    status: 200,
    sucesso: true,
    mensagem: "Dados listados com sucesso.",
    dados: [],
    meta: {
      total,
      pagina: 1,
      ultimaPagina: Math.max(1, Math.ceil(total / limit)),
      limite: limit,
    },
  };
}

function finalizedInventory(id: string, dataFim: string) {
  return {
    id,
    nome: `Inventário ${dataFim}`,
    status: "FINALIZADO",
    dataInicio: "2026-01-01",
    dataFim,
    iniciadoPorId: "11111111-1111-4111-8111-111111111111",
    finalizadoPorId: "22222222-2222-4222-8222-222222222222",
    comissao: {
      id: "33333333-3333-4333-8333-333333333333",
      nome: "Comissão anual",
    },
    progresso: {
      totalSetores: 1,
      setoresPendentes: 0,
      setoresEmAndamento: 0,
      setoresConcluidos: 1,
      totalItens: 1,
      itensPendentes: 0,
      itensVerificados: 1,
      corretos: 1,
      divergencias: 0,
      naoLocalizados: 0,
      correcoesPendentes: 0,
      correcoesCorrigidas: 0,
    },
    createdAt: "2026-01-01T12:00:00.000Z",
    updatedAt: `${dataFim}T12:00:00.000Z`,
  };
}

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe("createHomeOperations", () => {
  it("consulta totais com paginação mínima, token e schemas públicos", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse(paginated(4)))
      .mockResolvedValueOnce(jsonResponse(paginated(128)));
    vi.stubGlobal("fetch", fetchMock);
    const operations = createHomeOperations("https://api.example.test");

    await expect(
      operations.contarSetores({ accessToken: "token-setores" }),
    ).resolves.toBe(4);
    await expect(
      operations.contarPatrimonios({ accessToken: "token-bens" }),
    ).resolves.toBe(128);

    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      "https://api.example.test/api/setores?pagina=1&limite=1",
      expect.objectContaining({
        method: "GET",
        headers: expect.objectContaining({
          Authorization: "Bearer token-setores",
        }),
      }),
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      "https://api.example.test/api/patrimonios?pagina=1&limite=1",
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: "Bearer token-bens",
        }),
      }),
    );
  });

  it("usa filtros existentes e meta.total para os estados de inventário", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse(paginated(7)))
      .mockResolvedValueOnce(jsonResponse(paginated(2)))
      .mockResolvedValueOnce(jsonResponse(paginated(1)))
      .mockResolvedValueOnce(jsonResponse(paginated(4, 50)));
    vi.stubGlobal("fetch", fetchMock);
    const operations = createHomeOperations("https://api.example.test");

    await expect(
      operations.obterInventarios({ accessToken: "token" }),
    ).resolves.toEqual({
      total: 7,
      pendentes: 2,
      emAndamento: 1,
      finalizados: 4,
      maisRecente: null,
      emAndamentoMaisRecente: null,
      finalizadoMaisRecente: null,
    });

    const urls = fetchMock.mock.calls.map(([url]) => String(url));
    expect(urls).toEqual([
      "https://api.example.test/api/inventarios?pagina=1&limite=1",
      "https://api.example.test/api/inventarios?pagina=1&limite=1&status=PENDENTE",
      "https://api.example.test/api/inventarios?pagina=1&limite=1&status=EM_ANDAMENTO",
      "https://api.example.test/api/inventarios?pagina=1&limite=50&status=FINALIZADO",
    ]);
  });

  it("pagina finalizados e escolhe a maior data de conclusão", async () => {
    const first = {
      ...paginated(51, 50),
      dados: [
        finalizedInventory(
          "44444444-4444-4444-8444-444444444444",
          "2026-09-27",
        ),
      ],
    };
    const second = {
      ...paginated(51, 50),
      dados: [
        finalizedInventory(
          "55555555-5555-4555-8555-555555555555",
          "2026-10-02",
        ),
      ],
      meta: { ...paginated(51, 50).meta, pagina: 2 },
    };
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse(paginated(51)))
      .mockResolvedValueOnce(jsonResponse(paginated(0)))
      .mockResolvedValueOnce(jsonResponse(paginated(0)))
      .mockResolvedValueOnce(jsonResponse(first))
      .mockResolvedValueOnce(jsonResponse(second));
    vi.stubGlobal("fetch", fetchMock);
    const operations = createHomeOperations("https://api.example.test");

    const result = await operations.obterInventarios({ accessToken: "token" });

    expect(result.finalizadoMaisRecente?.dataFim).toBe("2026-10-02");
    expect(fetchMock.mock.calls[4]?.[0]).toBe(
      "https://api.example.test/api/inventarios?pagina=2&limite=50&status=FINALIZADO",
    );
  });

  it("rejeita response fora do contrato", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(jsonResponse({ total: 12 })),
    );
    const operations = createHomeOperations("https://api.example.test");

    await expect(
      operations.contarPatrimonios({ accessToken: "token" }),
    ).rejects.toMatchObject({ kind: "invalid-response" });
  });

  it("preserva 403 como erro de autorização", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        jsonResponse(
          {
            status: 403,
            sucesso: false,
            codigo: "ACESSO_NEGADO",
            mensagem: "Acesso negado.",
            erros: [],
            requisicaoId: "req-1",
          },
          403,
        ),
      ),
    );
    const operations = createHomeOperations("https://api.example.test");

    await expect(
      operations.contarSetores({ accessToken: "token" }),
    ).rejects.toMatchObject({ kind: "http", status: 403 });
  });

  it("aplica timeout de oito segundos", async () => {
    vi.useFakeTimers();
    vi.stubGlobal(
      "fetch",
      vi.fn(
        (_url: string, init: RequestInit) =>
          new Promise<Response>((_resolve, reject) => {
            init.signal?.addEventListener("abort", () =>
              reject(new DOMException("Abortado", "AbortError")),
            );
          }),
      ),
    );
    const operations = createHomeOperations("https://api.example.test");
    const request = operations.contarPatrimonios({ accessToken: "token" });
    const expectation = expect(request).rejects.toMatchObject({
      kind: "timeout",
    });

    await vi.advanceTimersByTimeAsync(8_000);

    await expectation;
  });

  it("encaminha cancelamento do chamador para o fetch", async () => {
    const controller = new AbortController();
    vi.stubGlobal(
      "fetch",
      vi.fn(
        (_url: string, init: RequestInit) =>
          new Promise<Response>((_resolve, reject) => {
            init.signal?.addEventListener("abort", () =>
              reject(new DOMException("Abortado", "AbortError")),
            );
          }),
      ),
    );
    const operations = createHomeOperations("https://api.example.test");
    const request = operations.contarPatrimonios({
      accessToken: "token",
      signal: controller.signal,
    });
    const expectation = expect(request).rejects.toMatchObject({
      kind: "network",
    });

    controller.abort();

    await expectation;
  });
});
