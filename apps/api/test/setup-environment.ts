import { mkdirSync, rmSync } from "node:fs";
import os from "node:os";
import path from "node:path";

process.env.NODE_ENV = "test";
process.env.APP_ENV = "test";
process.env.UPLOADS_ROOT_PATH ??= path.join(
  os.tmpdir(),
  `sipat-api-tests-${process.pid}`,
  "uploads",
);
mkdirSync(process.env.UPLOADS_ROOT_PATH, { recursive: true });
process.once("exit", () => {
  rmSync(path.dirname(process.env.UPLOADS_ROOT_PATH!), {
    recursive: true,
    force: true,
  });
});
process.env.AUTH_RATE_LIMIT_HMAC_SECRET ??=
  "MDEyMzQ1Njc4OWFiY2RlZjAxMjM0NTY3ODlhYmNkZWY";
process.env.AUTH_ARGON2_MAX_CONCURRENCY ??= "1";
process.env.AUTH_ARGON2_MAX_QUEUE ??= "2";
process.env.AUTH_PASSWORD_RESET_ENABLED ??= "true";
process.env.AUTH_PASSWORD_RESET_URL ??= "https://sipat.example/recuperar-senha";
process.env.AUTH_EMAIL_MAX_CONCURRENCY ??= "1";
process.env.AUTH_EMAIL_MAX_QUEUE ??= "2";
process.env.SMTP_HOST ??= "smtp.example";
process.env.SMTP_PORT ??= "587";
process.env.SMTP_SECURE ??= "false";
process.env.SMTP_REQUIRE_TLS ??= "true";
process.env.SMTP_USER ??= "usuario-teste";
process.env.SMTP_PASSWORD ??= "senha-teste";
process.env.SMTP_FROM ??= "sipat@example.com";
process.env.DATABASE_URL ??=
  "postgresql://test:test@localhost:5432/test?schema=public";
