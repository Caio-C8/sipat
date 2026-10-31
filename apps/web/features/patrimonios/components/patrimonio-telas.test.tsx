// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { PatrimonioTelas } from "./patrimonio-telas";

afterEach(cleanup);

describe("PatrimonioTelas", () => {
  it("permite consultar, abrir a ficha, o histórico, o relatório e um painel sem enviar operações", () => {
    render(<PatrimonioTelas />);
    expect(
      screen.getByRole("heading", { name: "Consultar patrimônio" }),
    ).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Ver ficha" }));
    expect(
      screen.getByRole("heading", { name: "Notebook corporativo" }),
    ).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Histórico do bem" }));
    expect(
      screen.getByRole("heading", { name: "Histórico de operações" }),
    ).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Movimentar bem" }));
    expect(screen.getByRole("dialog", { name: "Movimentar bem" })).toBeTruthy();
    expect(
      (
        screen.getByRole("button", {
          name: "Confirmar movimentação",
        }) as HTMLButtonElement
      ).disabled,
    ).toBe(true);
    fireEvent.click(screen.getByRole("button", { name: "Cancelar" }));
    fireEvent.click(screen.getByRole("button", { name: "Gerar ficha do bem" }));
    expect(
      screen.getByRole("heading", { name: "Relatório do patrimônio" }),
    ).toBeTruthy();
  });
});
