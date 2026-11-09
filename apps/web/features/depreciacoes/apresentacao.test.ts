import { describe, expect, it } from "vitest";
import { primeiraCompetencia, rotuloCompetencia } from "./apresentacao";

describe("apresentação de competências", () => {
  it("formata o mês canônico sem depender do timezone local", () => {
    expect(rotuloCompetencia("2026-04")).toBe("Abril de 2026");
  });

  it("avança a competência inclusive na virada do ano", () => {
    expect(primeiraCompetencia("2026-11-08")).toBe("2026-12");
    expect(primeiraCompetencia("2026-12-31")).toBe("2027-01");
  });
});
