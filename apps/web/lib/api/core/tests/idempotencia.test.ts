import { describe, expect, it, vi } from "vitest";
import { ApiError } from "../api-error";
import {
  decidirAposFalha,
  MENSAGEM_OPERACAO_JA_PROCESSADA,
  mensagemConflitoIdempotencia,
  obterTentativaIdempotente,
  tentativaAposFalha,
} from "../idempotencia";

function erro(codigo: string, status = 409) {
  return new ApiError({
    status,
    codigo,
    mensagem: codigo,
    categoria: "http",
  });
}

describe("decisão Web após uma tentativa idempotente", () => {
  it.each([
    ["OPERACAO_JA_PROCESSADA", "ja_processada", false, true],
    ["CHAVE_IDEMPOTENCIA_REUTILIZADA", "chave_reutilizada", false, false],
    ["OPERACAO_EM_PROCESSAMENTO", "em_processamento", true, false],
  ] as const)(
    "distingue %s",
    (codigo, tipo, manterChave, atualizarConsultas) => {
      expect(decidirAposFalha(erro(codigo))).toEqual({
        tipo,
        manterChave,
        atualizarConsultas,
      });
    },
  );

  it.each([
    new ApiError({
      status: null,
      codigo: "TIMEOUT",
      mensagem: "timeout",
      categoria: "timeout",
    }),
    erro("ERRO_INTERNO", 500),
    new Error("falha desconhecida"),
  ])("preserva a chave quando o resultado permanece incerto", (falha) => {
    expect(decidirAposFalha(falha).manterChave).toBe(true);
  });

  it("descarta a chave após uma falha conclusiva", () => {
    expect(decidirAposFalha(erro("VALIDACAO_ENTRADA_INVALIDA", 400))).toEqual({
      tipo: "falha_conclusiva",
      manterChave: false,
      atualizarConsultas: false,
    });
  });

  it("apresenta a mensagem Web aprovada para operação já processada", () => {
    expect(mensagemConflitoIdempotencia(erro("OPERACAO_JA_PROCESSADA"))).toBe(
      MENSAGEM_OPERACAO_JA_PROCESSADA,
    );
  });

  it("reutiliza a chave para o mesmo payload e cria outra após alteração", () => {
    const gerar = vi
      .fn()
      .mockReturnValueOnce("chave-1")
      .mockReturnValueOnce("chave-2");
    const primeira = obterTentativaIdempotente(null, "payload-a", gerar);
    const reenvio = obterTentativaIdempotente(primeira, "payload-a", gerar);
    const alterada = obterTentativaIdempotente(reenvio, "payload-b", gerar);

    expect(reenvio).toBe(primeira);
    expect(alterada.chave).toBe("chave-2");
    expect(gerar).toHaveBeenCalledTimes(2);
  });

  it("mantém a tentativa após timeout e a descarta após erro conclusivo", () => {
    const tentativa = { assinatura: "payload", chave: "chave" };
    const timeout = new ApiError({
      status: null,
      codigo: "TIMEOUT",
      mensagem: "timeout",
      categoria: "timeout",
    });

    expect(tentativaAposFalha(tentativa, timeout)).toBe(tentativa);
    expect(
      tentativaAposFalha(tentativa, erro("VALIDACAO_ENTRADA_INVALIDA", 400)),
    ).toBeNull();
  });
});
