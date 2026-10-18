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

const StringOpcionalSchema = z.preprocess(
  (valor) => (valor === "" ? undefined : valor),
  z.string().min(1).optional(),
);
const UrlOpcionalSchema = z.preprocess(
  (valor) => (valor === "" ? undefined : valor),
  z.url().optional(),
);
const PortaOpcionalSchema = z.preprocess(
  (valor) => (valor === "" ? undefined : valor),
  z.coerce.number().int().min(1).max(65_535).optional(),
);
const BooleanoOpcionalSchema = z.preprocess(
  (valor) => (valor === "" ? undefined : valor),
  z
    .enum(["true", "false"])
    .optional()
    .transform((valor) => (valor === undefined ? undefined : valor === "true")),
);

const HOSTS_HTTP_REDEFINICAO_DESENVOLVIMENTO = new Set([
  "localhost",
  "127.0.0.1",
  "[::1]",
]);

const environmentSchema = z
  .object({
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

    AUTH_PASSWORD_RESET_ENABLED: z
      .enum(["true", "false"])
      .default("false")
      .transform((valor) => valor === "true"),

    AUTH_PASSWORD_RESET_URL: UrlOpcionalSchema,

    AUTH_EMAIL_MAX_CONCURRENCY: z.coerce
      .number()
      .int()
      .min(1)
      .max(32)
      .default(2),

    AUTH_EMAIL_MAX_QUEUE: z.coerce
      .number()
      .int()
      .min(0)
      .max(1_000)
      .default(100),

    SMTP_HOST: StringOpcionalSchema,

    SMTP_PORT: PortaOpcionalSchema,

    SMTP_SECURE: BooleanoOpcionalSchema,

    SMTP_REQUIRE_TLS: BooleanoOpcionalSchema,

    SMTP_USER: StringOpcionalSchema,

    SMTP_PASSWORD: StringOpcionalSchema,

    SMTP_FROM: StringOpcionalSchema,

    DATABASE_URL: z.string().min(1),
  })
  .superRefine((ambiente, contexto) => {
    if (!ambiente.AUTH_PASSWORD_RESET_ENABLED) return;

    const urlRedefinicao = ambiente.AUTH_PASSWORD_RESET_URL
      ? new URL(ambiente.AUTH_PASSWORD_RESET_URL)
      : undefined;
    const usaHttps = urlRedefinicao?.protocol === "https:";
    const usaHttpLocalEmDesenvolvimento =
      ambiente.APP_ENV === "development" &&
      urlRedefinicao?.protocol === "http:" &&
      HOSTS_HTTP_REDEFINICAO_DESENVOLVIMENTO.has(urlRedefinicao.hostname);

    if (!usaHttps && !usaHttpLocalEmDesenvolvimento) {
      contexto.addIssue({
        code: "custom",
        path: ["AUTH_PASSWORD_RESET_URL"],
        message:
          "AUTH_PASSWORD_RESET_URL deve usar HTTPS; em development, HTTP é permitido somente para localhost ou loopback.",
      });
    }

    for (const chave of [
      "SMTP_HOST",
      "SMTP_PORT",
      "SMTP_SECURE",
      "SMTP_REQUIRE_TLS",
      "SMTP_USER",
      "SMTP_PASSWORD",
      "SMTP_FROM",
    ] as const) {
      if (ambiente[chave] === undefined) {
        contexto.addIssue({
          code: "custom",
          path: [chave],
          message: `${chave} é obrigatório quando a recuperação estiver habilitada.`,
        });
      }
    }

    if (
      (ambiente.APP_ENV === "staging" || ambiente.APP_ENV === "production") &&
      ambiente.SMTP_SECURE !== true &&
      ambiente.SMTP_REQUIRE_TLS !== true
    ) {
      contexto.addIssue({
        code: "custom",
        path: ["SMTP_REQUIRE_TLS"],
        message: "SMTP deve usar TLS obrigatório em staging e production.",
      });
    }
  });

export type EnvironmentVariables = z.infer<typeof environmentSchema>;

export function validateEnvironment(
  configuration: Record<string, unknown>,
): EnvironmentVariables {
  return environmentSchema.parse(configuration);
}
