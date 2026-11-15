// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { SystemState } from "./system-state";

const voltar = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ back: voltar }),
}));

afterEach(() => {
  cleanup();
  voltar.mockClear();
});

describe("estado global do sistema", () => {
  it("oferece retorno, Início e recuperação com linguagem orientada à ação", () => {
    const tentarNovamente = vi.fn();
    render(
      <SystemState
        title="Não foi possível abrir esta página"
        description="Tente carregar o conteúdo novamente."
        variant="erro"
        retry={tentarNovamente}
      />,
    );

    expect(
      screen.getByRole("heading", {
        name: "Não foi possível abrir esta página",
      }),
    ).toBeTruthy();
    expect(screen.getByRole("alert").textContent).toContain("Tente carregar");
    fireEvent.click(screen.getByRole("button", { name: "Tentar novamente" }));
    expect(tentarNovamente).toHaveBeenCalledOnce();
    fireEvent.click(screen.getByRole("button", { name: "Voltar" }));
    expect(voltar).toHaveBeenCalledOnce();
    expect(
      screen.getByRole("link", { name: "Início" }).getAttribute("href"),
    ).toBe("/dashboard");
  });
});
