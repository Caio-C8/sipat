import { describe, expect, it } from "vitest";
import {
  addDecimal,
  centsDigitsToDecimal,
  compareDecimal,
  decimalToCentsDigits,
  divideDecimalByInteger,
  formatBrl,
  formatBrlInput,
  formatDecimalBr,
  multiplyDecimal,
  subtractDecimal,
} from "./decimal";

describe("formatação decimal sem perda de precisão", () => {
  it("preserva inteiros maiores que o limite seguro do JavaScript", () => {
    expect(formatBrl("900719925474099312345.1")).toBe(
      "R$ 900.719.925.474.099.312.345,1000000",
    );
  });

  it("completa exatamente sete casas sem converter para number", () => {
    expect(formatDecimalBr("001234.567", 7)).toBe("1.234,5670000");
    expect(formatBrl("0")).toBe("R$ 0,0000000");
  });

  it("mantém duas casas na edição e transporta decimal como string", () => {
    expect(decimalToCentsDigits("1234.50")).toBe("123450");
    expect(centsDigitsToDecimal("123450")).toBe("1234.50");
    expect(formatBrlInput("1234.5")).toBe("R$ 1.234,50");
  });

  it("rejeita representações que não pertencem ao contrato decimal", () => {
    expect(() => formatBrl("1e3")).toThrow(RangeError);
    expect(() => formatBrl("Infinity")).toThrow(RangeError);
  });

  it("calcula com BigInt sem arredondamento binário", () => {
    expect(addDecimal("900719925474099312345.1000000", "0.0000001")).toBe(
      "900719925474099312345.1000001",
    );
    expect(subtractDecimal("900719925474099312345.1000000", "0.0000001")).toBe(
      "900719925474099312345.0999999",
    );
    expect(multiplyDecimal("1000.00", "12.50", 2)).toBe("12500.00");
    expect(divideDecimalByInteger("12500.00", "100", 2)).toBe("125.00");
    expect(divideDecimalByInteger("875.00", "12", 7)).toBe("72.9166667");
    expect(compareDecimal("10.00", "9.99")).toBe(1);
  });
});
