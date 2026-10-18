import type { ConfigService } from "@nestjs/config";
import nodemailer from "nodemailer";
import type { EnvironmentVariables } from "../../../environment";
import { SmtpEmailAdapter } from "../smtp-email.adapter";

jest.mock("nodemailer", () => ({
  __esModule: true,
  default: { createTransport: jest.fn() },
}));

describe("SmtpEmailAdapter", () => {
  const sendMail = jest.fn().mockResolvedValue({ messageId: "id" });
  const valores: Partial<EnvironmentVariables> = {
    AUTH_PASSWORD_RESET_ENABLED: true,
    SMTP_HOST: "smtp.example",
    SMTP_PORT: 587,
    SMTP_SECURE: false,
    SMTP_REQUIRE_TLS: true,
    SMTP_USER: "usuario",
    SMTP_PASSWORD: "senha",
    SMTP_FROM: "sipat@example.com",
  };
  const config = {
    getOrThrow: jest.fn((chave: keyof EnvironmentVariables) => valores[chave]),
  } as unknown as ConfigService<EnvironmentVariables, true>;

  beforeEach(() => {
    jest.clearAllMocks();
    (nodemailer.createTransport as jest.Mock).mockReturnValue({ sendMail });
  });

  it("exige TLS válido, desliga logs e limita fontes e destinatários", () => {
    new SmtpEmailAdapter(config);

    expect(nodemailer.createTransport).toHaveBeenCalledWith(
      expect.objectContaining({
        requireTLS: true,
        tls: { rejectUnauthorized: true },
        logger: false,
        debug: false,
        disableFileAccess: true,
        disableUrlAccess: true,
        maxRecipients: 1,
      }),
    );
  });

  it("envia uma única mensagem sem anexos ou conteúdo remoto", async () => {
    const adapter = new SmtpEmailAdapter(config);

    await adapter.enviar({
      tipo: "SENHA_REDEFINIDA",
      destinatario: "destinatario@example.com",
    });

    expect(sendMail).toHaveBeenCalledWith({
      from: "sipat@example.com",
      to: "destinatario@example.com",
      subject: "Senha do SIPAT redefinida",
      text: expect.not.stringContaining("http"),
    });
  });
});
