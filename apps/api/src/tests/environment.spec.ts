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
});
