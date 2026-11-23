// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { SimpleQueryFilters } from "./simple-query-filters";

afterEach(cleanup);

describe("SimpleQueryFilters", () => {
  it("usa os campos compartilhados e mantém o valor selecionado na URL", () => {
    const { container } = render(
      <SimpleQueryFilters
        action="/fornecedores"
        title="Pesquisar fornecedores"
        filters={[
          {
            type: "text",
            name: "busca",
            label: "Buscar",
            defaultValue: "papelaria",
          },
          {
            type: "select",
            name: "situacao",
            label: "Situação",
            defaultValue: "todos",
            options: [
              { value: "todos", label: "Todos" },
              { value: "inativos", label: "Inativos" },
            ],
          },
        ]}
      />,
    );

    expect(
      screen.getByRole("heading", { name: "Pesquisar fornecedores" }),
    ).toBeTruthy();
    expect(screen.getByDisplayValue("papelaria")).toBeTruthy();
    fireEvent.click(screen.getByRole("combobox", { name: "Situação" }));
    fireEvent.click(screen.getByRole("option", { name: "Inativos" }));
    expect(
      container.querySelector<HTMLInputElement>('input[name="situacao"]')
        ?.value,
    ).toBe("inativos");
    expect(
      screen.getByRole("link", { name: "Limpar filtros" }).getAttribute("href"),
    ).toBe("/fornecedores");
  });

  it("representa a opção sem filtro sem criar item vazio no Select", () => {
    const { container } = render(
      <SimpleQueryFilters
        action="/setores"
        filters={[
          {
            type: "select",
            name: "ativo",
            label: "Situação",
            options: [
              { value: "", label: "Todos" },
              { value: "true", label: "Ativos" },
            ],
          },
        ]}
      />,
    );

    expect(
      container.querySelector<HTMLInputElement>('input[name="ativo"]')?.value,
    ).toBe("");
    expect(screen.getByDisplayValue("Todos")).toBeTruthy();
  });
});
