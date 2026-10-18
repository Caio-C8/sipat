import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { MuitasRequisicoesException } from "../../common/http/muitas-requisicoes.exception";
import type { EnvironmentVariables } from "../../environment";

type TarefaPendente = () => void;

@Injectable()
export class CapacidadeArgon2 {
  private readonly maximoConcorrente: number;
  private readonly maximoFila: number;
  private emExecucao = 0;
  private readonly fila: TarefaPendente[] = [];

  constructor(config: ConfigService<EnvironmentVariables, true>) {
    this.maximoConcorrente = config.getOrThrow("AUTH_ARGON2_MAX_CONCURRENCY", {
      infer: true,
    });
    this.maximoFila = config.getOrThrow("AUTH_ARGON2_MAX_QUEUE", {
      infer: true,
    });
  }

  executar<T>(operacao: () => Promise<T>): Promise<T> {
    if (this.emExecucao < this.maximoConcorrente) {
      return this.iniciar(operacao);
    }

    if (this.fila.length >= this.maximoFila) {
      throw new MuitasRequisicoesException(1);
    }

    return new Promise<T>((resolve, reject) => {
      this.fila.push(() => {
        void this.iniciar(operacao).then(resolve, reject);
      });
    });
  }

  private async iniciar<T>(operacao: () => Promise<T>): Promise<T> {
    this.emExecucao += 1;

    try {
      return await operacao();
    } finally {
      this.emExecucao -= 1;
      this.fila.shift()?.();
    }
  }
}
