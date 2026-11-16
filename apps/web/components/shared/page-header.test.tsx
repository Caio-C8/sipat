// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { PageHeader } from "./page-header";

afterEach(cleanup);

describe("cabeçalho compartilhado de página", () => {
  it("renderiza um único título e a descrição sem criar ações vazias", () => {
    const { container } = render(
      <PageHeader title="Patrimônios" description="Consulte os bens." />,
    );

    expect(screen.getByRole("heading", { level: 1 }).textContent).toBe(
      "Patrimônios",
    );
    expect(screen.getByText("Consulte os bens.")).toBeTruthy();
    expect(container.querySelector("header")?.children).toHaveLength(1);
  });

  it("compõe uma ou várias ações na área secundária", () => {
    render(
      <PageHeader
        title="Inventários"
        description="Acompanhe as conferências."
        actions={
          <>
            <button type="button">Filtrar</button>
            <button type="button">Novo inventário</button>
          </>
        }
      />,
    );

    expect(screen.getByRole("button", { name: "Filtrar" })).toBeTruthy();
    expect(
      screen.getByRole("button", { name: "Novo inventário" }),
    ).toBeTruthy();
  });

  it("aceita uma única ação sem alterar a hierarquia do título", () => {
    render(
      <PageHeader
        title="Relatórios"
        description="Escolha o relatório desejado."
        actions={<button type="button">Exportar</button>}
      />,
    );

    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(screen.getByRole("button", { name: "Exportar" })).toBeTruthy();
  });
});
