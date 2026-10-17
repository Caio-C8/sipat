import type { INestApplication } from "@nestjs/common";
import { CABECALHO_REQUISICAO_ID } from "./common/middleware/requisicao-id.middleware";
import { CABECALHO_CSRF } from "@repo/contracts";
import { parsearOrigensCors } from "./common/http/origens-cors";

export function configurarCors(
  app: INestApplication,
  origensConfiguradas: string,
) {
  const origens = parsearOrigensCors(origensConfiguradas);

  app.enableCors({
    origin: origens,
    credentials: false,
    methods: ["GET", "HEAD", "POST", "PUT", "PATCH", "DELETE"],
    allowedHeaders: ["Content-Type", CABECALHO_CSRF],
    exposedHeaders: [CABECALHO_REQUISICAO_ID],
  });
}
