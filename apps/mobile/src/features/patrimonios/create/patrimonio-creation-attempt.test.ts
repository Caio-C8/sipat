import { describe, expect, it, vi } from "vitest";
import { ApiError } from "../../../lib/api/api-error";
import { PatrimonioCreationAttempt } from "./patrimonio-creation-attempt";

describe("tentativa de cadastro patrimonial", () => {
  it.each([
    new ApiError("timeout"),
    new ApiError("network"),
    new ApiError("invalid-response"),
    new ApiError("http", 409, "OPERACAO_EM_PROCESSAMENTO"),
  ])("preserva a chave após resultado incerto", (error) => {
    const attempt = new PatrimonioCreationAttempt();
    const generateKey = vi
      .fn()
      .mockReturnValueOnce("key-1")
      .mockReturnValueOnce("key-2");

    expect(attempt.start(generateKey)).toBe("key-1");
    attempt.fail(error);
    attempt.payloadChanged();

    expect(attempt.start(generateKey)).toBe("key-1");
    expect(generateKey).toHaveBeenCalledOnce();
  });

  it.each([
    new ApiError("http", 400, "DADOS_INVALIDOS"),
    new ApiError("http", 401, "NAO_AUTENTICADO"),
    new ApiError("http", 409, "OPERACAO_JA_PROCESSADA"),
    new ApiError("http", 409, "CHAVE_IDEMPOTENCIA_REUTILIZADA"),
  ])("gera outra chave somente após erro conclusivo e mudança", (error) => {
    const attempt = new PatrimonioCreationAttempt();
    const generateKey = vi
      .fn()
      .mockReturnValueOnce("key-1")
      .mockReturnValueOnce("key-2");

    expect(attempt.start(generateKey)).toBe("key-1");
    attempt.fail(error);
    expect(attempt.start(generateKey)).toBe("key-1");
    attempt.fail(error);
    attempt.payloadChanged();

    expect(attempt.start(generateKey)).toBe("key-2");
  });

  it("bloqueia uma segunda confirmação enquanto a primeira está pendente", () => {
    const attempt = new PatrimonioCreationAttempt();
    const generateKey = vi.fn(() => "key-1");

    expect(attempt.start(generateKey)).toBe("key-1");
    expect(attempt.start(generateKey)).toBeNull();
    expect(generateKey).toHaveBeenCalledOnce();
  });

  it("descarta a chave ao concluir ou iniciar outro cadastro", () => {
    const attempt = new PatrimonioCreationAttempt();
    const generateKey = vi
      .fn()
      .mockReturnValueOnce("key-1")
      .mockReturnValueOnce("key-2");

    expect(attempt.start(generateKey)).toBe("key-1");
    attempt.complete();
    expect(attempt.start(generateKey)).toBe("key-2");
  });
});
