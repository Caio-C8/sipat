// @vitest-environment jsdom

import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { PatrimonioDetalhe } from "@repo/contracts";
import { PatrimonioAcoes } from "./patrimonio-acoes";

const { refresh, substituirNumero } = vi.hoisted(() => ({
  refresh: vi.fn(),
  substituirNumero: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh }),
}));

vi.mock("../api/browser-patrimonio-operations", () => ({
  browserPatrimonioOperations: { substituirNumero },
}));

vi.mock("../api/hooks", () => ({
  usePreviaNumeracaoPatrimonio: () => ({
    dados: { numeroOficial: "124", numeroSemOficial: "SP-10" },
    loading: false,
    carregar: vi.fn(async () => undefined),
  }),
}));

vi.mock("@/features/movimentacoes/components/nova-movimentacao", () => ({
  NovaMovimentacao: ({
    onSuccess,
  }: {
    onSuccess?: (mensagem: string) => void;
  }) => (
    <button
      type="button"
      onClick={() => onSuccess?.("Movimentação concluída no teste.")}
    >
      Concluir movimentação simulada
    </button>
  ),
}));

vi.mock("@/features/reavaliacoes/components/nova-reavaliacao", () => ({
  NovaReavaliacao: () => <p>Formulário de reavaliação</p>,
}));

afterEach(() => {
  cleanup();
  refresh.mockClear();
  substituirNumero.mockReset();
  substituirNumero.mockResolvedValue({ dados: patrimonio });
});

const id = "5c0945b2-7d3c-4b75-8bc6-5b0bf04086ab";
const patrimonio = {
  id,
  numeroPatrimonio: "123",
  tipoNumeroPatrimonial: "OFICIAL",
  descricao: "Computador",
  marca: "Fabricante",
  modelo: null,
  numeroSerie: "SERIE-1",
  status: "ATIVO",
  depreciavel: true,
  situacaoContabil: {
    valorBrutoAtual: "1000.0000000",
    depreciacaoAcumuladaAtual: "100.0000000",
  },
  setorAtual: {
    id,
    nome: "Tecnologia",
    responsavel: { id, nome: "Responsável" },
  },
  especie: {
    id,
    nome: "Computador",
    natureza: { id, nome: "Equipamento" },
  },
  dataTombamento: "2026-10-18",
  tipoIncorporacao: "AQUISICAO",
  valorIncorporacao: "1000.0000000",
  processoCompra: null,
  cadastradoPor: { id, nome: "Operador" },
  parametroDepreciacaoAtual: null,
  disponibilidadeUso: null,
  resumoDepreciacao: {
    primeiraCompetencia: null,
    ultimaCompetenciaProcessada: null,
    proximaCompetencia: null,
    quantidadePendencias: 0,
  },
  createdAt: "2026-10-18T12:00:00.000Z",
  updatedAt: null,
} satisfies PatrimonioDetalhe;

describe("PatrimonioAcoes", () => {
  it("abre movimentação e reavaliação em drawers sem links para páginas gerais", async () => {
    render(<PatrimonioAcoes patrimonio={patrimonio} usuarioId={id} diretor />);

    const movimentar = screen.getByRole("button", { name: "Movimentar" });
    const reavaliar = screen.getByRole("button", { name: "Reavaliar" });
    expect(movimentar.tagName).toBe("BUTTON");
    expect(reavaliar.tagName).toBe("BUTTON");
    expect(screen.queryByRole("link", { name: "Movimentar" })).toBeNull();
    expect(screen.queryByRole("link", { name: "Reavaliar" })).toBeNull();

    fireEvent.click(movimentar);
    expect(screen.getByRole("dialog")).toBeTruthy();
    expect(
      screen.getByRole("heading", { name: "Movimentar patrimônio" }),
    ).toBeTruthy();
    expect(screen.getByText(/123 · Computador/)).toBeTruthy();

    fireEvent.click(
      screen.getByRole("button", {
        name: "Concluir movimentação simulada",
      }),
    );

    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    expect(screen.getByRole("status").textContent).toContain(
      "Movimentação concluída no teste.",
    );
    expect(refresh).toHaveBeenCalledOnce();

    fireEvent.click(reavaliar);
    expect(
      screen.getByRole("heading", { name: "Reavaliar patrimônio" }),
    ).toBeTruthy();
    expect(screen.getByText("Formulário de reavaliação")).toBeTruthy();
  });

  it("substitui o número em drawer e atualiza a ficha após sucesso", async () => {
    render(<PatrimonioAcoes patrimonio={patrimonio} usuarioId={id} diretor />);

    fireEvent.click(screen.getByRole("button", { name: "Substituir número" }));
    expect(screen.getByRole("dialog")).toBeTruthy();
    expect(
      screen.getByRole("heading", { name: "Substituir número patrimonial" }),
    ).toBeTruthy();
    expect(screen.getByText(/número atual 123/)).toBeTruthy();
    expect(screen.getByText("124")).toBeTruthy();

    fireEvent.click(
      screen.getByRole("button", { name: "Confirmar substituição" }),
    );

    await waitFor(() =>
      expect(substituirNumero).toHaveBeenCalledWith(id, "123"),
    );
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    expect(refresh).toHaveBeenCalledOnce();
  });

  it("mantém ações visíveis e desativadas quando o status não permite", () => {
    render(
      <PatrimonioAcoes
        patrimonio={{ ...patrimonio, status: "EM_MANUTENCAO" }}
        usuarioId={id}
        diretor
      />,
    );

    expect(
      screen
        .getByRole("button", { name: "Movimentar" })
        .hasAttribute("disabled"),
    ).toBe(true);
    expect(
      screen
        .getByRole("button", { name: "Registrar baixa" })
        .hasAttribute("disabled"),
    ).toBe(true);
    expect(
      screen
        .getByRole("button", { name: "Substituir número" })
        .hasAttribute("disabled"),
    ).toBe(true);
    expect(
      screen
        .getByRole("button", { name: "Reavaliar" })
        .hasAttribute("disabled"),
    ).toBe(false);
    expect(screen.getByText(/em manutenção/i)).toBeTruthy();
  });
});
