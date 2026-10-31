import { describe, expect, it } from "vitest";
import {
  dateInputToIso,
  effectiveResidual,
  formatCurrencyInput,
  formatDateInput,
  formatIntegerInput,
  formatPercentageInput,
  mapCreatePatrimonioForm,
  monthlyDepreciationPreview,
  validateCreatePatrimonioStep,
  type CreatePatrimonioForm,
} from "./create-patrimonio-form";

const IDEMPOTENCY_KEY = "33333333-3333-4333-8333-333333333333";

const form: CreatePatrimonioForm = {
  description: " Notebook corporativo ",
  brand: " ",
  model: "Latitude",
  serialNumber: " ",
  withoutOfficialNumber: false,
  speciesId: "11111111-1111-4111-8111-111111111111",
  sectorId: "22222222-2222-4222-8222-222222222222",
  incorporationType: "AQUISICAO",
  purchaseProcessId: "",
  registryDate: "27/09/2026",
  incorporationValue: "6.000,00",
  usefulLifeMonths: "60",
  residualMode: "value",
  residualValue: "600,00",
  residualPercentage: "",
  depreciationStartDate: "01/10/2026",
};

describe("formulário de criação patrimonial", () => {
  it("mascara datas e rejeita dias inexistentes", () => {
    expect(formatDateInput("27092026")).toBe("27/09/2026");
    expect(dateInputToIso("27/09/2026")).toBe("2026-09-27");
    expect(dateInputToIso("29/02/2025")).toBeNull();
    expect(dateInputToIso("29/02/2024")).toBe("2024-02-29");
  });

  it("preenche moeda em centavos da direita para a esquerda", () => {
    expect(formatCurrencyInput("1")).toBe("0,01");
    expect(formatCurrencyInput("0,012", "0,01")).toBe("0,12");
    expect(formatCurrencyInput("0,123", "0,12")).toBe("1,23");
    expect(formatCurrencyInput("1,2", "1,23")).toBe("0,12");
    expect(formatCurrencyInput("0,1", "0,12")).toBe("0,01");
    expect(formatCurrencyInput("0,0", "0,01")).toBe("");
    expect(formatCurrencyInput("123456")).toBe("1.234,56");
    expect(formatCurrencyInput("5", "1.234,56")).toBe("0,05");
  });

  it("remove caracteres não numéricos dos demais campos numéricos", () => {
    expect(formatIntegerInput("12a0 meses", 4)).toBe("120");
    expect(formatIntegerInput("12345", 4)).toBe("1234");
    expect(formatPercentageInput("1a0,5% ")).toBe("10,5");
    expect(formatPercentageInput("10.567")).toBe("10,56");
    expect(formatPercentageInput(",5")).toBe("0,5");
  });

  it("converte moeda, omite vazios e valida o contrato público", () => {
    expect(mapCreatePatrimonioForm(form, IDEMPOTENCY_KEY)).toEqual({
      chaveIdempotencia: IDEMPOTENCY_KEY,
      semNumeroOficial: false,
      dataTombamento: "2026-09-27",
      tipoIncorporacao: "AQUISICAO",
      descricao: "Notebook corporativo",
      modelo: "Latitude",
      valorIncorporacao: "6000.00",
      especieId: form.speciesId,
      setorAtualId: form.sectorId,
      parametrosDepreciacao: {
        metodo: "LINEAR",
        vidaUtilInicialMeses: 60,
        valorResidual: "600.00",
        valorBaseInicial: "6000.00",
        dataInicio: "2026-10-01",
      },
    });
  });

  it("calcula residual percentual e quota linear com inteiros escalados", () => {
    const percentage = {
      ...form,
      residualMode: "percentage" as const,
      residualPercentage: "10",
    };
    expect(effectiveResidual(percentage)).toBe("600");
    expect(monthlyDepreciationPreview(percentage)).toBe("90");
    expect(
      mapCreatePatrimonioForm(percentage, IDEMPOTENCY_KEY)
        .parametrosDepreciacao,
    ).toMatchObject({
      percentualResidual: "10",
      valorResidual: "600",
    });
  });

  it("preserva ausência de processo e valida campos por etapa", () => {
    expect(mapCreatePatrimonioForm(form, IDEMPOTENCY_KEY)).not.toHaveProperty(
      "processoCompraId",
    );
    expect(
      validateCreatePatrimonioStep({ ...form, description: "" }, 1),
    ).toHaveProperty("description");
    expect(
      validateCreatePatrimonioStep({ ...form, speciesId: "" }, 2),
    ).toHaveProperty("speciesId");
    expect(
      validateCreatePatrimonioStep({ ...form, registryDate: "2026-09-27" }, 3),
    ).toHaveProperty("registryDate");
    expect(
      validateCreatePatrimonioStep({ ...form, incorporationValue: "0,00" }, 3),
    ).toHaveProperty("incorporationValue");
    expect(
      validateCreatePatrimonioStep({ ...form, residualValue: "7000" }, 4),
    ).toHaveProperty("residual");
    expect(
      validateCreatePatrimonioStep({ ...form, usefulLifeMonths: "" }, 4),
    ).toHaveProperty("usefulLifeMonths");
    expect(
      validateCreatePatrimonioStep({ ...form, residualValue: "" }, 4),
    ).toHaveProperty("residual");
    expect(
      validateCreatePatrimonioStep({ ...form, depreciationStartDate: "" }, 4),
    ).toHaveProperty("depreciationStartDate");
  });
});
