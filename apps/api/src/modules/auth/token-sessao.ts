import type { AppEnvironment } from "@repo/contracts";
import { createHash, randomBytes } from "node:crypto";
import { DURACAO_ABSOLUTA_SESSAO_MS } from "./auth.constants";

const TOKEN_SESSAO_PATTERN = /^[A-Za-z0-9_-]{43}$/;

const COOKIE_SESSAO_LOCAL = "sipat_session";
const COOKIE_SESSAO_SEGURO = "__Host-sipat_session";

export interface OpcoesCookieSessao {
  readonly httpOnly: true;
  readonly sameSite: "strict";
  readonly secure: boolean;
  readonly path: "/";
  readonly maxAge?: number;
  readonly expires?: Date;
}

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

export function gerarTokenSessao(): string {
  return randomBytes(32).toString("base64url");
}

export function obterOpcoesCriacaoCookieSessao(
  ambiente: AppEnvironment,
): OpcoesCookieSessao {
  return {
    httpOnly: true,
    sameSite: "strict",
    secure: ambiente === "staging" || ambiente === "production",
    path: "/",
    maxAge: DURACAO_ABSOLUTA_SESSAO_MS,
  };
}

export function obterOpcoesExpiracaoCookieSessao(
  ambiente: AppEnvironment,
): OpcoesCookieSessao {
  return {
    httpOnly: true,
    sameSite: "strict",
    secure: ambiente === "staging" || ambiente === "production",
    path: "/",
    maxAge: 0,
    expires: new Date(0),
  };
}
