import { Logger } from "@nestjs/common";
import type { ConfigService } from "@nestjs/config";
import type { EnvironmentVariables } from "../../../environment";
import { DespachanteEmailAuth } from "../despachante-email";
import type { PortaEmailAuth } from "../email.types";

describe("DespachanteEmailAuth", () => {
  const config = {
    getOrThrow: jest.fn((chave: keyof EnvironmentVariables) =>
      chave === "AUTH_EMAIL_MAX_CONCURRENCY" ? 1 : 1,
    ),
  } as unknown as ConfigService<EnvironmentVariables, true>;

  it("limita concorrência, fila e registra saturação sem dados sensíveis", async () => {
    let concluirPrimeiro!: () => void;
    const primeira = new Promise<void>((resolve) => {
      concluirPrimeiro = resolve;
    });
    const enviar = jest
      .fn()
      .mockReturnValueOnce(primeira)
      .mockResolvedValue(undefined);
    const warn = jest.spyOn(Logger.prototype, "warn").mockImplementation();
    const despachante = new DespachanteEmailAuth(
      { enviar } as PortaEmailAuth,
      config,
    );
    const mensagem = {
      tipo: "SENHA_REDEFINIDA" as const,
      destinatario: "segredo@example.com",
    };

    expect(despachante.despachar(mensagem)).toBe(true);
    expect(despachante.despachar(mensagem)).toBe(true);
    expect(despachante.despachar(mensagem)).toBe(false);
    expect(warn).toHaveBeenCalledWith("AUTH_EMAIL_QUEUE_SATURATED");
    expect(JSON.stringify(warn.mock.calls)).not.toContain(
      mensagem.destinatario,
    );

    concluirPrimeiro();
    await Promise.resolve();
    await Promise.resolve();
    expect(enviar).toHaveBeenCalledTimes(2);
  });

  it("absorve falha de envio e continua drenando a fila", async () => {
    const enviar = jest
      .fn()
      .mockRejectedValueOnce(new Error("segredo@example.com"))
      .mockResolvedValueOnce(undefined);
    const error = jest.spyOn(Logger.prototype, "error").mockImplementation();
    const despachante = new DespachanteEmailAuth(
      { enviar } as PortaEmailAuth,
      config,
    );
    const mensagem = {
      tipo: "SENHA_REDEFINIDA" as const,
      destinatario: "segredo@example.com",
    };

    despachante.despachar(mensagem);
    despachante.despachar(mensagem);
    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();

    expect(error).toHaveBeenCalledWith("AUTH_EMAIL_DELIVERY_FAILED");
    expect(JSON.stringify(error.mock.calls)).not.toContain(
      mensagem.destinatario,
    );
    expect(enviar).toHaveBeenCalledTimes(2);
  });
});
