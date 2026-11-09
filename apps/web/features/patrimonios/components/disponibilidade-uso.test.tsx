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
import { DisponibilidadeUso } from "./disponibilidade-uso";

const mocks = vi.hoisted(() => ({
  confirmar: vi.fn(),
  refresh: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: mocks.refresh }),
}));
vi.mock("../api/hooks", () => ({
  useConfirmarDisponibilidadeUso: () => ({
    pending: false,
    confirmar: mocks.confirmar,
  }),
}));

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

const id = "7041c62b-5f83-432c-a178-889977d839b1";
const patrimonio = {
  id,
  numeroPatrimonio: "1",
  tipoNumeroPatrimonial: "OFICIAL",
  descricao: "Notebook",
  marca: null,
  modelo: null,
  numeroSerie: null,
  status: "ATIVO",
  depreciavel: true,
  situacaoContabil: {
    valorBrutoAtual: "1200.0000000",
    depreciacaoAcumuladaAtual: "0.0000000",
  },
  setorAtual: { id, nome: "TI", responsavel: { id, nome: "Responsável" } },
  especie: { id, nome: "Notebook", natureza: { id, nome: "Equipamento" } },
  dataTombamento: "2026-11-01",
  tipoIncorporacao: "AQUISICAO",
  valorIncorporacao: "1200.0000000",
  processoCompra: null,
  cadastradoPor: { id, nome: "Operador" },
  parametroDepreciacaoAtual: {
    metodo: "LINEAR",
    vidaUtilInicialMeses: 60,
    percentualResidual: null,
    valorResidual: "120.0000000",
    valorBaseInicial: "1200.0000000",
    dataInicio: null,
    dataFim: null,
  },
  disponibilidadeUso: null,
  resumoDepreciacao: {
    primeiraCompetencia: null,
    ultimaCompetenciaProcessada: null,
    proximaCompetencia: null,
    quantidadePendencias: 0,
  },
  createdAt: "2026-11-01T12:00:00.000Z",
  updatedAt: null,
} satisfies PatrimonioDetalhe;

describe("DisponibilidadeUso", () => {
  it("não oferece a ação ao administrador", () => {
    render(
      <DisponibilidadeUso
        patrimonio={patrimonio}
        diretor={false}
        hoje="2026-11-08"
      />,
    );
    expect(screen.getByText("Aguardando disponibilidade")).toBeTruthy();
    expect(
      screen.queryByRole("button", {
        name: "Confirmar disponibilidade para uso",
      }),
    ).toBeNull();
  });

  it("preserva a chave em resultado incerto e usa a response confirmada", async () => {
    mocks.confirmar
      .mockRejectedValueOnce(new Error("rede indisponível"))
      .mockResolvedValueOnce({
        dados: {
          id,
          dataDisponibilidade: "2026-11-08",
          primeiraCompetencia: "2026-12",
          createdAt: "2026-11-08T12:00:00.000Z",
          createdBy: { id, nome: "João Diretor" },
        },
      });
    render(
      <DisponibilidadeUso patrimonio={patrimonio} diretor hoje="2026-11-08" />,
    );

    fireEvent.click(
      screen.getByRole("button", {
        name: "Confirmar disponibilidade para uso",
      }),
    );
    expect(
      screen.getByText(/Primeira competência prevista:/).textContent,
    ).toContain("Dezembro de 2026");
    fireEvent.click(screen.getByRole("button", { name: /^Confirmar$/ }));
    await screen.findByText(
      "O resultado não pôde ser confirmado. A tentativa foi preservada; confira os dados antes de reenviar.",
    );
    fireEvent.click(screen.getByRole("button", { name: /^Confirmar$/ }));

    await waitFor(() => expect(mocks.confirmar).toHaveBeenCalledTimes(2));
    expect(mocks.confirmar.mock.calls[1]![0].chaveIdempotencia).toBe(
      mocks.confirmar.mock.calls[0]![0].chaveIdempotencia,
    );
    await screen.findByText("Confirmada em 08/11/2026 por João Diretor.");
    expect(mocks.refresh).toHaveBeenCalledTimes(1);
  });
});
