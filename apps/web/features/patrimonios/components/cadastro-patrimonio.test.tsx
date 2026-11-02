// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { CadastroPatrimonio } from "./cadastro-patrimonio";

const mocks = vi.hoisted(() => ({
  carregar: vi.fn(async () => undefined),
  confirmar: vi.fn(),
  salvar: vi.fn(),
  especies: [
    {
      id: "00000000-0000-4000-8000-000000000001",
      nome: "Notebooks",
      natureza: {
        id: "00000000-0000-4000-8000-000000000011",
        nome: "Bens móveis",
      },
    },
    {
      id: "00000000-0000-4000-8000-000000000002",
      nome: "Imóveis",
      natureza: {
        id: "00000000-0000-4000-8000-000000000012",
        nome: "Bens imóveis",
      },
    },
  ],
  setores: [
    {
      id: "00000000-0000-4000-8000-000000000003",
      nome: "Tecnologia da Informação",
      responsavel: {
        id: "00000000-0000-4000-8000-000000000013",
        nome: "Paulo Caixeta",
      },
    },
    {
      id: "00000000-0000-4000-8000-000000000004",
      nome: "Administrativo",
      responsavel: {
        id: "00000000-0000-4000-8000-000000000014",
        nome: "Ana Oliveira",
      },
    },
  ],
  processos: [
    {
      id: "00000000-0000-4000-8000-000000000005",
      numeroProcesso: "028",
      anoProcesso: 2026,
      valorTotal: "18000.00",
      quantidadeNotas: 3,
    },
  ],
}));

vi.mock("../api/hooks", () => ({
  useEspeciesPatrimonio: () => ({
    dados: mocks.especies,
    erro: null,
    loading: false,
    carregar: mocks.carregar,
  }),
  useSetoresPatrimonio: () => ({
    dados: mocks.setores,
    erro: null,
    loading: false,
    carregar: mocks.carregar,
  }),
  useProcessosCompraPatrimonio: () => ({
    dados: mocks.processos,
    erro: null,
    loading: false,
    carregar: mocks.carregar,
  }),
  useCriarPatrimonio: () => ({ pending: false, confirmar: mocks.confirmar }),
}));

vi.mock("../api/use-patrimonio-pendente", () => ({
  usePatrimonioPendente: () => ({ pedido: null, salvar: mocks.salvar }),
}));

afterEach(cleanup);

beforeEach(() => {
  mocks.confirmar.mockReset();
  mocks.salvar.mockReset();
  mocks.confirmar.mockResolvedValue({
    dados: {
      descricao: "Notebook corporativo",
      numeroPatrimonio: "2656",
    },
  });
});

describe("CadastroPatrimonio", () => {
  it("atualiza natureza, responsável e resumo ao trocar as opções selecionadas", () => {
    render(<CadastroPatrimonio usuarioId="usuario-teste" />);

    fireEvent.change(screen.getByLabelText("Espécie *"), {
      target: { value: mocks.especies[1]!.id },
    });
    fireEvent.change(screen.getByLabelText("Setor de destino *"), {
      target: { value: mocks.setores[1]!.id },
    });
    fireEvent.change(screen.getByLabelText("Descrição do bem *"), {
      target: { value: "Mesa de reunião" },
    });

    expect(screen.getByDisplayValue("Bens imóveis")).toBeTruthy();
    expect(screen.getByDisplayValue("Ana Oliveira")).toBeTruthy();
    expect(screen.getByText("Imóveis · Bens imóveis")).toBeTruthy();
    expect(screen.getByText("Administrativo", { selector: "p" })).toBeTruthy();
    expect(screen.getByText("Mesa de reunião")).toBeTruthy();
  });

  it("recalcula a estimativa e envia o contrato ao cadastrar", async () => {
    render(<CadastroPatrimonio usuarioId="usuario-teste" />);
    fireEvent.change(screen.getByLabelText("Descrição do bem *"), {
      target: { value: "Notebook corporativo" },
    });
    fireEvent.change(screen.getByLabelText("Espécie *"), {
      target: { value: mocks.especies[0]!.id },
    });
    fireEvent.change(screen.getByLabelText("Setor de destino *"), {
      target: { value: mocks.setores[0]!.id },
    });
    fireEvent.change(screen.getByLabelText(/Valor de incorporação/), {
      target: { value: "6.000,00" },
    });
    fireEvent.change(screen.getByLabelText("Valor residual"), {
      target: { value: "600,00" },
    });

    expect(
      (screen.getByLabelText("Valor de incorporação (R$)") as HTMLInputElement)
        .value,
    ).toBe("6.000,00");
    expect(
      (screen.getByLabelText("Valor residual") as HTMLInputElement).value,
    ).toBe("600,00");
    expect(screen.getByText(/90,00/)).toBeTruthy();
    fireEvent.click(
      screen.getByRole("button", { name: "Cadastrar patrimônio" }),
    );

    expect(mocks.confirmar).toHaveBeenCalledWith(
      expect.objectContaining({
        descricao: "Notebook corporativo",
        especieId: mocks.especies[0]!.id,
        setorAtualId: mocks.setores[0]!.id,
        valorIncorporacao: "6000.00",
      }),
    );
  });

  it("permite repetir o mesmo pedido após uma falha de rede", async () => {
    mocks.confirmar.mockRejectedValueOnce(new Error("Falha de rede"));
    render(<CadastroPatrimonio usuarioId="usuario-teste" />);

    fireEvent.change(screen.getByLabelText("Descrição do bem *"), {
      target: { value: "Notebook corporativo" },
    });
    fireEvent.change(screen.getByLabelText("Espécie *"), {
      target: { value: mocks.especies[0]!.id },
    });
    fireEvent.change(screen.getByLabelText("Setor de destino *"), {
      target: { value: mocks.setores[0]!.id },
    });
    fireEvent.change(screen.getByLabelText(/Valor de incorporação/), {
      target: { value: "1.000,00" },
    });
    fireEvent.change(screen.getByLabelText("Valor residual"), {
      target: { value: "100,00" },
    });
    fireEvent.click(
      screen.getByRole("button", { name: "Cadastrar patrimônio" }),
    );

    const retry = await screen.findByRole("button", {
      name: "Tentar novamente com os mesmos dados",
    });
    fireEvent.click(retry);

    expect(
      await screen.findByRole("heading", { name: "Patrimônio cadastrado" }),
    ).toBeTruthy();
    expect(mocks.confirmar).toHaveBeenCalledTimes(2);
    expect(mocks.confirmar.mock.calls[0]![0]).toEqual(
      mocks.confirmar.mock.calls[1]![0],
    );
  });
});
