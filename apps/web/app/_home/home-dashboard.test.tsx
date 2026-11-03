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
  it("exibe totais reais, data sem hidratação e pendências, setores e atividades", () => {
    render(
      <HomeDashboard
        identidade={identidade}
        dataAtual={new Date(2026, 8, 23, 12)}
        resumoPatrimonial={{
          status: "sucesso",
          dados: {
            correcoesPendentes: 4,
            setores: [
              {
                id: "7041c62b-5f83-432c-a178-889977d839b1",
                nome: "Administrativo",
                total: 32,
              },
            ],
            atividades: [
              {
                patrimonioId: "7041c62b-5f83-432c-a178-889977d839b1",
                numero: "00000001",
                titulo: "Retorno de manutenção",
                registradoEm: "2026-09-21T15:00:00.000Z",
              },
            ],
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
    expect(screen.getByText(/correções de inventário pendentes/)).toBeTruthy();
    expect(
      screen.getByRole("link", { name: /Administrativo/ }).getAttribute("href"),
    ).toContain("setorId=");
    expect(
      screen
        .getByRole("link", { name: /Retorno de manutenção/ })
        .getAttribute("href"),
    ).toContain("/patrimonios/");
    expect(screen.queryByRole("link", { name: "Cadastrar bem" })).toBeNull();
    expect(
      screen
        .getByRole("link", { name: "Relatório de inventário" })
        .getAttribute("href"),
    ).toBe("/relatorios?tipo=inventarios");
    expect(screen.queryByText(/dados ilustrativos/i)).toBeNull();
  });

  it("trata zero como resultado válido", () => {
    render(
      <HomeDashboard
        identidade={{ ...identidade, perfil: "DIRETOR_PATRIMONIO" }}
        resumoPatrimonial={{
          status: "sucesso",
          dados: {
            correcoesPendentes: 0,
            setores: [],
            atividades: [],
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
    expect(screen.getByText("Nenhuma atividade registrada.")).toBeTruthy();
    expect(
      screen
        .getByRole("link", { name: "Movimentar bens" })
        .getAttribute("href"),
    ).toBe("/movimentacoes/nova");
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
