import { describe, expect, it } from "vitest";
import { formatarDecimal } from "./presentation";

describe("apresentação de reavaliações", () => {
  it("preserva sete casas decimais nos valores monetários", () => {
    expect(formatarDecimal("1234.5")).toBe("R$ 1.234,5000000");
    expect(formatarDecimal("0.0000001")).toBe("R$ 0,0000001");
  });

  it("distingue valor ausente de zero", () => {
    expect(formatarDecimal(null)).toBe("Não registrado");
    expect(formatarDecimal("0")).toBe("R$ 0,0000000");
  });
});
