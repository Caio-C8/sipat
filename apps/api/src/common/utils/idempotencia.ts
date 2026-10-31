import { createHash } from "node:crypto";
import {
  MENSAGENS_CONFLITO_IDEMPOTENCIA,
  type CodigoConflitoIdempotencia,
} from "@repo/contracts";

const UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

type ValorCanonico =
  | null
  | boolean
  | number
  | string
  | ValorCanonico[]
  | { [chave: string]: ValorCanonico };

function normalizarValor(valor: unknown): ValorCanonico | undefined {
  if (valor === undefined) return undefined;
  if (valor === null || typeof valor === "boolean") return valor;
  if (typeof valor === "string")
    return UUID.test(valor) ? valor.toLowerCase() : valor;
  if (typeof valor === "number") {
    if (!Number.isFinite(valor)) return null;
    return Object.is(valor, -0) ? 0 : valor;
  }
  if (typeof valor === "bigint") return valor.toString();
  if (valor instanceof Date) return valor.toISOString();
  if (
    typeof valor === "object" &&
    "toJSON" in valor &&
    typeof (valor as { toJSON?: unknown }).toJSON === "function"
  ) {
    return normalizarValor((valor as { toJSON(): unknown }).toJSON());
  }
  if (Array.isArray(valor)) {
    return valor.map((item) => normalizarValor(item) ?? null);
  }
  if (typeof valor === "object") {
    const registro = valor as Record<string, unknown>;
    const resultado: Record<string, ValorCanonico> = {};
    for (const chave of Object.keys(registro).sort()) {
      const normalizado = normalizarValor(registro[chave]);
      if (normalizado !== undefined) resultado[chave] = normalizado;
    }
    return resultado;
  }
  if (typeof valor === "function" || typeof valor === "symbol")
    return undefined;
  throw new TypeError(
    `Tipo não suportado na canonicalização: ${typeof valor}.`,
  );
}

export function canonicalizarIdempotencia(valor: unknown): string {
  return JSON.stringify(normalizarValor(valor) ?? null);
}

export function calcularHashIdempotencia(valor: unknown): string {
  return createHash("sha256")
    .update(canonicalizarIdempotencia(valor))
    .digest("hex");
}

export function calcularHashArquivo(conteudo: Buffer): string {
  return createHash("sha256").update(conteudo).digest("hex");
}

export function construirConflitoIdempotencia(
  codigo: CodigoConflitoIdempotencia,
) {
  const mensagem = MENSAGENS_CONFLITO_IDEMPOTENCIA[codigo];
  return {
    codigo,
    mensagem,
    erros: [{ campo: "chaveIdempotencia", codigo, mensagem }],
  } as const;
}
