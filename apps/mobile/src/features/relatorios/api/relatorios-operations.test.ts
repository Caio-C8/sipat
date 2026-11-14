import { LimitesRelatorios, titulosRelatorios } from "@repo/contracts";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createRelatoriosOperations } from "./relatorios-operations";

function jsonResponse(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { "content-type": "application/json" },
  });
}

function catalogPayload() {
  return {
    status: 200,
    sucesso: true,
    mensagem: "Catálogo de relatórios.",
    dados: {
      tipos: Object.entries(titulosRelatorios).map(([tipo, titulo]) => ({
        tipo,
        titulo,
        disponivel: true,
        motivo: null,
        previa: true,
        pdf: true,
      })),
      limites: LimitesRelatorios,
    },
  };
}

afterEach(() => vi.unstubAllGlobals());

describe("createRelatoriosOperations", () => {
  it("consulta o catálogo autenticado e encaminha cancelamento", async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(catalogPayload()));
    vi.stubGlobal("fetch", fetchMock);
    const signal = new AbortController().signal;
    const operations = createRelatoriosOperations(
      "https://api.example.test/api",
    );

    await expect(
      operations.catalogo({ accessToken: "token", signal }),
    ).resolves.toMatchObject({
      dados: {
        tipos: expect.arrayContaining([
          expect.objectContaining({ tipo: "ficha-bem" }),
        ]),
      },
    });
    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.example.test/api/relatorios",
      expect.objectContaining({
        method: "GET",
        headers: expect.objectContaining({ Authorization: "Bearer token" }),
        signal: expect.any(AbortSignal),
      }),
    );
  });

  it("rejeita catálogo incompleto no boundary", async () => {
    const payload = catalogPayload();
    payload.dados.tipos = payload.dados.tipos.slice(0, 9);
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse(payload)));
    const operations = createRelatoriosOperations(
      "https://api.example.test/api",
    );

    await expect(
      operations.catalogo({ accessToken: "token" }),
    ).rejects.toMatchObject({ kind: "invalid-response" });
  });

  it("preserva 401 e 403 como erros HTTP públicos", async () => {
    for (const status of [401, 403]) {
      vi.stubGlobal(
        "fetch",
        vi.fn().mockResolvedValue(
          jsonResponse(
            {
              status,
              sucesso: false,
              codigo: status === 401 ? "NAO_AUTENTICADO" : "ACESSO_NEGADO",
              mensagem: "Acesso negado.",
              erros: [],
              requisicaoId: `req-${status}`,
            },
            status,
          ),
        ),
      );
      const operations = createRelatoriosOperations(
        "https://api.example.test/api",
      );
      await expect(
        operations.catalogo({ accessToken: "token" }),
      ).rejects.toMatchObject({ kind: "http", status });
    }
  });
});
