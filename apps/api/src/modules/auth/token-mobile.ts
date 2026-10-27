import { createHash, randomBytes } from "node:crypto";

const TOKEN_OPACO_PATTERN = /^[A-Za-z0-9_-]{43}$/;

export function gerarTokenMobile(): string {
  return randomBytes(32).toString("base64url");
}

export function calcularHashTokenMobile(token: unknown): string | null {
  if (typeof token !== "string" || !TOKEN_OPACO_PATTERN.test(token)) {
    return null;
  }

  return createHash("sha256").update(token, "utf8").digest("hex");
}

export function extrairBearer(headers: unknown): string | null {
  if (typeof headers !== "object" || headers === null) return null;
  const authorization = Reflect.get(headers, "authorization");
  if (typeof authorization !== "string") return null;
  const correspondencia = /^Bearer ([A-Za-z0-9_-]{43})$/.exec(authorization);
  return correspondencia?.[1] ?? null;
}

export function possuiAuthorization(headers: unknown): boolean {
  return (
    typeof headers === "object" &&
    headers !== null &&
    Reflect.get(headers, "authorization") !== undefined
  );
}
