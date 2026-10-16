import { z } from "zod";

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

  DATABASE_URL: z.string().min(1),
});

export type EnvironmentVariables = z.infer<typeof environmentSchema>;

export function validateEnvironment(
  configuration: Record<string, unknown>,
): EnvironmentVariables {
  return environmentSchema.parse(configuration);
}
