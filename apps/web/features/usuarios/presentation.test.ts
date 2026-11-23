import { describe, expect, it } from "vitest";
import { perfilLabel } from "./presentation";

describe("perfilLabel", () => {
  it("apresenta os dois perfis públicos do SIPAT", () => {
    expect(perfilLabel("ADMINISTRADOR")).toBe("Administrador");
    expect(perfilLabel("DIRETOR_PATRIMONIO")).toBe("Diretor de patrimônio");
  });

  it("preserva um perfil desconhecido para não ocultar o valor recebido", () => {
    expect(perfilLabel("NOVO_PERFIL")).toBe("NOVO_PERFIL");
  });
});
