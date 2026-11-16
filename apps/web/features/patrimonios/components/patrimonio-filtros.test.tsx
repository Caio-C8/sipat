// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { PatrimonioFiltros } from "./patrimonio-filtros";

vi.mock("@/lib/api/browser-api-client", () => ({ browserApiClient: {} }));
vi.mock("@/features/cadastros/api/cadastro-operations", () => ({
  criarOperacoesCadastros: () => ({
    setores: { listar: vi.fn() },
    especies: { listar: vi.fn() },
    naturezas: { listar: vi.fn() },
  }),
}));

afterEach(cleanup);

describe("PatrimonioFiltros", () => {
  it("preserva filtros combinados e permite limpar uma seleção", () => {
    const { container } = render(
      <PatrimonioFiltros
        valores={{
          busca: "notebook",
          status: "ATIVO",
          tipoNumeroPatrimonial: "OFICIAL",
          setorId: "00000000-0000-4000-8000-000000000001",
        }}
        setoresIniciais={[
          {
            value: "00000000-0000-4000-8000-000000000001",
            label: "Tecnologia",
          },
        ]}
        especiesIniciais={[
          {
            value: "00000000-0000-4000-8000-000000000002",
            label: "Notebook",
          },
        ]}
        naturezasIniciais={[]}
      />,
    );

    expect(screen.getByDisplayValue("notebook")).toBeTruthy();
    expect(screen.getByDisplayValue("Ativo")).toBeTruthy();
    expect(screen.getByDisplayValue("Número oficial")).toBeTruthy();
    expect(
      container.querySelector<HTMLInputElement>('input[name="setorId"]')?.value,
    ).toBe("00000000-0000-4000-8000-000000000001");

    fireEvent.click(screen.getByRole("combobox", { name: "Setor" }));
    fireEvent.click(screen.getByRole("option", { name: "Todos os setores" }));
    expect(
      container.querySelector<HTMLInputElement>('input[name="setorId"]')?.value,
    ).toBe("");
    expect(
      screen.getByRole("link", { name: "Limpar filtros" }).getAttribute("href"),
    ).toBe("/patrimonios");
  });
});
