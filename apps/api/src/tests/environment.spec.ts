import { validateEnvironment } from "../environment";

const SEGREDO_TESTE = "MDEyMzQ1Njc4OWFiY2RlZjAxMjM0NTY3ODlhYmNkZWY";

function ambienteValido(): Record<string, unknown> {
  return {
    NODE_ENV: "test",
    APP_ENV: "test",
    APP_NAME: "sipat",
    APP_VERSION: "0.1.0",
    API_PORT: "3001",
    CORS_ORIGINS: "http://localhost:3000",
    AUTH_RATE_LIMIT_HMAC_SECRET: SEGREDO_TESTE,
    AUTH_ARGON2_MAX_CONCURRENCY: "2",
    AUTH_ARGON2_MAX_QUEUE: "10",
    DATABASE_URL: "postgresql://test:test@localhost:5432/test",
  };
}

describe("validateEnvironment", () => {
  it("aceita segredo HMAC de 32 bytes com diversidade e limites finitos", () => {
    expect(validateEnvironment(ambienteValido())).toEqual(
      expect.objectContaining({
        AUTH_RATE_LIMIT_HMAC_SECRET: SEGREDO_TESTE,
        AUTH_ARGON2_MAX_CONCURRENCY: 2,
        AUTH_ARGON2_MAX_QUEUE: 10,
        AUTH_PASSWORD_RESET_ENABLED: false,
        AUTH_EMAIL_MAX_CONCURRENCY: 2,
        AUTH_EMAIL_MAX_QUEUE: 100,
      }),
    );
  });

  it("aceita recuperação desabilitada com variáveis SMTP vazias do Compose", () => {
    expect(
      validateEnvironment({
        ...ambienteValido(),
        AUTH_PASSWORD_RESET_ENABLED: "false",
        AUTH_PASSWORD_RESET_URL: "",
        SMTP_HOST: "",
        SMTP_PORT: "",
        SMTP_USER: "",
        SMTP_PASSWORD: "",
        SMTP_FROM: "",
      }),
    ).toEqual(
      expect.objectContaining({
        AUTH_PASSWORD_RESET_ENABLED: false,
        AUTH_PASSWORD_RESET_URL: undefined,
        SMTP_HOST: undefined,
      }),
    );
  });

  it.each([
    ["curto", "abc"],
    ["previsível", "A".repeat(43)],
  ])("rejeita segredo HMAC %s", (_caso, segredo) => {
    expect(() =>
      validateEnvironment({
        ...ambienteValido(),
        AUTH_RATE_LIMIT_HMAC_SECRET: segredo,
      }),
    ).toThrow();
  });

  it.each([
    ["concorrência zero", { AUTH_ARGON2_MAX_CONCURRENCY: "0" }],
    ["concorrência excessiva", { AUTH_ARGON2_MAX_CONCURRENCY: "33" }],
    ["fila negativa", { AUTH_ARGON2_MAX_QUEUE: "-1" }],
    ["fila excessiva", { AUTH_ARGON2_MAX_QUEUE: "1001" }],
  ])("rejeita %s", (_caso, alteracao) => {
    expect(() =>
      validateEnvironment({ ...ambienteValido(), ...alteracao }),
    ).toThrow();
  });

  it("exige consumidor seguro e SMTP completo quando habilitado", () => {
    expect(() =>
      validateEnvironment({
        ...ambienteValido(),
        AUTH_PASSWORD_RESET_ENABLED: "true",
        AUTH_PASSWORD_RESET_URL: "http://localhost/redefinir-senha",
      }),
    ).toThrow();

    expect(
      validateEnvironment({
        ...ambienteValido(),
        AUTH_PASSWORD_RESET_ENABLED: "true",
        AUTH_PASSWORD_RESET_URL: "https://sipat.example/redefinir-senha",
        SMTP_HOST: "smtp.example",
        SMTP_PORT: "587",
        SMTP_SECURE: "false",
        SMTP_REQUIRE_TLS: "true",
        SMTP_USER: "usuario",
        SMTP_PASSWORD: "senha",
        SMTP_FROM: "SIPAT <sipat@example.com>",
      }),
    ).toEqual(
      expect.objectContaining({
        AUTH_PASSWORD_RESET_ENABLED: true,
        SMTP_PORT: 587,
        SMTP_SECURE: false,
        SMTP_REQUIRE_TLS: true,
      }),
    );
  });

  it("aceita HTTP local somente em development", () => {
    const smtp = {
      SMTP_HOST: "smtp.example",
      SMTP_PORT: "587",
      SMTP_SECURE: "false",
      SMTP_REQUIRE_TLS: "true",
      SMTP_USER: "usuario",
      SMTP_PASSWORD: "senha",
      SMTP_FROM: "SIPAT <sipat@example.com>",
    };

    expect(
      validateEnvironment({
        ...ambienteValido(),
        APP_ENV: "development",
        AUTH_PASSWORD_RESET_ENABLED: "true",
        AUTH_PASSWORD_RESET_URL: "http://localhost:3000/redefinir-senha",
        ...smtp,
      }),
    ).toEqual(
      expect.objectContaining({
        AUTH_PASSWORD_RESET_URL: "http://localhost:3000/redefinir-senha",
      }),
    );

    expect(() =>
      validateEnvironment({
        ...ambienteValido(),
        APP_ENV: "development",
        AUTH_PASSWORD_RESET_ENABLED: "true",
        AUTH_PASSWORD_RESET_URL: "http://sipat.example/redefinir-senha",
        ...smtp,
      }),
    ).toThrow();
  });

  it("rejeita SMTP sem TLS obrigatório em staging e production", () => {
    expect(() =>
      validateEnvironment({
        ...ambienteValido(),
        APP_ENV: "production",
        AUTH_PASSWORD_RESET_ENABLED: "true",
        AUTH_PASSWORD_RESET_URL: "https://sipat.example/redefinir-senha",
        SMTP_HOST: "smtp.example",
        SMTP_PORT: "587",
        SMTP_SECURE: "false",
        SMTP_REQUIRE_TLS: "false",
        SMTP_USER: "usuario",
        SMTP_PASSWORD: "senha",
        SMTP_FROM: "sipat@example.com",
      }),
    ).toThrow();
  });
});
