import { describe, expect, it, vi } from "vitest";
import { ApiError } from "@/lib/api/core/api-error";
import type { ApiClient } from "@/lib/api/core/types";
import {
  instrumentarApiClient,
  type MetricaOperacaoApi,
} from "../api-operations";

function criarApiClient(implementation: () => Promise<unknown>): ApiClient {
  return {
    request: vi.fn(implementation) as unknown as ApiClient["request"],
  };
}

function criarRelogio(...valores: number[]): () => number {
  const leituras = [...valores];

  return () => {
    const valor = leituras.shift();

    if (valor === undefined) {
      throw new Error("Não há outra leitura de tempo configurada.");
    }

    return valor;
  };
}

function criarPromisePendente(): {
  promise: Promise<void>;
  resolver: () => void;
} {
  let resolver!: () => void;

  const promise = new Promise<void>((resolve) => {
    resolver = resolve;
  });

  return {
    promise,
    resolver,
  };
}

describe("instrumentarApiClient", () => {
  it("registra uma operação normalizada sem expor o path", async () => {
    const metricas: MetricaOperacaoApi[] = [];

    const apiClient = instrumentarApiClient(
      criarApiClient(async () => ({
        status: 200,
      })),
      {
        origem: "navegador",
        observar: (metrica) => metricas.push(metrica),
        agora: criarRelogio(100, 112.346),
      },
    );

    await apiClient.request({
      path: "/recursos/recurso-123",
      method: "PATCH",
    });

    expect(metricas).toEqual([
      {
        nome: "api.desconhecida",
        origem: "navegador",
        metodo: "PATCH",
        resultado: "sucesso",
        duracaoMs: 12.35,
        requisicoesSimultaneas: 1,
        status: null,
      },
    ]);

    expect(metricas[0]).not.toHaveProperty("path");
    expect(JSON.stringify(metricas[0])).not.toContain("recurso-123");
  });

  it("registra status e categoria de uma falha conhecida", async () => {
    const metricas: MetricaOperacaoApi[] = [];

    const error = new ApiError({
      status: 503,
      codigo: "SERVICO_INDISPONIVEL",
      mensagem: "Serviço temporariamente indisponível.",
      categoria: "http",
      requisicaoId: "req-123",
    });

    const apiClient = instrumentarApiClient(
      criarApiClient(async () => {
        throw error;
      }),
      {
        origem: "navegador",
        observar: (metrica) => metricas.push(metrica),
        agora: criarRelogio(20, 28),
      },
    );

    await expect(
      apiClient.request({
        path: "/health",
        method: "GET",
      }),
    ).rejects.toBe(error);

    expect(metricas).toEqual([
      {
        nome: "sistema.health",
        origem: "navegador",
        metodo: "GET",
        resultado: "erro",
        duracaoMs: 8,
        requisicoesSimultaneas: 1,
        status: 503,
        categoriaErro: "http",
      },
    ]);

    expect(JSON.stringify(metricas[0])).not.toContain("req-123");
  });

  it("distingue cancelamento das demais falhas", async () => {
    const metricas: MetricaOperacaoApi[] = [];

    const error = new ApiError({
      status: null,
      codigo: "REQUISICAO_CANCELADA",
      mensagem: "A requisição foi cancelada.",
      categoria: "cancelada",
    });

    const apiClient = instrumentarApiClient(
      criarApiClient(async () => {
        throw error;
      }),
      {
        origem: "navegador",
        observar: (metrica) => metricas.push(metrica),
        agora: criarRelogio(30, 31),
      },
    );

    await expect(
      apiClient.request({
        path: "/recursos/recurso-123",
        method: "GET",
      }),
    ).rejects.toBe(error);

    expect(metricas[0]).toMatchObject({
      nome: "api.desconhecida",
      resultado: "cancelada",
      categoriaErro: "cancelada",
    });
  });

  it("observa a concorrência sem alterar o resultado das requisições", async () => {
    const primeira = criarPromisePendente();
    const segunda = criarPromisePendente();
    const metricas: MetricaOperacaoApi[] = [];

    let chamada = 0;

    const apiClient = instrumentarApiClient(
      criarApiClient(() => {
        chamada += 1;

        return chamada === 1 ? primeira.promise : segunda.promise;
      }),
      {
        origem: "navegador",
        observar: (metrica) => metricas.push(metrica),
        agora: criarRelogio(0, 1, 11, 12),
      },
    );

    const primeiraRequest = apiClient.request({
      path: "/health",
      method: "GET",
    });

    const segundaRequest = apiClient.request({
      path: "/recursos/recurso-123",
      method: "GET",
    });

    primeira.resolver();
    await primeiraRequest;

    segunda.resolver();
    await segundaRequest;

    expect(metricas.map((metrica) => metrica.requisicoesSimultaneas)).toEqual([
      2, 1,
    ]);
  });

  it("não deixa uma falha do observador quebrar a operação", async () => {
    const apiClient = instrumentarApiClient(
      criarApiClient(async () => "resultado"),
      {
        origem: "servidor",
        observar: () => {
          throw new Error("Destino de métricas indisponível.");
        },
        agora: criarRelogio(50, 55),
      },
    );

    await expect(
      apiClient.request<string>({
        path: "/health",
        method: "GET",
      }),
    ).resolves.toBe("resultado");
  });
});
