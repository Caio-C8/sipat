import { createHmac } from "node:crypto";

export function criarChaveRateLimitLogin(
  emailNormalizado: string,
  segredoBase64url: string,
): string {
  return createHmac("sha256", Buffer.from(segredoBase64url, "base64url"))
    .update(emailNormalizado, "utf8")
    .digest("hex");
}

export function criarChaveRateLimitLoginMobile(
  emailNormalizado: string,
  segredoBase64url: string,
): string {
  return createHmac("sha256", Buffer.from(segredoBase64url, "base64url"))
    .update("mobile-login\0", "utf8")
    .update(emailNormalizado, "utf8")
    .digest("hex");
}

export function criarChaveRateLimitAlteracaoSenha(
  usuarioId: string,
  segredoBase64url: string,
): string {
  return createHmac("sha256", Buffer.from(segredoBase64url, "base64url"))
    .update("alterar-senha\0", "utf8")
    .update(usuarioId, "utf8")
    .digest("hex");
}

export function criarChaveRateLimitPrimeiroAcesso(
  usuarioId: string,
  segredoBase64url: string,
): string {
  return createHmac("sha256", Buffer.from(segredoBase64url, "base64url"))
    .update("concluir-primeiro-acesso\0", "utf8")
    .update(usuarioId, "utf8")
    .digest("hex");
}

export function criarChaveRateLimitRecuperacaoSenha(
  emailNormalizado: string,
  segredoBase64url: string,
): string {
  return createHmac("sha256", Buffer.from(segredoBase64url, "base64url"))
    .update("recuperar-senha\0", "utf8")
    .update(emailNormalizado, "utf8")
    .digest("hex");
}
