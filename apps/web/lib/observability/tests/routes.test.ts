import { describe, expect, it } from "vitest";
import { normalizarRotaObservavel } from "../routes";

describe("normalizarRotaObservavel", () => {
  it("normaliza a página inicial", () => {
    expect(normalizarRotaObservavel("/")).toBe("inicio");
  });

  it("normaliza as rotas públicas de recuperação sem dados sensíveis", () => {
    expect(normalizarRotaObservavel("/esqueci-senha")).toBe(
      "auth.recuperacao_solicitar",
    );
    expect(normalizarRotaObservavel("/recuperar-senha")).toBe(
      "auth.recuperacao_redefinir",
    );
    expect(normalizarRotaObservavel("/recuperacao-concluida")).toBe(
      "auth.recuperacao_concluida",
    );
  });

  it("não devolve identificadores presentes no pathname", () => {
    const nome = normalizarRotaObservavel("/recursos/identificador-privado");

    expect(nome).toBe("rota.desconhecida");
    expect(nome).not.toContain("identificador-privado");
  });

  it("usa uma categoria segura para rotas não mapeadas", () => {
    expect(normalizarRotaObservavel("/area-desconhecida/segredo")).toBe(
      "rota.desconhecida",
    );
  });
});
