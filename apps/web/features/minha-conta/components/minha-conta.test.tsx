// @vitest-environment jsdom

import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import type { IdentidadeAutenticada } from "@repo/contracts";
import { MinhaConta } from "./minha-conta";

afterEach(cleanup);

const identidade: IdentidadeAutenticada = {
  id: "00000000-0000-4000-8000-000000000001",
  nome: "Paulo Caixeta",
  email: "paulo.caixeta@example.test",
  perfil: "ADMINISTRADOR",
  trocaSenhaObrigatoria: false,
};

describe("MinhaConta", () => {
  it("mostra a identidade autenticada e oferece a alteração da própria senha", () => {
    render(<MinhaConta identidade={identidade} />);

    expect(screen.getByRole("heading", { name: "Minha conta" })).toBeTruthy();
    expect(screen.getAllByText("Paulo Caixeta")).toHaveLength(2);
    expect(screen.getAllByText("paulo.caixeta@example.test")).toHaveLength(2);
    expect(screen.getByText("Administrador")).toBeTruthy();
    expect(screen.getByText("Ativa")).toBeTruthy();
    expect(
      screen.getByRole("link", { name: "Alterar senha" }).getAttribute("href"),
    ).toBe("/minha-conta/alterar-senha");
    expect(
      screen
        .getByRole("link", { name: /Inicie a recuperação de acesso/ })
        .getAttribute("href"),
    ).toBe("/esqueci-senha");
  });
});
