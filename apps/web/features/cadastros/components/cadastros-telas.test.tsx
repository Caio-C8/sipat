// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { CadastrosTelas } from "./cadastros-telas";

afterEach(cleanup);

describe("CadastrosTelas", () => {
  it("mantém a busca local e comunica que processos de compra não são gravados", () => {
    render(<CadastrosTelas secao="processos" />);
    expect(screen.getByRole("heading", { name: "Cadastros" })).toBeTruthy();
    fireEvent.change(screen.getByRole("textbox", { name: "Buscar cadastro" }), {
      target: { value: "inexistente" },
    });
    expect(screen.getByText("Nenhum registro encontrado.")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Novo processo" }));
    expect(
      (
        screen.getByRole("button", {
          name: "Salvar processo",
        }) as HTMLButtonElement
      ).disabled,
    ).toBe(true);
  });

  it("mostra a comissão e permite ajustar a prévia dos membros sem salvar", () => {
    render(<CadastrosTelas secao="comissoes" />);
    expect(
      screen.getByRole("heading", { name: "Membros da comissão" }),
    ).toBeTruthy();
    expect(screen.getByText("Ana Martins")).toBeTruthy();
    fireEvent.click(screen.getAllByRole("button", { name: "Remover" })[1]!);
    expect(screen.queryByText("Ana Martins")).toBeNull();
    expect(
      (
        screen.getByRole("button", {
          name: "Salvar comissão",
        }) as HTMLButtonElement
      ).disabled,
    ).toBe(true);
  });
});
