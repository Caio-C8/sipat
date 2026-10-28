import { describe, expect, it } from "vitest";
import { ApiError } from "../../../lib/api/api-error";
import { authErrorMessage, mapZodErrors } from "./form-errors";

describe("erros dos formulários de autenticação", () => {
  it("mantém somente a primeira mensagem de cada campo", () => {
    expect(
      mapZodErrors({
        issues: [
          { path: ["email"], message: "E-mail inválido." },
          { path: ["email"], message: "Outra mensagem." },
          { path: ["senha"], message: "Senha obrigatória." },
        ],
      }),
    ).toEqual({ email: "E-mail inválido.", senha: "Senha obrigatória." });
  });

  it("não enumera conta e orienta rate limit com Retry-After", () => {
    expect(
      authErrorMessage(new ApiError("http", 401, "CREDENCIAIS_INVALIDAS")),
    ).toBe("E-mail ou senha inválidos.");
    expect(
      authErrorMessage(new ApiError("http", 429, "MUITAS_REQUISICOES", [], 30)),
    ).toBe("Muitas tentativas. Aguarde 30 segundos e tente novamente.");
  });
});
