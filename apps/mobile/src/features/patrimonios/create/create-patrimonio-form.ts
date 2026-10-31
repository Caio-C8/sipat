import {
  CriarPatrimonioBodySchema,
  type CriarPatrimonioBodyData,
  type TipoIncorporacao,
} from "@repo/contracts";

export type ResidualMode = "value" | "percentage";
export type CreatePatrimonioForm = Readonly<{
  description: string;
  brand: string;
  model: string;
  serialNumber: string;
  withoutOfficialNumber: boolean;
  speciesId: string;
  sectorId: string;
  incorporationType: TipoIncorporacao;
  purchaseProcessId: string;
  registryDate: string;
  incorporationValue: string;
  usefulLifeMonths: string;
  residualMode: ResidualMode;
  residualValue: string;
  residualPercentage: string;
  depreciationStartDate: string;
}>;

export const EMPTY_CREATE_PATRIMONIO_FORM: CreatePatrimonioForm = {
  description: "",
  brand: "",
  model: "",
  serialNumber: "",
  withoutOfficialNumber: false,
  speciesId: "",
  sectorId: "",
  incorporationType: "AQUISICAO",
  purchaseProcessId: "",
  registryDate: "",
  incorporationValue: "",
  usefulLifeMonths: "",
  residualMode: "value",
  residualValue: "",
  residualPercentage: "",
  depreciationStartDate: "",
};

export type FormErrors = Readonly<Record<string, string>>;

export function formatDateInput(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 8);
  return [digits.slice(0, 2), digits.slice(2, 4), digits.slice(4, 8)]
    .filter(Boolean)
    .join("/");
}

export function dateInputToIso(value: string): string | null {
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(value);
  if (!match) return null;
  const [, dayText, monthText, yearText] = match;
  const day = Number(dayText);
  const month = Number(monthText);
  const year = Number(yearText);
  const leap = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
  const daysInMonth = [
    31,
    leap ? 29 : 28,
    31,
    30,
    31,
    30,
    31,
    31,
    30,
    31,
    30,
    31,
  ];
  if (
    year < 1 ||
    month < 1 ||
    month > 12 ||
    day < 1 ||
    day > daysInMonth[month - 1]!
  )
    return null;
  return `${yearText}-${monthText}-${dayText}`;
}

export function formatCurrencyInput(value: string, previousValue = "") {
  const previousDigits = previousValue
    .replace(/\D/g, "")
    .replace(/^0+(?=\d)/, "");
  const deleting = value === previousValue.slice(0, -1);
  const digits = (
    deleting
      ? previousDigits.slice(0, -1)
      : value.replace(/\D/g, "").replace(/^0+(?=\d)/, "")
  ).slice(0, 14);
  if (!digits) return "";
  const padded = digits.padStart(3, "0");
  const integer = BigInt(padded.slice(0, -2)).toString();
  const formattedInteger = integer.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return `${formattedInteger},${padded.slice(-2)}`;
}

export function formatIntegerInput(value: string, maxLength: number) {
  return value.replace(/\D/g, "").slice(0, maxLength);
}

export function formatPercentageInput(value: string) {
  const sanitized = value.replace(".", ",").replace(/[^\d,]/g, "");
  const separator = sanitized.indexOf(",");
  if (separator < 0) return sanitized.slice(0, 3);
  const integer = sanitized.slice(0, separator).slice(0, 3);
  const fraction = sanitized
    .slice(separator + 1)
    .replace(/,/g, "")
    .slice(0, 2);
  return `${integer || "0"},${fraction}`;
}

export function currencyInputToDecimal(value: string): string | null {
  const compact = value.replace(/\s/g, "").replace(/^R\$/i, "");
  if (!compact) return null;
  const normalized = compact.includes(",")
    ? compact.replace(/\./g, "").replace(",", ".")
    : compact;
  if (!/^\d+(?:\.\d{1,7})?$/.test(normalized)) return null;
  const [integer = "0", fraction = ""] = normalized.split(".");
  return `${BigInt(integer)}${fraction ? `.${fraction}` : ""}`;
}

function toScaled(value: string, scale = 7) {
  const [integer = "0", fraction = ""] = value.split(".");
  return (
    BigInt(integer) * 10n ** BigInt(scale) +
    BigInt(fraction.padEnd(scale, "0").slice(0, scale))
  );
}

function fromScaled(value: bigint, scale = 7) {
  const safe = value < 0n ? 0n : value;
  const digits = safe.toString().padStart(scale + 1, "0");
  const fraction = digits.slice(-scale).replace(/0+$/, "");
  return `${digits.slice(0, -scale)}${fraction ? `.${fraction}` : ""}`;
}

export function effectiveResidual(form: CreatePatrimonioForm) {
  const base = currencyInputToDecimal(form.incorporationValue);
  if (!base) return null;
  if (form.residualMode === "value")
    return currencyInputToDecimal(form.residualValue);
  const percentage = currencyInputToDecimal(form.residualPercentage);
  if (!percentage) return null;
  const divisor = 10_000n;
  return fromScaled(
    (toScaled(base) * toScaled(percentage, 2) + divisor / 2n) / divisor,
  );
}

export function monthlyDepreciationPreview(form: CreatePatrimonioForm) {
  const base = currencyInputToDecimal(form.incorporationValue);
  const residual = effectiveResidual(form);
  const months = Number(form.usefulLifeMonths);
  if (!base || !residual || !Number.isInteger(months) || months <= 0)
    return null;
  const depreciable = toScaled(base) - toScaled(residual);
  if (depreciable < 0n) return null;
  return fromScaled((depreciable + BigInt(months) / 2n) / BigInt(months));
}

export function validateCreatePatrimonioStep(
  form: CreatePatrimonioForm,
  step: 1 | 2 | 3 | 4,
): FormErrors {
  const errors: Record<string, string> = {};
  if (step === 1) {
    if (!form.description.trim()) errors.description = "Informe a descrição.";
    if (form.description.trim().length > 1_000)
      errors.description = "Use no máximo 1000 caracteres.";
    for (const [field, value] of [
      ["brand", form.brand],
      ["model", form.model],
      ["serialNumber", form.serialNumber],
    ] as const) {
      if (value.trim().length > 100)
        errors[field] = "Use no máximo 100 caracteres.";
    }
  }
  if (step === 2) {
    if (!form.speciesId) errors.speciesId = "Selecione uma espécie.";
    if (!form.sectorId) errors.sectorId = "Selecione um setor ativo.";
  }
  if (step === 3) {
    if (!dateInputToIso(form.registryDate))
      errors.registryDate = "Informe uma data válida no formato DD/MM/AAAA.";
    const incorporationValue = currencyInputToDecimal(form.incorporationValue);
    if (!incorporationValue || /^0(?:\.0+)?$/.test(incorporationValue))
      errors.incorporationValue =
        "Informe um valor monetário válido e maior que zero.";
  }
  if (step === 4) {
    const months = Number(form.usefulLifeMonths);
    if (!Number.isInteger(months) || months < 1 || months > 1_200)
      errors.usefulLifeMonths = "Informe de 1 a 1200 meses.";
    const residual = effectiveResidual(form);
    const base = currencyInputToDecimal(form.incorporationValue);
    if (!residual) errors.residual = "Informe um residual válido.";
    else if (base && toScaled(residual) > toScaled(base))
      errors.residual = "O residual não pode superar a incorporação.";
    if (
      form.residualMode === "percentage" &&
      Number(form.residualPercentage.replace(",", ".")) > 100
    )
      errors.residual = "O percentual não pode superar 100%.";
    if (!dateInputToIso(form.depreciationStartDate))
      errors.depreciationStartDate =
        "Informe uma data válida no formato DD/MM/AAAA.";
  }
  return errors;
}

function optional(value: string) {
  return value.trim() || undefined;
}

export function mapCreatePatrimonioForm(
  form: CreatePatrimonioForm,
  chaveIdempotencia: string,
): CriarPatrimonioBodyData {
  for (const step of [1, 2, 3, 4] as const) {
    if (Object.keys(validateCreatePatrimonioStep(form, step)).length)
      throw new Error(`A etapa ${step} possui campos inválidos.`);
  }
  const base = currencyInputToDecimal(form.incorporationValue)!;
  const brand = optional(form.brand);
  const model = optional(form.model);
  const serialNumber = optional(form.serialNumber);
  const purchaseProcessId = optional(form.purchaseProcessId);
  const residualPercentage =
    form.residualMode === "percentage"
      ? (currencyInputToDecimal(form.residualPercentage) ?? undefined)
      : undefined;
  return CriarPatrimonioBodySchema.parse({
    chaveIdempotencia,
    semNumeroOficial: form.withoutOfficialNumber,
    dataTombamento: dateInputToIso(form.registryDate)!,
    tipoIncorporacao: form.incorporationType,
    descricao: form.description.trim(),
    ...(brand ? { marca: brand } : {}),
    ...(model ? { modelo: model } : {}),
    ...(serialNumber ? { numeroSerie: serialNumber } : {}),
    valorIncorporacao: base,
    especieId: form.speciesId,
    setorAtualId: form.sectorId,
    ...(purchaseProcessId ? { processoCompraId: purchaseProcessId } : {}),
    parametrosDepreciacao: {
      metodo: "LINEAR",
      vidaUtilInicialMeses: Number(form.usefulLifeMonths),
      ...(residualPercentage ? { percentualResidual: residualPercentage } : {}),
      valorResidual: effectiveResidual(form)!,
      valorBaseInicial: base,
      dataInicio: dateInputToIso(form.depreciationStartDate)!,
    },
  });
}
