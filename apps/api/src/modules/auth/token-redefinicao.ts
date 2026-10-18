import { createHash, randomBytes } from "node:crypto";

const TAMANHO_TOKEN_REDEFINICAO_BYTES = 32;

export function gerarTokenRedefinicaoSenha(): string {
  return randomBytes(TAMANHO_TOKEN_REDEFINICAO_BYTES).toString("base64url");
}

export function calcularHashTokenRedefinicaoSenha(token: string): string {
  return createHash("sha256").update(token, "utf8").digest("hex");
}
