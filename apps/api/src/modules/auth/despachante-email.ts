import { Inject, Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import type { EnvironmentVariables } from "../../environment";
import {
  PORTA_EMAIL_AUTH,
  type MensagemEmailAuth,
  type PortaEmailAuth,
} from "./email.types";

@Injectable()
export class DespachanteEmailAuth {
  private readonly logger = new Logger(DespachanteEmailAuth.name);
  private readonly fila: MensagemEmailAuth[] = [];
  private readonly maximoConcorrente: number;
  private readonly maximoFila: number;
  private emExecucao = 0;

  constructor(
    @Inject(PORTA_EMAIL_AUTH) private readonly porta: PortaEmailAuth,
    config: ConfigService<EnvironmentVariables, true>,
  ) {
    this.maximoConcorrente = config.getOrThrow("AUTH_EMAIL_MAX_CONCURRENCY", {
      infer: true,
    });
    this.maximoFila = config.getOrThrow("AUTH_EMAIL_MAX_QUEUE", {
      infer: true,
    });
  }

  despachar(mensagem: MensagemEmailAuth): boolean {
    if (this.emExecucao < this.maximoConcorrente) {
      this.iniciar(mensagem);
      return true;
    }

    if (this.fila.length >= this.maximoFila) {
      this.logger.warn("AUTH_EMAIL_QUEUE_SATURATED");
      return false;
    }

    this.fila.push(mensagem);
    return true;
  }

  private iniciar(mensagem: MensagemEmailAuth): void {
    this.emExecucao += 1;
    void this.porta
      .enviar(mensagem)
      .catch(() => this.logger.error("AUTH_EMAIL_DELIVERY_FAILED"))
      .finally(() => {
        this.emExecucao -= 1;
        const proxima = this.fila.shift();
        if (proxima) this.iniciar(proxima);
      });
  }
}
