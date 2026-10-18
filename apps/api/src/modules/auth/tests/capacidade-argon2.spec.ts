import type { ConfigService } from "@nestjs/config";
import { MuitasRequisicoesException } from "../../../common/http/muitas-requisicoes.exception";
import type { EnvironmentVariables } from "../../../environment";
import { CapacidadeArgon2 } from "../capacidade-argon2";

describe("CapacidadeArgon2", () => {
  function criarCapacidade(concorrencia: number, fila: number) {
    const config = {
      getOrThrow: jest.fn((chave: keyof EnvironmentVariables) => {
        if (chave === "AUTH_ARGON2_MAX_CONCURRENCY") return concorrencia;
        if (chave === "AUTH_ARGON2_MAX_QUEUE") return fila;
        throw new Error(`Configuração inesperada: ${chave}`);
      }),
    } as unknown as ConfigService<EnvironmentVariables, true>;

    return new CapacidadeArgon2(config);
  }

  it("limita concorrência, mantém fila finita e rejeita saturação", async () => {
    const capacidade = criarCapacidade(1, 1);
    let liberarPrimeira!: () => void;
    const primeira = capacidade.executar(
      () =>
        new Promise<void>((resolve) => {
          liberarPrimeira = resolve;
        }),
    );
    const segundaOperacao = jest.fn(async () => "segunda");
    const segunda = capacidade.executar(segundaOperacao);

    expect(segundaOperacao).not.toHaveBeenCalled();
    expect(() => capacidade.executar(async () => "terceira")).toThrow(
      MuitasRequisicoesException,
    );

    liberarPrimeira();
    await primeira;
    await expect(segunda).resolves.toBe("segunda");
    expect(segundaOperacao).toHaveBeenCalledTimes(1);
  });

  it("libera a vaga mesmo quando a operação falha", async () => {
    const capacidade = criarCapacidade(1, 0);

    await expect(
      capacidade.executar(async () => {
        throw new Error("falha controlada");
      }),
    ).rejects.toThrow("falha controlada");

    await expect(capacidade.executar(async () => "ok")).resolves.toBe("ok");
  });
});
