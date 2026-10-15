import { defineConfig } from "@prisma/config";

export default defineConfig({
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    url:
      process.env.DATABASE_URL ??
      "postgresql://sipat:sipat@localhost:5432/sipat?schema=public",
  },
});
