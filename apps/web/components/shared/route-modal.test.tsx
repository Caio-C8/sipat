// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { RouteModal } from "./route-modal";

afterEach(cleanup);

describe("modal roteável compartilhado", () => {
  it("compõe título, descrição e conteúdo em um dialog acessível", () => {
    render(
      <RouteModal
        title="Cadastrar item"
        description="Informe os dados do item."
        onClose={() => undefined}
      >
        <form aria-label="Dados do item" />
      </RouteModal>,
    );

    expect(screen.getByRole("dialog", { name: "Cadastrar item" })).toBeTruthy();
    expect(screen.getByText("Informe os dados do item.")).toBeTruthy();
    expect(screen.getByRole("form", { name: "Dados do item" })).toBeTruthy();
  });

  it("delega o fechamento para a navegação da rota", () => {
    const onClose = vi.fn();
    render(
      <RouteModal
        title="Editar item"
        description="Atualize os dados do item."
        onClose={onClose}
      >
        <div>Conteúdo</div>
      </RouteModal>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Fechar" }));

    expect(onClose).toHaveBeenCalledOnce();
  });
});
