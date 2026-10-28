import { describe, expect, it, vi } from "vitest";
import { criarOperacoesMovimentacoes } from "../api/movimentacao-operations";
import { createApiClient } from "@/lib/api/core/create-api-client";
import { ApiError } from "@/lib/api/core/api-error";
import {
  resultadoDesconhecido,
  formatarDataMovimentacao,
} from "../presentation";
import fixture from "../../../e2e/support/movimentacoes-fixtures.json";
describe("fronteiras da integração de movimentações", () => {
  it("valida escrita e response, envia CSRF e não repete uma mutação com falha de rede", async () => {
    const fetchImplementation = vi
      .fn<typeof fetch>()
      .mockRejectedValue(new TypeError("rede"));
    const operations = criarOperacoesMovimentacoes(
      createApiClient({ baseUrl: "http://localhost/api", fetchImplementation }),
    );
    const body = {
      chaveIdempotencia: "00000000-0000-4000-8000-000000000001",
      comissaoId: fixture.comissoes[0]!.id,
      observacao: " motivo ",
      itens: [
        {
          patrimonioId: fixture.bens[0]!.id,
          setorOrigemEsperadoId: fixture.setores[0]!.id,
          setorDestinoId: fixture.setores[1]!.id,
        },
      ],
    };
    await expect(operations.criar(body)).rejects.toBeInstanceOf(ApiError);
    expect(fetchImplementation).toHaveBeenCalledTimes(1);
    const chamada = fetchImplementation.mock.calls[0]!;
    expect(new Headers(chamada[1]?.headers).get("x-sipat-csrf")).toBe("1");
    expect(JSON.parse(chamada[1]?.body as string).observacao).toBe("motivo");
    expect(() => operations.criar({ ...body, observacao: " " })).toThrow();
    expect(fetchImplementation).toHaveBeenCalledTimes(1);
    fetchImplementation.mockResolvedValue(
      new Response(
        JSON.stringify({
          status: 201,
          sucesso: true,
          mensagem: "OK",
          dados: [{ ...fixture.detalhe, senha: "proibida" }],
        }),
        { status: 201 },
      ),
    );
    await expect(operations.criar(body)).rejects.toMatchObject({
      categoria: "resposta_invalida",
    });
  });
  it("distingue rejeição conclusiva de resultado desconhecido e usa São Paulo na data", () => {
    for (const status of [400, 403, 409])
      expect(
        resultadoDesconhecido(
          new ApiError({
            status,
            codigo: "MOVIMENTACAO_IMPEDIDA",
            mensagem: "Falha",
            categoria: "http",
          }),
        ),
      ).toBe(false);
    for (const codigo of [
      "MOVIMENTACAO_EM_PROCESSAMENTO",
      "CONFLITO_CONCORRENTE_MOVIMENTACAO",
    ])
      expect(
        resultadoDesconhecido(
          new ApiError({
            status: 409,
            codigo,
            mensagem: "Aguarde",
            categoria: "http",
          }),
        ),
      ).toBe(true);
    expect(
      resultadoDesconhecido(
        new ApiError({
          status: 500,
          codigo: "ERRO_INTERNO",
          mensagem: "Falha",
          categoria: "http",
        }),
      ),
    ).toBe(true);
    expect(formatarDataMovimentacao("2026-10-28T02:59:00.000Z")).toContain(
      "27/10/2026",
    );
  });
  it("não abandona uma confirmação incerta quando a sessão expira no reenvio", () => {
    for (const status of [401, 403])
      expect(
        resultadoDesconhecido(
          new ApiError({
            status,
            codigo: "ACESSO_NEGADO",
            mensagem: "Entre novamente",
            categoria: "http",
          }),
          true,
        ),
      ).toBe(true);
  });
});
