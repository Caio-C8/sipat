import { createHmac } from "node:crypto";

export function criarChaveRateLimitLogin(
  emailNormalizado: string,
  segredoBase64url: string,
): string {
  return createHmac("sha256", Buffer.from(segredoBase64url, "base64url"))
    .update(emailNormalizado, "utf8")
    .digest("hex");
}
