// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import * as React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { FormErrorSummary } from "./form-error-summary";
import { ComboboxField, SelectField } from "./form-fields";
import { IntegerInput, MoneyInput } from "./numeric-inputs";

afterEach(cleanup);

const options = [
  { value: "ativo", label: "Ativo" },
  { value: "inativo", label: "Inativo" },
];

describe("fundação compartilhada de UI", () => {
  it("associa label, descrição e erro ao Select", () => {
    render(
      <SelectField
        id="situacao"
        label="Situação"
        required
        description="Escolha uma situação."
        error="Selecione uma situação."
        options={options}
        onValueChange={vi.fn()}
      />,
    );

    const select = screen.getByRole("combobox", { name: "Situação" });
    expect(select.getAttribute("aria-invalid")).toBe("true");
    expect(select.getAttribute("aria-describedby")).toBe(
      "situacao-description situacao-error",
    );
  });

  it("comunica carregamento e vazio no Combobox pesquisável", () => {
    const { rerender } = render(
      <ComboboxField
        id="catalogo"
        label="Catálogo"
        options={[]}
        loading
        onValueChange={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByRole("combobox", { name: "Catálogo" }));
    expect(screen.getByRole("status").textContent).toContain(
      "Carregando opções",
    );

    rerender(
      <ComboboxField
        id="catalogo"
        label="Catálogo"
        options={[]}
        onValueChange={vi.fn()}
      />,
    );
    expect(screen.getByText("Nenhuma opção encontrada.")).toBeTruthy();
  });

  it("expõe obrigatoriedade e mantém o valor em um campo oculto", () => {
    const { container } = render(
      <ComboboxField
        id="patrimonio"
        name="patrimonioId"
        label="Patrimônio"
        required
        value="patrimonio-1"
        options={[{ value: "patrimonio-1", label: "Patrimônio 1" }]}
        onValueChange={vi.fn()}
      />,
    );

    expect(
      screen
        .getByRole("combobox", { name: "Patrimônio" })
        .getAttribute("aria-required"),
    ).toBe("true");
    expect(
      container.querySelector<HTMLInputElement>('input[name="patrimonioId"]')
        ?.value,
    ).toBe("patrimonio-1");
  });

  it("foca o resumo geral quando ele aparece", () => {
    const { rerender } = render(<FormErrorSummary messages={[]} focus />);
    rerender(
      <FormErrorSummary messages={["Não foi possível salvar."]} focus />,
    );
    expect(screen.getByRole("alert")).toBe(document.activeElement);
  });

  it("mantém dinheiro decimal em string e inteiro sem sinais ou expoente", () => {
    const moneyChange = vi.fn();
    const integerChange = vi.fn();
    render(
      <>
        <label htmlFor="money">Valor</label>
        <MoneyInput id="money" value="0.00" onValueChange={moneyChange} />
        <label htmlFor="integer">Quantidade</label>
        <IntegerInput id="integer" value="" onValueChange={integerChange} />
      </>,
    );

    fireEvent.change(screen.getByLabelText("Valor"), {
      target: { value: "R$ 1.234,56" },
    });
    fireEvent.change(screen.getByLabelText("Quantidade"), {
      target: { value: "-12e3" },
    });

    expect(moneyChange).toHaveBeenCalledWith("1234.56");
    expect(integerChange).toHaveBeenCalledWith("123");
    expect(screen.getByLabelText("Quantidade").getAttribute("type")).toBe(
      "text",
    );
    expect(screen.getByLabelText("Quantidade").getAttribute("inputmode")).toBe(
      "numeric",
    );
  });
});
