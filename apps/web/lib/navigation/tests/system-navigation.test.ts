import { describe, expect, it } from "vitest";
import {
  catalogoNavegacao,
  encontrarNavegacaoPorCaminho,
  listarNavegacaoPorPerfil,
} from "../system-navigation";

describe("catálogo de navegação do sistema", () => {
  it("mantém somente rotas Web implementadas como links", () => {
    expect(catalogoNavegacao.filter((item) => item.href)).toHaveLength(1);
    expect(catalogoNavegacao.find((item) => item.href)?.href).toBe(
      "/dashboard",
    );
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
    expect(encontrarNavegacaoPorCaminho("/rota-inexistente")).toBeUndefined();
  });
});
