import { describe, expect, it, vi } from "vitest";
import { DashboardOperacionalResponseSchema } from "@repo/contracts";
import type { ApiClient } from "@/lib/api/core/types";
import { criarOperacoesDashboard } from "./dashboard-operations";

describe("operações do dashboard", () => {
  it("faz uma única consulta agregada, privada e validada", async () => {
    const request = vi.fn().mockResolvedValue({
      dados: {
        totais: {
          total: 0,
          porStatus: {
            ATIVO: 0,
            BAIXADO: 0,
            EMPRESTADO: 0,
            EM_MANUTENCAO: 0,
          },
        },
        pendencias: {
          inventarios: [],
          manutencoes: [],
          depreciacao: null,
        },
        setores: [],
        atividades: [],
      },
    });
    const operacoes = criarOperacoesDashboard({
      request,
    } as unknown as ApiClient);

    await operacoes.consultar("sessao=segura");

    expect(request).toHaveBeenCalledTimes(1);
    expect(request).toHaveBeenCalledWith({
      path: "/dashboard",
      method: "GET",
      headers: { Cookie: "sessao=segura" },
      cache: "no-store",
      responseSchema: DashboardOperacionalResponseSchema,
    });
  });
});
