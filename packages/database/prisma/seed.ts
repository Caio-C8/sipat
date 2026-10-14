import { createDatabaseClient } from "../src";

const database = createDatabaseClient();

async function main() {
  console.info("No seed data configured. Add project-specific records here.");
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await database.$disconnect();
  });
