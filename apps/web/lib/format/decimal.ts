const DECIMAL_PATTERN = /^(?<sign>-?)(?<integer>\d+)(?:\.(?<fraction>\d+))?$/;

function parseDecimal(value: string) {
  const match = DECIMAL_PATTERN.exec(value.trim());
  if (!match?.groups) {
    throw new RangeError("Valor decimal inválido.");
  }

  const integer = match.groups.integer!.replace(/^0+(?=\d)/, "");
  return {
    negative: match.groups.sign === "-" && !/^0(?:\.0*)?$/.test(value.trim()),
    integer,
    fraction: match.groups.fraction ?? "",
  };
}

function toScaledInteger(value: string, scale: number): bigint {
  const decimal = parseDecimal(value);
  const discarded = decimal.fraction.slice(scale);
  if (/[^0]/.test(discarded)) {
    throw new RangeError(`O valor excede ${scale} casas decimais.`);
  }
  const digits = `${decimal.integer}${decimal.fraction.slice(0, scale).padEnd(scale, "0")}`;
  const scaled = BigInt(digits || "0");
  return decimal.negative ? -scaled : scaled;
}

function fromScaledInteger(value: bigint, scale: number): string {
  const negative = value < 0n;
  const digits = (negative ? -value : value)
    .toString()
    .padStart(scale + 1, "0");
  const integer = scale ? digits.slice(0, -scale) : digits;
  const fraction = scale ? `.${digits.slice(-scale)}` : "";
  return `${negative ? "-" : ""}${integer}${fraction}`;
}

function divideRounded(dividend: bigint, divisor: bigint): bigint {
  if (divisor === 0n) throw new RangeError("Divisão por zero.");
  const negative = dividend < 0n !== divisor < 0n;
  const left = dividend < 0n ? -dividend : dividend;
  const right = divisor < 0n ? -divisor : divisor;
  const rounded = (left + right / 2n) / right;
  return negative ? -rounded : rounded;
}

function formatDecimalBr(value: string, fractionDigits = 7): string {
  if (!Number.isInteger(fractionDigits) || fractionDigits < 0) {
    throw new RangeError("Quantidade de casas decimais inválida.");
  }

  const decimal = parseDecimal(value);
  if (/[^0]/.test(decimal.fraction.slice(fractionDigits))) {
    throw new RangeError(`O valor excede ${fractionDigits} casas decimais.`);
  }
  const grouped = decimal.integer.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  const fraction = decimal.fraction
    .slice(0, fractionDigits)
    .padEnd(fractionDigits, "0");

  return `${decimal.negative ? "-" : ""}${grouped}${fractionDigits ? `,${fraction}` : ""}`;
}

function subtractDecimal(left: string, right: string, scale = 7): string {
  return fromScaledInteger(
    toScaledInteger(left, scale) - toScaledInteger(right, scale),
    scale,
  );
}

function addDecimal(left: string, right: string, scale = 7): string {
  return fromScaledInteger(
    toScaledInteger(left, scale) + toScaledInteger(right, scale),
    scale,
  );
}

function compareDecimal(left: string, right: string, scale = 7): number {
  const difference =
    toScaledInteger(left, scale) - toScaledInteger(right, scale);
  return difference < 0n ? -1 : difference > 0n ? 1 : 0;
}

function multiplyDecimal(left: string, right: string, resultScale = 7): string {
  const leftDecimal = parseDecimal(left);
  const rightDecimal = parseDecimal(right);
  const leftScale = leftDecimal.fraction.length;
  const rightScale = rightDecimal.fraction.length;
  const product =
    toScaledInteger(left, leftScale) * toScaledInteger(right, rightScale);
  const productScale = leftScale + rightScale;
  const scaled =
    productScale <= resultScale
      ? product * 10n ** BigInt(resultScale - productScale)
      : divideRounded(product, 10n ** BigInt(productScale - resultScale));
  return fromScaledInteger(scaled, resultScale);
}

function divideDecimalByInteger(
  value: string,
  divisor: string,
  resultScale = 7,
): string {
  if (!/^\d+$/.test(divisor) || BigInt(divisor) === 0n) {
    throw new RangeError("Divisor inteiro inválido.");
  }
  const decimal = parseDecimal(value);
  const inputScale = decimal.fraction.length;
  const scaled = toScaledInteger(value, inputScale);
  const adjusted =
    inputScale <= resultScale
      ? scaled * 10n ** BigInt(resultScale - inputScale)
      : divideRounded(scaled, 10n ** BigInt(inputScale - resultScale));
  return fromScaledInteger(
    divideRounded(adjusted, BigInt(divisor)),
    resultScale,
  );
}

function formatBrl(value: string): string {
  return `R$ ${formatDecimalBr(value, 7)}`;
}

function normalizeBrlInput(value: string): {
  decimal: string;
  formatted: string;
} {
  const hasCurrencyPrefix = /^\s*R\$/i.test(value);
  const raw = value.replace(/^\s*R\$\s*/i, "").trim();
  const commaIndex = raw.lastIndexOf(",");
  const dotIndexes = [...raw.matchAll(/\./g)].map((match) => match.index ?? -1);
  const dotAsDecimal =
    commaIndex < 0 && !hasCurrencyPrefix && dotIndexes.length === 1;
  const separatorIndex =
    commaIndex >= 0 ? commaIndex : dotAsDecimal ? dotIndexes[0]! : -1;
  const integerRaw = separatorIndex >= 0 ? raw.slice(0, separatorIndex) : raw;
  const fractionRaw = separatorIndex >= 0 ? raw.slice(separatorIndex + 1) : "";
  const integer = integerRaw.replace(/\D/g, "").replace(/^0+(?=\d)/, "") || "0";
  const fraction = fractionRaw.replace(/\D/g, "").slice(0, 7);
  const grouped = integer.replace(/\B(?=(\d{3})+(?!\d))/g, ".");

  return {
    decimal: `${integer}${fraction ? `.${fraction}` : ""}`,
    formatted: `R$ ${grouped}${separatorIndex >= 0 ? `,${fraction}` : ""}`,
  };
}

function decimalToCentsDigits(value: string): string {
  const decimal = parseDecimal(value || "0");
  if (decimal.negative)
    throw new RangeError("O valor monetário não pode ser negativo.");
  return `${decimal.integer}${decimal.fraction.padEnd(2, "0").slice(0, 2)}`.replace(
    /^0+(?=\d)/,
    "",
  );
}

function centsDigitsToDecimal(digits: string): string {
  const normalized = digits.replace(/\D/g, "").replace(/^0+(?=\d)/, "") || "0";
  const padded = normalized.padStart(3, "0");
  const integer = padded.slice(0, -2).replace(/^0+(?=\d)/, "");
  return `${integer}.${padded.slice(-2)}`;
}

function formatBrlInput(value: string): string {
  const decimal = parseDecimal(value || "0");
  if (decimal.negative)
    throw new RangeError("O valor monetário não pode ser negativo.");
  if (decimal.fraction.length > 7)
    throw new RangeError("O valor excede 7 casas decimais.");
  const grouped = decimal.integer.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return `R$ ${grouped},${decimal.fraction.padEnd(2, "0")}`;
}

export {
  addDecimal,
  centsDigitsToDecimal,
  decimalToCentsDigits,
  formatBrl,
  formatBrlInput,
  formatDecimalBr,
  compareDecimal,
  divideDecimalByInteger,
  multiplyDecimal,
  normalizeBrlInput,
  subtractDecimal,
};
