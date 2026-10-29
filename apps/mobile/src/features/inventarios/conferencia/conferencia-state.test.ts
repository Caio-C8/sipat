import { describe, expect, it } from "vitest";
import { ApiError } from "../../../lib/api/api-error";
import {
  conferenciaErrorMessage,
  itemJaVerificadoData,
  normalizeNumeroPatrimonial,
  parseNumeroPatrimonial,
  releaseSubmission,
  shouldMountCamera,
  tryAcquireSubmission,
} from "./conferencia-state";

describe("estado da conferência", () => {
  it.each([
    [" 123 ", "123"],
    [" sp-45 ", "SP-45"],
  ])("normaliza %s para o valor canônico %s", (input, output) => {
    expect(normalizeNumeroPatrimonial(input)).toBe(output);
    expect(parseNumeroPatrimonial(input)).toMatchObject({
      success: true,
      data: output,
    });
  });

  it.each(["", "0", "001", "SP-0", "1 2", "QR:https://example.test"])(
    "rejeita leitura não patrimonial %s",
    (input) => expect(parseNumeroPatrimonial(input).success).toBe(false),
  );

  it("mantém somente uma submissão adquirida por vez", () => {
    const lock = { current: false };
    expect(tryAcquireSubmission(lock)).toBe(true);
    expect(tryAcquireSubmission(lock)).toBe(false);
    releaseSubmission(lock);
    expect(tryAcquireSubmission(lock)).toBe(true);
  });

  it("monta a câmera apenas quando foco, permissão e estado permitem", () => {
    const ready = {
      available: true,
      focused: true,
      granted: true,
      modalOpen: false,
      submitting: false,
    };
    expect(shouldMountCamera(ready)).toBe(true);
    expect(shouldMountCamera({ ...ready, focused: false })).toBe(false);
    expect(shouldMountCamera({ ...ready, modalOpen: true })).toBe(false);
    expect(shouldMountCamera({ ...ready, submitting: true })).toBe(false);
    expect(shouldMountCamera({ ...ready, granted: false })).toBe(false);
    expect(shouldMountCamera({ ...ready, available: false })).toBe(false);
  });

  it("valida e apresenta o setor da primeira verificação", () => {
    const data = {
      itemInventarioId: "11111111-1111-4111-8111-111111111111",
      setorPrimeiraVerificacao: {
        id: "22222222-2222-4222-8222-222222222222",
        nome: "Tecnologia da Informação",
      },
      verificadoEm: "2026-10-29T12:00:00.000Z",
      contextoLocalizacao: "MOVIMENTACAO_FISICA_SEM_HISTORICO",
    };
    const error = new ApiError(
      "http",
      409,
      "ITEM_INVENTARIO_JA_VERIFICADO",
      [],
      undefined,
      data,
    );
    expect(itemJaVerificadoData(error)).toEqual(data);
    expect(conferenciaErrorMessage(error)).toContain(
      "Tecnologia da Informação",
    );
  });

  it.each([
    [new ApiError("network"), "Nenhuma leitura foi salva"],
    [new ApiError("timeout"), "Tente novamente explicitamente"],
    [
      new ApiError("http", 404, "ITEM_INVENTARIO_NAO_ENCONTRADO"),
      "não pertence",
    ],
    [
      new ApiError("http", 409, "SETOR_INVENTARIO_FORA_DE_ANDAMENTO"),
      "não está mais em andamento",
    ],
  ])("distingue erros públicos", (error, message) => {
    expect(conferenciaErrorMessage(error)).toContain(message);
  });
});
