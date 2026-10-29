import { describe, expect, it } from "vitest";
import {
  catalogoNavegacao,
  encontrarNavegacaoPorCaminho,
  listarNavegacaoPorPerfil,
} from "../system-navigation";

describe("catálogo de navegação do sistema", () => {
  it("oferece movimentações e manutenções implementadas para ambos os perfis", () => {
    expect(
      catalogoNavegacao.filter((item) => item.href).map((item) => item.href),
    ).toEqual(["/dashboard", "/movimentacoes", "/manutencoes"]);
    expect(
      catalogoNavegacao.find((item) => item.id === "movimentacoes")
        ?.implementado,
    ).toBe(true);
    expect(
      listarNavegacaoPorPerfil("ADMINISTRADOR").some(
        (item) => item.href === "/movimentacoes",
      ),
    ).toBe(true);
    expect(
      listarNavegacaoPorPerfil("DIRETOR_PATRIMONIO").some(
        (item) => item.href === "/movimentacoes",
      ),
    ).toBe(true);
    for (const perfil of ["ADMINISTRADOR", "DIRETOR_PATRIMONIO"] as const)
      expect(
        listarNavegacaoPorPerfil(perfil).some(
          (item) => item.href === "/manutencoes",
        ),
      ).toBe(true);
  });

  it("aplica a matriz dos dois perfis", () => {
    const administrador = listarNavegacaoPorPerfil("ADMINISTRADOR").map(
      (item) => item.label,
    );
    const diretor = listarNavegacaoPorPerfil("DIRETOR_PATRIMONIO").map(
      (item) => item.label,
    );

    expect(administrador).toContain("Usuários");
    expect(administrador).not.toContain("Cadastrar patrimônio");
    expect(diretor).toContain("Cadastrar patrimônio");
    expect(diretor).not.toContain("Usuários");
    expect(administrador).toContain("Manutenção");
    expect(diretor).toContain("Manutenção");
  });

  it("resolve o breadcrumb pelo caminho catalogado", () => {
    expect(encontrarNavegacaoPorCaminho("/dashboard")?.breadcrumb).toEqual([
      "Início",
      "Visão geral",
    ]);
    expect(encontrarNavegacaoPorCaminho("/movimentacoes")?.breadcrumb).toEqual([
      "Início",
      "Movimentações",
    ]);
    expect(encontrarNavegacaoPorCaminho("/rota-inexistente")).toBeUndefined();
  });
});
