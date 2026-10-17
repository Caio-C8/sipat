import type { AppEnvironment } from "@repo/contracts";
import { createHash } from "node:crypto";

const TOKEN_SESSAO_PATTERN = /^[A-Za-z0-9_-]{43}$/;

const COOKIE_SESSAO_LOCAL = "sipat_session";
const COOKIE_SESSAO_SEGURO = "__Host-sipat_session";

export function obterNomeCookieSessao(ambiente: AppEnvironment): string {
  return ambiente === "staging" || ambiente === "production"
    ? COOKIE_SESSAO_SEGURO
    : COOKIE_SESSAO_LOCAL;
}

export function extrairTokenSessao(
  cookies: unknown,
  ambiente: AppEnvironment,
): unknown {
  if (
    typeof cookies !== "object" ||
    cookies === null ||
    Array.isArray(cookies)
  ) {
    return undefined;
  }

  return Reflect.get(cookies, obterNomeCookieSessao(ambiente));
}

export function calcularHashTokenSessao(token: unknown): string | null {
  if (typeof token !== "string" || !TOKEN_SESSAO_PATTERN.test(token)) {
    return null;
  }

  return createHash("sha256").update(token, "utf8").digest("hex");
}
