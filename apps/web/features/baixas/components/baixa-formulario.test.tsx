// @vitest-environment jsdom

import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "@/lib/api/core/api-error";
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
  function selecionar(rotulo: string, opcao: string) {
    fireEvent.click(screen.getByRole("combobox", { name: rotulo }));
    fireEvent.click(screen.getByRole("option", { name: opcao }));
  }

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
    fireEvent.change(screen.getByLabelText("Data da baixa *"), {
      target: { value: "2026-11-02" },
    });
    await waitFor(() =>
      expect(listarOpcoesComissoesBaixa).toHaveBeenCalledOnce(),
    );

    selecionar("Tipo", "Alienação");
    selecionar("Comissão vigente na data", "Comissão patrimonial");
    fireEvent.change(screen.getByLabelText("Motivo *"), {
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
  }, 15_000);

  it("mostra erros de entrada junto aos campos sem usar validação nativa", async () => {
    render(
      <BaixaFormulario
        patrimonio={{
          id: patrimonioId,
          numeroPatrimonio: "123",
          descricao: "Notebook corporativo",
        }}
        onSuccess={vi.fn()}
      />,
    );

    const formulario = screen
      .getByRole("button", { name: "Confirmar baixa" })
      .closest("form")!;
    expect(formulario.hasAttribute("novalidate")).toBe(true);
    fireEvent.submit(formulario);

    expect(
      await screen.findByText("Informe uma data da baixa válida."),
    ).toBeTruthy();
    expect(screen.getByText("Selecione o tipo da baixa.")).toBeTruthy();
    expect(screen.getByText("Informe o motivo da baixa.")).toBeTruthy();
    expect(
      screen.getByText(
        "Confirme que revisou os dados e reconhece que a baixa é irreversível.",
      ),
    ).toBeTruthy();
    expect(baixar).not.toHaveBeenCalled();
  });

  it("explica o conflito quando o patrimônio participa de inventário aberto", async () => {
    listarOpcoesComissoesBaixa.mockResolvedValue({
      dados: [{ id: comissaoId, nome: "Comissão patrimonial" }],
    });
    baixar.mockRejectedValue(
      new ApiError({
        status: 409,
        codigo: "PATRIMONIO_EM_INVENTARIO_ABERTO",
        mensagem: "Conflito.",
        categoria: "http",
      }),
    );
    render(
      <BaixaFormulario
        patrimonio={{
          id: patrimonioId,
          numeroPatrimonio: "123",
          descricao: "Notebook corporativo",
        }}
        onSuccess={vi.fn()}
      />,
    );

    fireEvent.change(screen.getByLabelText("Data da baixa *"), {
      target: { value: "2026-11-02" },
    });
    await waitFor(() =>
      expect(listarOpcoesComissoesBaixa).toHaveBeenCalledOnce(),
    );
    selecionar("Tipo", "Alienação");
    selecionar("Comissão vigente na data", "Comissão patrimonial");
    fireEvent.change(screen.getByLabelText("Motivo *"), {
      target: { value: "Alienação autorizada" },
    });
    fireEvent.click(screen.getByRole("checkbox"));
    fireEvent.submit(
      screen.getByRole("button", { name: "Confirmar baixa" }).closest("form")!,
    );

    expect(
      await screen.findByText(
        "Este patrimônio participa de um inventário ainda não finalizado. Finalize o inventário antes de registrar a baixa.",
      ),
    ).toBeTruthy();
  });
});
