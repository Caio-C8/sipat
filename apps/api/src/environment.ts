import { z } from "zod";

function possuiEntropiaAparenteAdequada(segredo: string): boolean {
  const bytes = Buffer.from(segredo, "base64url");
  const frequencias = new Map<number, number>();

  for (const byte of bytes) {
    frequencias.set(byte, (frequencias.get(byte) ?? 0) + 1);
  }

  const entropiaPorByte = [...frequencias.values()].reduce(
    (entropia, total) => {
      const probabilidade = total / bytes.length;
      return entropia - probabilidade * Math.log2(probabilidade);
    },
    0,
  );

  return entropiaPorByte >= 4;
}

const SegredoHmacRateLimitSchema = z
  .string()
  .regex(/^[A-Za-z0-9_-]{43}$/, {
    error:
      "AUTH_RATE_LIMIT_HMAC_SECRET deve ser Base64url sem padding com 32 bytes.",
  })
  .refine((segredo) => Buffer.from(segredo, "base64url").length === 32, {
    error:
      "AUTH_RATE_LIMIT_HMAC_SECRET deve ser Base64url sem padding com 32 bytes.",
  })
  .refine(possuiEntropiaAparenteAdequada, {
    error:
      "AUTH_RATE_LIMIT_HMAC_SECRET deve ser gerado aleatoriamente e possuir entropia adequada.",
  });

const environmentSchema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),

  APP_ENV: z
    .enum(["development", "staging", "production", "test"])
    .default("development"),

  APP_NAME: z.string().min(1).default("sipat"),

  APP_VERSION: z.string().min(1).default("0.1.0"),

  API_PORT: z.coerce.number().int().positive().default(3001),

  CORS_ORIGINS: z
    .string()
    .default("http://localhost:3000,http://localhost:8081"),

  AUTH_RATE_LIMIT_HMAC_SECRET: SegredoHmacRateLimitSchema,

  AUTH_ARGON2_MAX_CONCURRENCY: z.coerce.number().int().min(1).max(32),

  AUTH_ARGON2_MAX_QUEUE: z.coerce.number().int().min(0).max(1_000),

  DATABASE_URL: z.string().min(1),
});

export type EnvironmentVariables = z.infer<typeof environmentSchema>;

export function validateEnvironment(
  configuration: Record<string, unknown>,
): EnvironmentVariables {
  return environmentSchema.parse(configuration);
}
