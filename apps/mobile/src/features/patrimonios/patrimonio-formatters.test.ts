import { describe, expect, it } from "vitest";
import {
  formatCivilDate,
  formatCurrency,
  formatPatrimonioNumber,
  subtractDecimal,
} from "./patrimonio-formatters";

describe("formatadores de patrimônio", () => {
  it("aplica seis dígitos sem alterar o valor canônico", () => {
    expect(formatPatrimonioNumber("2656", "OFICIAL")).toBe("002656");
    expect(formatPatrimonioNumber("SP-31", "SEM_NUMERO_OFICIAL")).toBe(
      "SP-000031",
    );
  });

  it("formata data civil sem conversão de fuso", () => {
    expect(formatCivilDate("2026-01-27")).toBe("27/01/2026");
  });

  it("calcula e formata dinheiro sem aritmética binária", () => {
    expect(subtractDecimal("6000.0000000", "720.0000000")).toBe("5280.0000000");
    expect(formatCurrency("5280.0000000")).toBe("R$ 5.280,00");
    expect(formatCurrency("999.9999999")).toBe("R$ 1.000,00");
  });
});
