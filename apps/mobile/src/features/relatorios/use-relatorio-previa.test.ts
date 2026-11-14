import { describe, expect, it, vi } from "vitest";
import { ApiError } from "../../lib/api/api-error";
import { relatorioPreviaErrorMessage } from "./use-relatorio-previa";

vi.mock("../../config/public-app-config", () => ({
  publicAppConfig: { apiBaseUrl: "https://api.example.test/api" },
}));

describe("relatorioPreviaErrorMessage", () => {
  it.each([
    [new ApiError("http", 401), "sessão expirou"],
    [new ApiError("http", 403), "não tem permissão"],
    [new ApiError("http", 422), "filtros não foram aceitos"],
    [new ApiError("http", 429), "limite de consultas"],
    [new ApiError("http", 503), "temporariamente indisponível"],
    [new ApiError("timeout"), "tempo limite"],
    [new ApiError("network"), "Sem conexão"],
    [new ApiError("invalid-response"), "prévia inválida"],
  ])("distingue o erro público %s", (error, expected) => {
    expect(relatorioPreviaErrorMessage(error)).toContain(expected);
  });

  it("informa Retry-After em limites públicos", () => {
    expect(
      relatorioPreviaErrorMessage(
        new ApiError("http", 429, "RELATORIO_LIMITE_EXCEDIDO", [], 12),
      ),
    ).toContain("12 segundos");
  });
});
