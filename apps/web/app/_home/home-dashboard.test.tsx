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

const dados = {
  totais: {
    total: 32,
    porStatus: { ATIVO: 28, BAIXADO: 2, EMPRESTADO: 1, EM_MANUTENCAO: 1 },
  },
  pendencias: {
    inventarios: [
      {
        id: "7041c62b-5f83-432c-a178-889977d839b1",
        nome: "Inventário anual",
        quantidadeCorrecoes: 2,
        pendenciaMaisAntigaEm: "2026-09-01T15:00:00.000Z",
        destino:
          "/inventarios/7041c62b-5f83-432c-a178-889977d839b1?visao=pendentes",
      },
    ],
    manutencoes: [
      {
        id: "5c0945b2-7d3c-4b75-8bc6-5b0bf04086ab",
        numeroPedido: "19",
        dataEnvio: "2026-09-02",
        quantidadeItensSemRetorno: 1,
        destino: "/manutencoes/5c0945b2-7d3c-4b75-8bc6-5b0bf04086ab",
      },
    ],
    depreciacao: {
      competencia: "2026-08",
      quantidadePatrimonios: 4,
      destino: "/depreciacao?competencia=2026-08",
    },
  },
  setores: [
    {
      id: "24df3a43-5c02-47fb-ab92-03757a058f9f",
      nome: "Administrativo",
      total: 30,
      destino: "/patrimonios?setorId=24df3a43-5c02-47fb-ab92-03757a058f9f",
    },
  ],
  atividades: [
    {
      patrimonioId: "77777777-7777-4777-8777-777777777777",
      numeroPatrimonio: "00000001",
      tipo: "MANUTENCAO_RETORNO" as const,
      titulo: "Retorno de manutenção",
      registradoEm: "2026-09-21T15:00:00.000Z",
      destino:
        "/patrimonios/77777777-7777-4777-8777-777777777777?aba=historico",
    },
  ],
};

afterEach(cleanup);

describe("HomeDashboard", () => {
  it("mostra totais, pendências vencidas e destinos canônicos", () => {
    render(
      <HomeDashboard
        identidade={identidade}
        dataAtual={new Date("2026-09-23T15:00:00.000Z")}
        dashboard={{ status: "sucesso", dados }}
      />,
    );

    const resumo = screen.getByRole("region", { name: "Resumo dos bens" });
    expect(within(resumo).getByText("32")).toBeTruthy();
    expect(
      screen
        .getByText("23 de setembro de 2026")
        .closest("time")
        ?.getAttribute("datetime"),
    ).toBe("2026-09-23");
    expect(
      screen.getByRole("link", { name: "Ver pendências" }).getAttribute("href"),
    ).toContain("visao=pendentes");
    expect(
      screen.getByRole("link", { name: "Abrir pedido" }).getAttribute("href"),
    ).toContain("/manutencoes/");
    expect(
      screen
        .getByRole("link", { name: "Consultar competência" })
        .getAttribute("href"),
    ).toContain("competencia=2026-08");
    expect(
      screen.getByRole("link", { name: /Administrativo/ }).getAttribute("href"),
    ).toContain("setorId=");
    expect(
      screen
        .getByRole("link", { name: /Retorno de manutenção/ })
        .getAttribute("href"),
    ).toContain("aba=historico");
    expect(screen.queryByRole("link", { name: "Cadastrar bem" })).toBeNull();
  });

  it("trata vazios como resultado válido para o diretor", () => {
    render(
      <HomeDashboard
        identidade={{ ...identidade, perfil: "DIRETOR_PATRIMONIO" }}
        dashboard={{
          status: "sucesso",
          dados: {
            totais: {
              total: 0,
              porStatus: {
                ATIVO: 0,
                BAIXADO: 0,
                EMPRESTADO: 0,
                EM_MANUTENCAO: 0,
              },
            },
            pendencias: { inventarios: [], manutencoes: [], depreciacao: null },
            setores: [],
            atividades: [],
          },
        }}
      />,
    );
    expect(
      screen.getByText("Nenhuma pendência vencida exige atenção."),
    ).toBeTruthy();
    expect(
      screen.getByText("Nenhuma atividade sua foi registrada."),
    ).toBeTruthy();
    expect(screen.getByRole("link", { name: "Cadastrar bem" })).toBeTruthy();
    expect(screen.queryByRole("alert")).toBeNull();
  });

  it("mantém a falha global visível sem reutilizar números", () => {
    render(
      <HomeDashboard identidade={identidade} dashboard={{ status: "erro" }} />,
    );
    expect(screen.getByRole("alert").textContent).toContain(
      "Não foi possível carregar a visão geral",
    );
    expect(screen.getAllByText("—")).toHaveLength(4);
    expect(screen.queryByText("32")).toBeNull();
  });
});
