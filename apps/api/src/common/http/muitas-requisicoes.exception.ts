import { HttpException, HttpStatus } from "@nestjs/common";

export class MuitasRequisicoesException extends HttpException {
  constructor(readonly retryAfterSeconds: number) {
    super(
      {
        codigo: "MUITAS_REQUISICOES",
        mensagem:
          "Muitas requisições foram realizadas. Tente novamente mais tarde.",
        erros: [],
      },
      HttpStatus.TOO_MANY_REQUESTS,
    );
  }
}
