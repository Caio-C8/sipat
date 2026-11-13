import { describe, expect, it } from "vitest";
import {
  classeStatusManutencao,
  formatarDataCivil,
  formatarMoeda,
  rotuloStatusManutencao,
} from "./apresentacao";

describe("apresentação de manutenções", () => {
  it("formata datas civis sem deslocamento de fuso", () => {
    expect(formatarDataCivil("2026-11-13")).toBe("13/11/2026");
    expect(formatarDataCivil(null)).toBe("Não informada");
  });

  it("formata valores e preserva ausência explícita", () => {
    expect(formatarMoeda("1234.5")).toBe("R$ 1.234,50");
    expect(formatarMoeda(null)).toBe("Não informado");
  });

  it("distingue visual e textualmente os estados do ciclo", () => {
    expect(rotuloStatusManutencao("EM_ANDAMENTO")).toBe("Em andamento");
    expect(rotuloStatusManutencao("CONCLUIDA")).toBe("Concluída");
    expect(classeStatusManutencao("EM_ANDAMENTO")).toContain("amber");
    expect(classeStatusManutencao("CONCLUIDA")).toContain("emerald");
  });
});
