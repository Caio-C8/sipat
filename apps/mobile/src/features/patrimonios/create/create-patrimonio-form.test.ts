import { describe, expect, it } from "vitest";
import {
  effectiveResidual,
  mapCreatePatrimonioForm,
  monthlyDepreciationPreview,
  validateCreatePatrimonioStep,
  type CreatePatrimonioForm,
} from "./create-patrimonio-form";

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
  registryDate: "2026-09-27",
  incorporationValue: "6.000,00",
  usefulLifeMonths: "60",
  residualMode: "value",
  residualValue: "600,00",
  residualPercentage: "",
  depreciationStartDate: "2026-10-01",
};

describe("formulário de criação patrimonial", () => {
  it("converte moeda, omite vazios e valida o contrato público", () => {
    expect(mapCreatePatrimonioForm(form)).toEqual({
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
      mapCreatePatrimonioForm(percentage).parametrosDepreciacao,
    ).toMatchObject({
      percentualResidual: "10",
      valorResidual: "600",
    });
  });

  it("preserva ausência de processo e valida campos por etapa", () => {
    expect(mapCreatePatrimonioForm(form)).not.toHaveProperty(
      "processoCompraId",
    );
    expect(
      validateCreatePatrimonioStep({ ...form, description: "" }, 1),
    ).toHaveProperty("description");
    expect(
      validateCreatePatrimonioStep({ ...form, speciesId: "" }, 2),
    ).toHaveProperty("speciesId");
    expect(
      validateCreatePatrimonioStep({ ...form, registryDate: "27/09/2026" }, 3),
    ).toHaveProperty("registryDate");
    expect(
      validateCreatePatrimonioStep({ ...form, residualValue: "7000" }, 4),
    ).toHaveProperty("residual");
  });
});
