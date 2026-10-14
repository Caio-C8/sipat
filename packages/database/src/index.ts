import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

export function createDatabaseClient(
  databaseUrl = process.env.DATABASE_URL,
): PrismaClient {
  if (!databaseUrl) {
    throw new Error("DATABASE_URL is required to create a database client.");
  }

  const adapter = new PrismaPg({ connectionString: databaseUrl });
  return new PrismaClient({ adapter });
}

export { Prisma, PrismaClient } from "@prisma/client";
export type DatabaseClient = ReturnType<typeof createDatabaseClient>;
