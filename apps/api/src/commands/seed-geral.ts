import "reflect-metadata";
import { Logger, type Type } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import {
  lerConfiguracaoSeedGeral,
  type ConfiguracaoSeedGeral,
} from "./seed-geral/seed-geral.config";

interface SeedGeralExecutor {
  executar(configuracao: ConfiguracaoSeedGeral): Promise<void>;
}

async function main() {
  const configuracao = lerConfiguracaoSeedGeral();
  // O carregamento tardio garante que ambientes proibidos falhem antes de
  // avaliar AppModule/ConfigModule e inicializar banco ou armazenamento.
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { SeedGeralModule } = require("./seed-geral/seed-geral.module") as {
    SeedGeralModule: Type<unknown>;
  };
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { SeedGeralService } = require("./seed-geral/seed-geral.service") as {
    SeedGeralService: Type<SeedGeralExecutor>;
  };
  const contexto = await NestFactory.createApplicationContext(SeedGeralModule, {
    logger: ["error", "warn", "log"],
  });
  try {
    const seed = contexto.get(SeedGeralService, { strict: false });
    await seed.executar(configuracao);
    Logger.log("Seed geral concluído e auditado com sucesso.", "SeedGeral");
  } finally {
    await contexto.close();
  }
}

main().catch((erro: unknown) => {
  Logger.error(
    erro instanceof Error
      ? erro.message
      : "Falha não identificada no seed geral.",
    undefined,
    "SeedGeral",
  );
  process.exitCode = 1;
});
