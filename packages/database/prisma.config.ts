import { defineConfig } from "@prisma/config";

export default defineConfig({
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    url:
      process.env.DATABASE_URL ??
      "postgresql://app:app@localhost:5432/app?schema=public",
  },
});
