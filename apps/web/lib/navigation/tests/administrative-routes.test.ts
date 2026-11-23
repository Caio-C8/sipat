import { describe, expect, it } from "vitest";
import { administrativeRoutes } from "../administrative-routes";

describe("rotas administrativas canônicas", () => {
  it("mantém uma listagem independente para cada cadastro", () => {
    const lists = Object.values(administrativeRoutes).map(
      (route) => route.list,
    );

    expect(new Set(lists).size).toBe(lists.length);
    expect(lists).toEqual([
      "/processos-compra",
      "/fornecedores",
      "/setores",
      "/responsaveis",
      "/comissoes",
      "/naturezas",
      "/especies",
      "/usuarios",
    ]);
  });

  it("deriva criação e edição sem transportar estado por query string", () => {
    const id = "item com espaço";

    for (const route of Object.values(administrativeRoutes)) {
      expect(route.create).toBe(`${route.list}/novo`);
      expect(route.edit(id)).toBe(
        `${route.list}/item%20com%20espa%C3%A7o/editar`,
      );
      expect(route.create).not.toContain("?");
      expect(route.edit(id)).not.toContain("?");
    }
  });
});
