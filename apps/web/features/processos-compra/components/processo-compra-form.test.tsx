// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { FormularioProcesso } from "./processo-compra-form";

const mutation = vi.hoisted(() => () => ({
  pending: false,
  confirmar: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: vi.fn(), refresh: vi.fn() }),
}));
vi.mock("@/features/cadastros/api/hooks", () => ({
  useCriarProcessoCompra: mutation,
  useAlterarProcessoCompra: mutation,
  useCriarNotaFiscal: mutation,
  useAlterarNotaFiscal: mutation,
  useSubstituirAnexoNotaFiscal: mutation,
  useRemoverAnexoNotaFiscal: mutation,
}));
vi.mock("@/features/cadastros/components/seletor-cadastro", () => ({
  SeletorFornecedor: ({ name, rotulo }: { name: string; rotulo: string }) => (
    <label>
      {rotulo}
      <input name={name} />
    </label>
  ),
}));

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("FormularioProcesso", () => {
  it("usa a máscara monetária de sete casas no valor total", () => {
    render(<FormularioProcesso contexto="modal" />);

    const campo = screen.getByLabelText("Valor total (R$)");
    fireEvent.focus(campo);
    fireEvent.change(campo, {
      target: { value: "1234,12345678" },
    });

    expect((campo as HTMLInputElement).value).toBe("R$ 1.234,1234567");
    expect(
      document.querySelector<HTMLInputElement>('input[name="valorTotal"]')
        ?.value,
    ).toBe("1234.1234567");
  });

  it("disponibiliza inclusão de notas sem condicionar a interface ao perfil", () => {
    vi.stubGlobal("crypto", { randomUUID: () => "nota-1" });
    render(<FormularioProcesso contexto="modal" />);

    fireEvent.click(
      screen.getByRole("button", { name: "Adicionar nota fiscal" }),
    );

    expect(screen.getByLabelText("Fornecedor")).toBeTruthy();
    expect(screen.getByLabelText("PDF da nota 1")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Retirar nota 1" })).toBeTruthy();
  });
});
