// @vitest-environment jsdom

import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
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
    fireEvent.change(screen.getByLabelText(/^Senha atual/), {
      target: { value: "senha atual 1!" },
    });
    fireEvent.change(screen.getByLabelText(/^Nova senha/), {
      target: { value: "nova senha segura 2!" },
    });
    fireEvent.change(screen.getByLabelText(/^Confirmar nova senha/), {
      target: { value: "nova senha segura 2!" },
    });

    fireEvent.click(screen.getByRole("button", { name: "Salvar nova senha" }));

    expect(await screen.findByRole("status")).toBeTruthy();
    expect(screen.getByText("Senha alterada com sucesso")).toBeTruthy();
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

  it("mostra a validação no campo e direciona o foco antes de chamar a API", async () => {
    render(<AlterarSenhaForm />);
    fireEvent.change(screen.getByLabelText(/^Senha atual/), {
      target: { value: "senha atual 1!" },
    });
    fireEvent.change(screen.getByLabelText(/^Nova senha/), {
      target: { value: "nova senha segura 2!" },
    });
    const confirmacao = screen.getByLabelText(/^Confirmar nova senha/);
    fireEvent.change(confirmacao, {
      target: { value: "outra senha segura 3!" },
    });

    fireEvent.click(screen.getByRole("button", { name: "Salvar nova senha" }));

    expect(
      screen.getByText(
        "A confirmação da nova senha não corresponde à nova senha.",
      ),
    ).toBeTruthy();
    expect(confirmacao.getAttribute("aria-invalid")).toBe("true");
    await waitFor(() => expect(document.activeElement).toBe(confirmacao));
    expect(mocks.confirmar).not.toHaveBeenCalled();
  });

  it("mantém os valores e mostra um alerta persistente quando a alteração falha", async () => {
    mocks.confirmar.mockRejectedValueOnce(new Error("falha inesperada"));
    render(<AlterarSenhaForm />);

    const senhaAtual = screen.getByLabelText(/^Senha atual/);
    fireEvent.change(senhaAtual, {
      target: { value: "senha atual 1!" },
    });
    fireEvent.change(screen.getByLabelText(/^Nova senha/), {
      target: { value: "nova senha segura 2!" },
    });
    fireEvent.change(screen.getByLabelText(/^Confirmar nova senha/), {
      target: { value: "nova senha segura 2!" },
    });

    fireEvent.click(screen.getByRole("button", { name: "Salvar nova senha" }));

    expect(
      await screen.findByText(
        "Não foi possível concluir a operação. Tente novamente.",
      ),
    ).toBeTruthy();
    expect(screen.getByText("Não foi possível alterar a senha")).toBeTruthy();
    expect((senhaAtual as HTMLInputElement).value).toBe("senha atual 1!");
  });

  it("cancela a alteração voltando para a rota canônica da conta", () => {
    render(<AlterarSenhaForm />);

    expect(
      screen.getByRole("link", { name: "Cancelar" }).getAttribute("href"),
    ).toBe("/minha-conta");
  });
});
