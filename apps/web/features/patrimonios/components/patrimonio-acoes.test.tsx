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

const refresh = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh }),
}));

vi.mock("../api/browser-patrimonio-operations", () => ({
  browserPatrimonioOperations: {},
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
  depreciavel: false,
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
    render(<PatrimonioAcoes patrimonio={patrimonio} usuarioId={id} />);

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
});
