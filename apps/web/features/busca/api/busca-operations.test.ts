import { describe, expect, it, vi } from "vitest";
import { criarOperacoesBusca } from "./busca-operations";

describe("operações da busca global", () => {
  it("normaliza a query, valida a resposta e encaminha o cancelamento", async () => {
    const request = vi
      .fn()
      .mockResolvedValue({ dados: { termo: "mesa", grupos: [] } });
    const controller = new AbortController();
    const operacoes = criarOperacoesBusca({ request });

    await operacoes.buscar({ termo: "  mesa  " }, controller.signal);

    expect(request).toHaveBeenCalledWith(
      expect.objectContaining({
        path: "/busca",
        query: { termo: "mesa", limite: 5 },
        cache: "no-store",
        signal: controller.signal,
      }),
    );
  });
});
