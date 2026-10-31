import { describe, expect, it } from "vitest";
import { ApiError } from "../../../lib/api/api-error";
import {
  authErrorMessage,
  mapZodErrors,
  passwordRecoveryErrorMessage,
} from "./form-errors";

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

  it("distingue os erros públicos de recuperação sem enumerar conta", () => {
    expect(passwordRecoveryErrorMessage(new ApiError("network"))).toContain(
      "Sem conexão",
    );
    expect(passwordRecoveryErrorMessage(new ApiError("timeout"))).toContain(
      "demorou",
    );
    expect(
      passwordRecoveryErrorMessage(new ApiError("invalid-response", 202)),
    ).toContain("Não foi possível concluir a solicitação");
    expect(passwordRecoveryErrorMessage(new ApiError("http", 503))).toContain(
      "indisponível",
    );
    expect(
      passwordRecoveryErrorMessage(
        new ApiError("http", 429, "MUITAS_REQUISICOES", [], 45),
      ),
    ).toBe("Muitas solicitações. Aguarde 45 segundos e tente novamente.");
  });
});
