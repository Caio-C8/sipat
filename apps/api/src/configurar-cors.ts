import type { INestApplication } from "@nestjs/common";
import { CABECALHO_REQUISICAO_ID } from "./common/middleware/requisicao-id.middleware";

export function configurarCors(
  app: INestApplication,
  origensConfiguradas: string,
) {
  const origens = origensConfiguradas
    .split(",")
    .map((origem) => origem.trim())
    .filter(Boolean);

  app.enableCors({
    origin: origens,
    credentials: false,
    methods: ["GET", "HEAD", "POST", "PATCH", "DELETE"],
    allowedHeaders: ["Content-Type"],
    exposedHeaders: [CABECALHO_REQUISICAO_ID],
  });
}
