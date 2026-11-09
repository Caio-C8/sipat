import { describe, expect, it, vi } from "vitest";
import {
  ListarCompetenciasDepreciacaoResponseSchema,
  ResumoPendenciasDepreciacaoResponseSchema,
} from "@repo/contracts";
import type { ApiClient } from "@/lib/api/core/types";
import { criarOperacoesDepreciacoes } from "./depreciacao-operations";

describe("operações de competências de depreciação", () => {
  it("consulta competências e resumo sem cache e com a sessão server", async () => {
    const request = vi.fn().mockResolvedValue({});
    const operacoes = criarOperacoesDepreciacoes({
      request,
    } as unknown as ApiClient);

    await operacoes.listarCompetencias({ cookie: "sipat_session=teste" });
    await operacoes.consultarResumoPendencias({
      cookie: "sipat_session=teste",
    });

    expect(request).toHaveBeenNthCalledWith(1, {
      path: "/depreciacoes/competencias",
      query: {},
      responseSchema: ListarCompetenciasDepreciacaoResponseSchema,
      cache: "no-store",
      signal: undefined,
      headers: { Cookie: "sipat_session=teste" },
    });
    expect(request).toHaveBeenNthCalledWith(2, {
      path: "/depreciacoes/pendencias/resumo",
      query: {},
      responseSchema: ResumoPendenciasDepreciacaoResponseSchema,
      cache: "no-store",
      signal: undefined,
      headers: { Cookie: "sipat_session=teste" },
    });
  });
});
