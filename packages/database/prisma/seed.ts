import { createDatabaseClient } from "../src";

const database = createDatabaseClient();

async function main() {
  console.info("Nenhum dado inicial do SIPAT foi configurado.");
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await database.$disconnect();
  });
