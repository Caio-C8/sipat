import { afterEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "../api-error";
import { createApiClient } from "../create-api-client";
import type { RuntimeSchema } from "../types";

type RespostaTeste = {
  status: number;
  sucesso: true;
  dados: {
    id: string;
  };
};

const responseSchema: RuntimeSchema<RespostaTeste> = {
  safeParse(value) {
    if (
      typeof value === "object" &&
      value !== null &&
      "status" in value &&
      value.status === 200 &&
      "sucesso" in value &&
      value.sucesso === true &&
      "dados" in value &&
      typeof value.dados === "object" &&
      value.dados !== null &&
      "id" in value.dados &&
      typeof value.dados.id === "string"
    ) {
      return {
        success: true,
        data: value as RespostaTeste,
      };
    }

    return {
      success: false,
      error: new Error("Resposta incompatível com o schema."),
    };
  },
};

function criarRespostaJson(
  body: unknown,
  status = 200,
  headers?: HeadersInit,
): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
  });
}

function criarFetchPendente(): typeof fetch {
  return vi.fn<typeof fetch>(
    (_input, init) =>
      new Promise<Response>((_resolve, reject) => {
        const signal = init?.signal;

        if (!signal) {
          reject(new Error("O teste esperava um AbortSignal."));
          return;
        }

        if (signal.aborted) {
          reject(signal.reason);
          return;
        }

        signal.addEventListener(
          "abort",
          () => {
            reject(signal.reason);
          },
          { once: true },
        );
      }),
  );
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("createApiClient", () => {
  it("monta a URL, ordena a query e valida a resposta", async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(
      criarRespostaJson({
        status: 200,
        sucesso: true,
        dados: {
          id: "recurso-1",
        },
      }),
    );

    const client = createApiClient({
      baseUrl: "https://api.example.test/api/",
      fetchImplementation: fetchMock,
    });

    const resultado = await client.request({
      path: "/recursos",
      query: {
        pesquisa: "café premium",
        pagina: 2,
        limite: 20,
        emDestaque: false,
        status: undefined,
      },
      responseSchema,
    });

    expect(resultado.dados.id).toBe("recurso-1");

    expect(fetchMock).toHaveBeenCalledOnce();

    const [url, init] = fetchMock.mock.calls[0]!;

    expect(url).toBe(
      "https://api.example.test/api/recursos" +
        "?emDestaque=false&limite=20&pagina=2&pesquisa=caf%C3%A9+premium",
    );

    expect(init?.method).toBe("GET");
    expect(new Headers(init?.headers).get("Accept")).toBe("application/json");
  });

  it("normaliza um erro HTTP que segue o contrato público", async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(
      criarRespostaJson(
        {
          status: 409,
          sucesso: false,
          codigo: "IDENTIFICADOR_JA_CADASTRADO",
          mensagem: "O identificador informado já está em uso.",
          erros: [],
          requisicaoId: "req-123",
        },
        409,
        {
          "X-Request-Id": "req-123",
        },
      ),
    );

    const client = createApiClient({
      baseUrl: "/api/backend",
      fetchImplementation: fetchMock,
    });

    await expect(
      client.request({
        path: "/recursos",
        responseSchema,
      }),
    ).rejects.toMatchObject({
      name: "ApiError",
      status: 409,
      codigo: "IDENTIFICADOR_JA_CADASTRADO",
      categoria: "http",
      requisicaoId: "req-123",
    });
  });

  it("rejeita uma resposta incompatível com o schema", async () => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValue(criarRespostaJson({ recurso: null }));

    const client = createApiClient({
      baseUrl: "/api/backend",
      fetchImplementation: fetchMock,
    });

    await expect(
      client.request({
        path: "/recursos",
        responseSchema,
      }),
    ).rejects.toMatchObject({
      codigo: "CONTRATO_RESPOSTA_INVALIDO",
      categoria: "resposta_invalida",
      status: 200,
    });
  });

  it("retorna undefined para uma resposta 204", async () => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValue(new Response(null, { status: 204 }));

    const client = createApiClient({
      baseUrl: "/api/backend",
      fetchImplementation: fetchMock,
    });

    await expect(
      client.request({
        path: "/recursos/recurso-1",
        method: "DELETE",
      }),
    ).resolves.toBeUndefined();
  });

  it("diferencia timeout de cancelamento manual", async () => {
    const timeoutController = new AbortController();

    const timeoutSpy = vi
      .spyOn(AbortSignal, "timeout")
      .mockReturnValue(timeoutController.signal);

    const client = createApiClient({
      baseUrl: "/api/backend",
      fetchImplementation: criarFetchPendente(),
    });

    const promise = client.request({
      path: "/recursos",
      timeoutMs: 120_000,
      responseSchema,
    });

    const verificacao = expect(promise).rejects.toMatchObject({
      codigo: "TEMPO_LIMITE_EXCEDIDO",
      categoria: "timeout",
    });

    expect(timeoutSpy).toHaveBeenCalledWith(120_000);

    timeoutController.abort(
      new DOMException("O tempo limite foi excedido.", "TimeoutError"),
    );

    await verificacao;
  });

  it("normaliza um AbortSignal externo como cancelamento", async () => {
    const controller = new AbortController();

    const client = createApiClient({
      baseUrl: "/api/backend",
      fetchImplementation: criarFetchPendente(),
    });

    const promise = client.request({
      path: "/recursos",
      signal: controller.signal,
      responseSchema,
    });

    const verificacao = expect(promise).rejects.toMatchObject({
      codigo: "REQUISICAO_CANCELADA",
      categoria: "cancelada",
    });

    controller.abort();

    await verificacao;
  });

  it("não permite body em uma requisição GET", async () => {
    const fetchMock = vi.fn<typeof fetch>();

    const client = createApiClient({
      baseUrl: "/api/backend",
      fetchImplementation: fetchMock,
    });

    await expect(
      client.request({
        path: "/recursos",
        body: {
          nome: "Recurso",
        },
        responseSchema,
      }),
    ).rejects.toEqual(
      expect.objectContaining<Partial<ApiError>>({
        codigo: "BODY_GET_NAO_PERMITIDO",
        categoria: "configuracao",
      }),
    );

    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("rejeita um body sem representação JSON", async () => {
    const fetchMock = vi.fn<typeof fetch>();

    const client = createApiClient({
      baseUrl: "/api/backend",
      fetchImplementation: fetchMock,
    });

    await expect(
      client.request({
        path: "/recursos",
        method: "POST",
        body: Symbol("recurso"),
        responseSchema,
      }),
    ).rejects.toMatchObject({
      codigo: "BODY_NAO_SERIALIZAVEL",
      categoria: "configuracao",
    });

    expect(fetchMock).not.toHaveBeenCalled();
  });
});
