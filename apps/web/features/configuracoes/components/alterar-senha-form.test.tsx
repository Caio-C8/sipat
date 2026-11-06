// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AlterarSenhaForm } from "./alterar-senha-form";

const mocks = vi.hoisted(() => ({
  confirmar: vi.fn(),
}));

vi.mock("../api/hooks", () => ({
  useAlterarSenha: () => ({ pending: false, confirmar: mocks.confirmar }),
}));

afterEach(cleanup);

beforeEach(() => {
  mocks.confirmar.mockReset();
  mocks.confirmar.mockResolvedValue(undefined);
});

describe("AlterarSenhaForm", () => {
  it("envia a senha atual e a confirmação e informa que é preciso entrar novamente", async () => {
    render(<AlterarSenhaForm />);
    fireEvent.change(screen.getByLabelText("Senha atual *"), {
      target: { value: "senha atual 1!" },
    });
    fireEvent.change(screen.getByLabelText("Nova senha *"), {
      target: { value: "nova senha segura 2!" },
    });
    fireEvent.change(screen.getByLabelText("Confirmar nova senha *"), {
      target: { value: "nova senha segura 2!" },
    });

    fireEvent.click(screen.getByRole("button", { name: "Salvar nova senha" }));

    expect(
      await screen.findByRole("heading", { name: "Senha alterada" }),
    ).toBeTruthy();
    expect(mocks.confirmar).toHaveBeenCalledWith({
      senhaAtual: "senha atual 1!",
      novaSenha: "nova senha segura 2!",
      confirmacaoNovaSenha: "nova senha segura 2!",
    });
    expect(
      screen
        .getByRole("link", { name: "Entrar novamente" })
        .getAttribute("href"),
    ).toBe("/login");
  });

  it("mostra a validação de confirmação antes de chamar a API", () => {
    render(<AlterarSenhaForm />);
    fireEvent.change(screen.getByLabelText("Senha atual *"), {
      target: { value: "senha atual 1!" },
    });
    fireEvent.change(screen.getByLabelText("Nova senha *"), {
      target: { value: "nova senha segura 2!" },
    });
    fireEvent.change(screen.getByLabelText("Confirmar nova senha *"), {
      target: { value: "outra senha segura 3!" },
    });

    fireEvent.click(screen.getByRole("button", { name: "Salvar nova senha" }));

    expect(
      screen.getByText(
        "A confirmação da nova senha não corresponde à nova senha.",
      ),
    ).toBeTruthy();
    expect(mocks.confirmar).not.toHaveBeenCalled();
  });
});
