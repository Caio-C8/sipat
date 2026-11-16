import { describe, expect, it, vi } from "vitest";
import { createApiClient } from "@/lib/api/core/create-api-client";
import { criarOperacoesInventarios } from "./inventario-operations";

const INVENTARIO_ID = "00000000-0000-4000-8000-000000000001";
const COMISSAO_ID = "00000000-0000-4000-8000-000000000002";

describe("operações Web de inventários", () => {
  it("envia edição e finalização com contrato estrito e CSRF", async () => {
    const fetchImplementation = vi.fn<typeof fetch>().mockImplementation(
      async () =>
        new Response(
          JSON.stringify({
            status: 409,
            sucesso: false,
            codigo: "CONFLITO_CONCORRENTE_INVENTARIO",
            mensagem: "Confira os dados atualizados e tente novamente.",
            erros: [],
            requisicaoId: "req-inventarios-002",
          }),
          { status: 409, headers: { "content-type": "application/json" } },
        ),
    );
    const operacoes = criarOperacoesInventarios(
      createApiClient({ baseUrl: "http://localhost/api", fetchImplementation }),
    );

    await expect(
      operacoes.editar(INVENTARIO_ID, {
        nome: " Inventário anual ",
        descricao: null,
        observacao: null,
        comissaoId: COMISSAO_ID,
        versaoEsperada: null,
      }),
    ).rejects.toMatchObject({ codigo: "CONFLITO_CONCORRENTE_INVENTARIO" });
    await expect(
      operacoes.finalizar(INVENTARIO_ID, {
        confirmarCorrecoesPendentes: true,
      }),
    ).rejects.toMatchObject({ codigo: "CONFLITO_CONCORRENTE_INVENTARIO" });

    const [editar, finalizar] = fetchImplementation.mock.calls;
    expect(editar?.[0]).toBe(
      `http://localhost/api/inventarios/${INVENTARIO_ID}`,
    );
    expect(editar?.[1]?.method).toBe("PATCH");
    expect(new Headers(editar?.[1]?.headers).get("x-sipat-csrf")).toBe("1");
    expect(JSON.parse(editar?.[1]?.body as string).nome).toBe(
      "Inventário anual",
    );
    expect(finalizar?.[0]).toBe(
      `http://localhost/api/inventarios/${INVENTARIO_ID}/finalizar`,
    );
    expect(finalizar?.[1]?.method).toBe("POST");
    expect(new Headers(finalizar?.[1]?.headers).get("x-sipat-csrf")).toBe("1");
  });
});
