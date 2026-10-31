import { describe, expect, it, vi } from "vitest";
import { createApiClient } from "@/lib/api/core/create-api-client";
import { criarOperacoesEmprestimos } from "./emprestimo-operations";

const id = "a0000000-0000-4000-8000-000000000001";

describe("operações Web de empréstimos", () => {
  it("usa filtros e valida a resposta paginada", async () => {
    const fetchImplementation = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(
        JSON.stringify({
          status: 200,
          sucesso: true,
          mensagem: "OK",
          dados: [],
          meta: { total: 0, pagina: 1, ultimaPagina: 1, limite: 20 },
        }),
        { status: 200 },
      ),
    );
    const operacoes = criarOperacoesEmprestimos(
      createApiClient({ baseUrl: "http://localhost/api", fetchImplementation }),
    );
    expect(
      (await operacoes.listar({ somenteAtrasados: "false" })).dados,
    ).toEqual([]);
    expect(fetchImplementation.mock.calls[0]?.[0]).toContain(
      "somenteAtrasados=false",
    );
  });

  it("valida o body, envia CSRF e não repete mutação com falha de rede", async () => {
    const fetchImplementation = vi
      .fn<typeof fetch>()
      .mockRejectedValue(new TypeError("rede"));
    const operacoes = criarOperacoesEmprestimos(
      createApiClient({ baseUrl: "http://localhost/api", fetchImplementation }),
    );
    const body = {
      chaveIdempotencia: id,
      modoAgrupamento: "EM_GRUPO" as const,
      patrimonioIds: [id],
      destinatario: "Instituição sintética",
      finalidade: "Teste",
      dataEmprestimo: "2026-10-30",
      dataPrevistaDevolucao: "2026-11-02",
      comissaoId: id,
    };
    await expect(operacoes.criar(body)).rejects.toMatchObject({
      categoria: "rede",
    });
    expect(fetchImplementation).toHaveBeenCalledTimes(1);
    expect(
      new Headers(fetchImplementation.mock.calls[0]?.[1]?.headers).get(
        "x-sipat-csrf",
      ),
    ).toBe("1");
    expect(() =>
      operacoes.criar({ ...body, patrimonioIds: [id, id] }),
    ).toThrow();
    expect(fetchImplementation).toHaveBeenCalledTimes(1);
    await expect(
      operacoes.devolver(id, {
        chaveIdempotencia: id,
        emprestimoIds: [id],
        dataDevolucao: "2026-10-31",
        comissaoId: id,
      }),
    ).rejects.toMatchObject({ categoria: "rede" });
    expect(fetchImplementation).toHaveBeenCalledTimes(2);
    expect(String(fetchImplementation.mock.calls[1]?.[0])).toContain(
      `/emprestimos/${id}/devolucoes`,
    );
  });
});
