import { describe, it, expect, vi } from "vitest";
import { criarOperacoesCadastros } from "./cadastro-operations";
import { criarOperacoesComplementares } from "./complementos";
import { createApiClient } from "@/lib/api/core/create-api-client";
import type { ApiClient } from "@/lib/api/core/types";
const id = "7041c62b-5f83-432c-a178-889977d839b1";
describe("operações de cadastros", () => {
  it.each([
    "naturezas",
    "especies",
    "responsaveis",
    "setores",
    "fornecedores",
    "comissoes",
    "processos",
    "notas",
  ] as const)("pagina %s com cookie e sem cache", async (dominio) => {
    const request = vi.fn().mockResolvedValue({ dados: [] });
    const api = criarOperacoesCadastros({ request } as ApiClient);
    await api[dominio].listar(
      { busca: " exemplo ", pagina: "2", limite: "10" },
      { cookie: "sipat_session=sintetica" },
    );
    expect(request).toHaveBeenCalledWith(
      expect.objectContaining({
        query: { busca: "exemplo", pagina: 2, limite: 10 },
        cache: "no-store",
        headers: { Cookie: "sipat_session=sintetica" },
      }),
    );
    expect(() => api[dominio].consultar("../invalido")).toThrow();
    expect(request).toHaveBeenCalledTimes(1);
  });
  it("usa os contratos e endpoints próprios de fornecedores", async () => {
    const request = vi.fn().mockResolvedValue({ dados: { id } });
    const api = criarOperacoesCadastros({ request } as ApiClient);
    await api.fornecedores.criar({
      chaveIdempotencia: id,
      razaoSocial: "Fornecedor real",
    });
    await api.fornecedores.alterar(id, {
      nomeFantasia: null,
      email: "CONTATO@EXAMPLE.TEST",
    });
    await api.fornecedores.situacao(id, false);
    expect(request).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        path: "/fornecedores",
        method: "POST",
        body: { chaveIdempotencia: id, razaoSocial: "Fornecedor real" },
        headers: { "X-SIPAT-CSRF": "1" },
      }),
    );
    expect(request).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        path: "/fornecedores/" + id,
        method: "PATCH",
        body: { nomeFantasia: null, email: "contato@example.test" },
      }),
    );
    expect(request).toHaveBeenNthCalledWith(
      3,
      expect.objectContaining({
        path: "/fornecedores/" + id + "/situacao",
        method: "PATCH",
        body: { ativo: false },
      }),
    );
  });
  it("rejeita response fora do contrato sem retornar lista vazia", async () => {
    const api = criarOperacoesCadastros(
      createApiClient({
        baseUrl: "https://sipat.example.test/api",
        fetchImplementation: vi.fn(async () => Response.json({ dados: [] })),
      }),
    );
    await expect(api.naturezas.listar({})).rejects.toMatchObject({
      categoria: "resposta_invalida",
    });
  });
  it("monta multipart com índices válidos e preserva valores decimais", async () => {
    const request = vi.fn().mockResolvedValue({ dados: { id } });
    const api = criarOperacoesComplementares({ request } as ApiClient);
    await api.criarProcesso({
      dados: {
        chaveIdempotencia: id,
        valorTotal: "123456789012.1234567",
        notas: [
          {
            numeroNotaFiscal: "1",
            anoNotaFiscal: 2026,
            dataEmissao: "2026-11-02",
            fornecedorId: id,
            anexoIndice: 0,
          },
        ],
      },
      anexos: [new File(["%PDF-1.4"], "nota.pdf", { type: "application/pdf" })],
    });
    const options = request.mock.calls[0]![0];
    expect(options.path).toBe("/processos-compra");
    expect(options.headers).toEqual({ "X-SIPAT-CSRF": "1" });
    expect(JSON.parse(options.body.get("dados")).valorTotal).toBe(
      "123456789012.1234567",
    );
    expect(options.body.getAll("anexos")).toHaveLength(1);
  });
  it("recusa anexo inválido ou sem associação antes da rede", () => {
    const request = vi.fn();
    const api = criarOperacoesComplementares({ request } as ApiClient);
    expect(() =>
      api.criarProcesso({
        dados: { chaveIdempotencia: id, notas: [] },
        anexos: [
          new File(["%PDF-1.4"], "nota.pdf", { type: "application/pdf" }),
        ],
      }),
    ).toThrow();
    expect(() =>
      api.substituirAnexo({
        id,
        anexo: new File(["texto"], "nota.txt", { type: "text/plain" }),
      }),
    ).toThrow("Selecione um PDF");
    expect(request).not.toHaveBeenCalled();
  });
  it("remove integrante por DELETE sem schema de corpo 204", async () => {
    const request = vi.fn().mockResolvedValue(undefined);
    const api = criarOperacoesComplementares({ request } as ApiClient);
    await api.removerMembro({ comissaoId: id, membroComissaoId: id });
    expect(request).toHaveBeenCalledWith({
      path: "/comissoes/" + id + "/membros/" + id,
      method: "DELETE",
      headers: { "X-SIPAT-CSRF": "1" },
    });
  });
});
