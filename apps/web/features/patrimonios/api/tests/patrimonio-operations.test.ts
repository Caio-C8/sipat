import { describe, expect, it, vi } from "vitest";
import {
  BaixarPatrimonioResponseSchema,
  CABECALHO_CSRF,
  ConsultarPatrimonioResponseSchema,
  ListarPatrimoniosResponseSchema,
  ListarOpcoesComissoesBaixaResponseSchema,
  STATUS_PATRIMONIO,
  SubstituirNumeroPatrimonialResponseSchema,
  VALOR_CABECALHO_CSRF,
  type StatusPatrimonio,
} from "@repo/contracts";
import { createApiClient } from "@/lib/api/core/create-api-client";
import type { ApiClient, ApiRequestOptions } from "@/lib/api/core/types";
import { criarOperacoesPatrimonios } from "../patrimonio-operations";

function respostaPaginada(total: number) {
  return {
    status: 200,
    sucesso: true,
    mensagem: "Patrimônios listados com sucesso.",
    dados: [],
    meta: {
      total,
      pagina: 1,
      ultimaPagina: Math.max(1, total),
      limite: 1,
    },
  };
}

describe("operações de patrimônios", () => {
  const patrimonioId = "7041c62b-5f83-432c-a178-889977d839b1";
  const comissaoId = "5c0945b2-7d3c-4b75-8bc6-5b0bf04086ab";
  it("valida a query e encaminha cookie sem permitir cache", async () => {
    const request = vi.fn().mockResolvedValue(respostaPaginada(12));
    const apiClient = { request } as unknown as ApiClient;
    const operacoes = criarOperacoesPatrimonios(apiClient);

    await expect(
      operacoes.listar(
        { pagina: "1", limite: "1", status: "ATIVO" },
        { cookie: "sipat_session=segredo" },
      ),
    ).resolves.toEqual(respostaPaginada(12));

    expect(request).toHaveBeenCalledWith({
      path: "/patrimonios",
      method: "GET",
      query: { pagina: 1, limite: 1, status: "ATIVO" },
      headers: { Cookie: "sipat_session=segredo" },
      cache: "no-store",
      signal: undefined,
      responseSchema: ListarPatrimoniosResponseSchema,
    });

    await expect(
      operacoes.listar(
        { pagina: "1", limite: "0" },
        { cookie: "sipat_session=segredo" },
      ),
    ).rejects.toBeDefined();
    expect(request).toHaveBeenCalledTimes(1);
  });

  it("rejeita uma resposta que não atende ao contrato compartilhado", async () => {
    const apiClient = createApiClient({
      baseUrl: "https://api.example.test/api",
      fetchImplementation: vi.fn(async () =>
        Response.json({ status: 200, total: 10 }),
      ),
    });
    const operacoes = criarOperacoesPatrimonios(apiClient);

    await expect(
      operacoes.listar(
        { pagina: "1", limite: "1" },
        { cookie: "sipat_session=segredo" },
      ),
    ).rejects.toMatchObject({
      codigo: "CONTRATO_RESPOSTA_INVALIDO",
      categoria: "resposta_invalida",
    });
  });

  it("inicia as cinco contagens em paralelo e monta os totais da metadata", async () => {
    const totais: Record<StatusPatrimonio, number> = {
      ATIVO: 28,
      BAIXADO: 2,
      EMPRESTADO: 1,
      EM_MANUTENCAO: 1,
    };
    const resolvers: Array<() => void> = [];
    const chamadas: ApiRequestOptions<unknown>[] = [];
    const apiClient: ApiClient = {
      request: vi.fn((options: ApiRequestOptions<unknown>) => {
        chamadas.push(options);

        return new Promise((resolve) => {
          resolvers.push(() => {
            const status = options.query?.status as
              StatusPatrimonio | undefined;
            resolve(respostaPaginada(status ? totais[status] : 32));
          });
        });
      }) as ApiClient["request"],
    };
    const operacoes = criarOperacoesPatrimonios(apiClient);

    const resumoPendente = operacoes.obterResumoDashboard(
      "sipat_session=segredo",
    );

    expect(chamadas).toHaveLength(5);
    expect(chamadas.map((chamada) => chamada.query)).toEqual([
      { pagina: 1, limite: 1 },
      ...STATUS_PATRIMONIO.map((status) => ({
        pagina: 1,
        limite: 1,
        status,
      })),
    ]);

    resolvers.forEach((resolver) => resolver());

    await expect(resumoPendente).resolves.toEqual({
      total: 32,
      porStatus: totais,
    });
  });

  it("consulta detalhe e opções da baixa sem cache com contratos próprios", async () => {
    const request = vi.fn().mockResolvedValue({});
    const operacoes = criarOperacoesPatrimonios({
      request,
    } as unknown as ApiClient);

    await operacoes.consultar(patrimonioId, {
      cookie: "sipat_session=segredo",
    });
    await operacoes.listarOpcoesComissoesBaixa(patrimonioId, {
      dataBaixa: "2026-11-02",
      busca: " Comissão ",
    });

    expect(request).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        path: `/patrimonios/${patrimonioId}`,
        method: "GET",
        cache: "no-store",
        headers: { Cookie: "sipat_session=segredo" },
        responseSchema: ConsultarPatrimonioResponseSchema,
      }),
    );
    expect(request).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        path: `/patrimonios/${patrimonioId}/baixa/opcoes/comissoes`,
        query: {
          dataBaixa: "2026-11-02",
          busca: "Comissão",
          pagina: 1,
          limite: 20,
        },
        cache: "no-store",
        responseSchema: ListarOpcoesComissoesBaixaResponseSchema,
      }),
    );
  });

  it("envia baixa multipart e substituição sem Content-Type manual ou retry", async () => {
    const request = vi.fn().mockResolvedValue({});
    const operacoes = criarOperacoesPatrimonios({
      request,
    } as unknown as ApiClient);
    const documento = new File(["%PDF-1.7"], "baixa.pdf", {
      type: "application/pdf",
    });

    await operacoes.baixar(
      patrimonioId,
      {
        dataBaixa: "2026-11-02",
        tipo: "ALIENACAO",
        motivo: "Alienação autorizada",
        comissaoId,
      },
      documento,
    );
    await operacoes.substituirNumero(patrimonioId, "123");

    const baixa = request.mock.calls[0]![0];
    expect(baixa).toMatchObject({
      path: `/patrimonios/${patrimonioId}/baixa`,
      method: "POST",
      headers: { [CABECALHO_CSRF]: VALOR_CABECALHO_CSRF },
      responseSchema: BaixarPatrimonioResponseSchema,
    });
    expect(baixa.headers).not.toHaveProperty("Content-Type");
    expect(baixa.body).toBeInstanceOf(FormData);
    expect(JSON.parse(baixa.body.get("dados") as string)).toEqual({
      dataBaixa: "2026-11-02",
      tipo: "ALIENACAO",
      motivo: "Alienação autorizada",
      comissaoId,
    });
    expect(baixa.body.get("documento")).toBe(documento);
    expect(request).toHaveBeenNthCalledWith(2, {
      path: `/patrimonios/${patrimonioId}/substituicoes-numero`,
      method: "POST",
      body: { numeroPatrimonioAtual: "123" },
      headers: { [CABECALHO_CSRF]: VALOR_CABECALHO_CSRF },
      responseSchema: SubstituirNumeroPatrimonialResponseSchema,
    });
  });
});
