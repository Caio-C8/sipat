// @vitest-environment jsdom

import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { BaixaFormulario } from "./baixa-formulario";

const { listarOpcoesComissoesBaixa, baixar } = vi.hoisted(() => ({
  listarOpcoesComissoesBaixa: vi.fn(),
  baixar: vi.fn(),
}));

vi.mock("@/features/patrimonios/api/browser-patrimonio-operations", () => ({
  browserPatrimonioOperations: { listarOpcoesComissoesBaixa, baixar },
}));

const patrimonioId = "5c0945b2-7d3c-4b75-8bc6-5b0bf04086ab";
const comissaoId = "d4f7ccde-d880-4881-a547-a5c34bf263b2";

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("BaixaFormulario", () => {
  it("carrega comissões após data válida e envia uma única baixa confirmada", async () => {
    listarOpcoesComissoesBaixa.mockResolvedValue({
      dados: [{ id: comissaoId, nome: "Comissão patrimonial" }],
    });
    baixar.mockResolvedValue({
      dados: {
        id: patrimonioId,
        patrimonio: {
          id: patrimonioId,
          numeroPatrimonio: "123",
          descricao: "Notebook corporativo",
        },
      },
    });
    const onSuccess = vi.fn();
    render(
      <BaixaFormulario
        patrimonio={{
          id: patrimonioId,
          numeroPatrimonio: "123",
          descricao: "Notebook corporativo",
        }}
        onSuccess={onSuccess}
      />,
    );

    expect(listarOpcoesComissoesBaixa).not.toHaveBeenCalled();
    fireEvent.change(screen.getByLabelText("Data da baixa"), {
      target: { value: "2026-11-02" },
    });
    await waitFor(() =>
      expect(listarOpcoesComissoesBaixa).toHaveBeenCalledOnce(),
    );

    fireEvent.change(screen.getByLabelText("Tipo"), {
      target: { value: "ALIENACAO" },
    });
    fireEvent.change(screen.getByLabelText("Comissão vigente na data"), {
      target: { value: comissaoId },
    });
    fireEvent.change(screen.getByLabelText("Motivo"), {
      target: { value: "Alienação autorizada" },
    });
    fireEvent.click(screen.getByRole("checkbox"));
    fireEvent.submit(
      screen.getByRole("button", { name: "Confirmar baixa" }).closest("form")!,
    );

    await waitFor(() => expect(baixar).toHaveBeenCalledOnce());
    expect(baixar).toHaveBeenCalledWith(
      patrimonioId,
      {
        dataBaixa: "2026-11-02",
        tipo: "ALIENACAO",
        comissaoId,
        motivo: "Alienação autorizada",
        observacao: undefined,
      },
      undefined,
    );
    expect(onSuccess).toHaveBeenCalledOnce();
  });
});
