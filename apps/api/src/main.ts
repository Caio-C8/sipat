import { NestFactory } from "@nestjs/core";
import { ConfigService } from "@nestjs/config";
import { AppModule } from "./app.module";
import { configurarCors } from "./configurar-cors";
import type { EnvironmentVariables } from "./environment";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const config = app.get(ConfigService<EnvironmentVariables, true>);

  const port = config.getOrThrow("API_PORT", { infer: true });
  const origensCors = config.getOrThrow("CORS_ORIGINS", { infer: true });

  app.setGlobalPrefix("api");

  configurarCors(app, origensCors);

  app.enableShutdownHooks();

  await app.listen(port, "0.0.0.0");

  console.info(`API ready at http://localhost:${port}/api`);
}

void bootstrap();
