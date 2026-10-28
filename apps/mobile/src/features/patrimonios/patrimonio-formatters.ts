import type {
  StatusPatrimonio,
  TipoIncorporacao,
  TipoNumeroPatrimonial,
} from "@repo/contracts";

const STATUS_LABELS: Record<StatusPatrimonio, string> = {
  ATIVO: "Ativo",
  BAIXADO: "Baixado",
  EMPRESTADO: "Emprestado",
  EM_MANUTENCAO: "Em manutenção",
};

const INCORPORATION_LABELS: Record<TipoIncorporacao, string> = {
  AQUISICAO: "Aquisição",
  DOACAO: "Doação",
  TRANSFERENCIA: "Transferência",
  CESSAO: "Cessão",
  COMODATO: "Comodato",
  PERMUTA: "Permuta",
  PRODUCAO_INTERNA: "Produção interna",
  OUTROS: "Outros",
};

export function formatPatrimonioNumber(
  value: string,
  type: TipoNumeroPatrimonial,
) {
  if (type === "SEM_NUMERO_OFICIAL") {
    return `SP-${value.replace(/^SP-/, "").padStart(6, "0")}`;
  }
  return value.padStart(6, "0");
}

export function formatStatus(value: StatusPatrimonio) {
  return STATUS_LABELS[value];
}

export function formatIncorporation(value: TipoIncorporacao) {
  return INCORPORATION_LABELS[value];
}

export function formatCivilDate(value: string) {
  const [year, month, day] = value.split("-");
  return year && month && day ? `${day}/${month}/${year}` : value;
}

function decimalToScaled(value: string, scale = 7) {
  const [integer, fraction = ""] = value.split(".");
  return BigInt(`${integer}${fraction.padEnd(scale, "0").slice(0, scale)}`);
}

function scaledToDecimal(value: bigint, scale = 7) {
  const sign = value < 0n ? "-" : "";
  const absolute = value < 0n ? -value : value;
  const digits = absolute.toString().padStart(scale + 1, "0");
  return `${sign}${digits.slice(0, -scale)}.${digits.slice(-scale)}`;
}

export function subtractDecimal(minuend: string, subtrahend: string) {
  return scaledToDecimal(
    decimalToScaled(minuend) - decimalToScaled(subtrahend),
  );
}

export function formatCurrency(value: string) {
  const negative = value.startsWith("-");
  const unsigned = negative ? value.slice(1) : value;
  const [integerPart = "0", fraction = ""] = unsigned.split(".");
  const padded = fraction.padEnd(3, "0");
  let cents = BigInt(integerPart) * 100n + BigInt(padded.slice(0, 2));
  if (Number(padded.charAt(2) || "0") >= 5) cents += 1n;
  const integer = (cents / 100n)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  const decimals = (cents % 100n).toString().padStart(2, "0");
  return `${negative ? "-" : ""}R$ ${integer},${decimals}`;
}
