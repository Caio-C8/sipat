// @vitest-environment jsdom

import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { HomeDashboard } from "./home-dashboard";

const identidade = {
  id: "28df5e9c-3e60-4a8e-a4d4-8ca70221f4f0",
  nome: "Maria da Silva",
  email: "maria@example.com",
  perfil: "ADMINISTRADOR" as const,
  trocaSenhaObrigatoria: false,
};

afterEach(cleanup);

describe("HomeDashboard", () => {
  it("exibe totais reais, data sem hidratação e estados não implementados", () => {
    render(
      <HomeDashboard
        identidade={identidade}
        dataAtual={new Date(2026, 8, 23, 12)}
        resumoPatrimonial={{
          status: "sucesso",
          dados: {
            total: 32,
            porStatus: {
              ATIVO: 28,
              BAIXADO: 2,
              EMPRESTADO: 1,
              EM_MANUTENCAO: 1,
            },
          },
        }}
      />,
    );

    const resumo = screen.getByRole("region", { name: "Resumo dos bens" });
    expect(within(resumo).getByText("32")).toBeTruthy();
    expect(within(resumo).getByText("28")).toBeTruthy();
    expect(within(resumo).getAllByText("1")).toHaveLength(2);
    expect(
      screen
        .getByText("23 de setembro de 2026")
        .closest("time")
        ?.getAttribute("datetime"),
    ).toBe("2026-09-23");
    expect(
      screen.getAllByText(
        "Dados ainda não disponíveis — integração não implementada",
      ),
    ).toHaveLength(3);
    expect(screen.getAllByRole("button", { name: /Em breve/ })).toHaveLength(6);
    for (const action of screen.getAllByRole("button", { name: /Em breve/ })) {
      expect((action as HTMLButtonElement).disabled).toBe(true);
    }
    expect(screen.queryByText(/dados ilustrativos/i)).toBeNull();
  });

  it("trata zero como resultado válido", () => {
    render(
      <HomeDashboard
        identidade={identidade}
        resumoPatrimonial={{
          status: "sucesso",
          dados: {
            total: 0,
            porStatus: {
              ATIVO: 0,
              BAIXADO: 0,
              EMPRESTADO: 0,
              EM_MANUTENCAO: 0,
            },
          },
        }}
      />,
    );

    expect(screen.getByText("Nenhum patrimônio cadastrado.")).toBeTruthy();
    expect(screen.queryByRole("alert")).toBeNull();
  });

  it("não reutiliza números quando a integração falha", () => {
    render(
      <HomeDashboard
        identidade={identidade}
        resumoPatrimonial={{ status: "erro" }}
      />,
    );

    expect(screen.getByRole("alert").textContent).toContain(
      "Não foi possível carregar os dados patrimoniais.",
    );
    expect(screen.getAllByText("—")).toHaveLength(4);
    expect(screen.queryByText("32")).toBeNull();
    expect(screen.queryByText("28")).toBeNull();
  });
});
