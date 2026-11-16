// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { PatrimonioHistoricoFiltros } from "./patrimonio-historico-filtros";

const { push } = vi.hoisted(() => ({ push: vi.fn() }));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
}));

afterEach(() => {
  cleanup();
  push.mockReset();
});

describe("PatrimonioHistoricoFiltros", () => {
  it("restaura filtros da URL e limpa mantendo a aba histórica", () => {
    render(
      <PatrimonioHistoricoFiltros
        patrimonioId="5c0945b2-7d3c-4b75-8bc6-5b0bf04086ab"
        valores={{
          evento: "MOVIMENTACAO",
          busca: "almoxarifado",
          dataInicial: "2026-11-01",
          dataFinal: "2026-11-15",
        }}
      />,
    );

    expect(
      (screen.getByLabelText("Pesquisar no histórico") as HTMLInputElement)
        .value,
    ).toBe("almoxarifado");
    expect(
      (screen.getByLabelText("Data inicial") as HTMLInputElement).value,
    ).toBe("2026-11-01");

    fireEvent.click(screen.getByRole("button", { name: "Limpar filtros" }));

    expect(push).toHaveBeenCalledWith(
      "/patrimonios/5c0945b2-7d3c-4b75-8bc6-5b0bf04086ab?aba=historico",
    );
  });
});
