import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import nodemailer, { type Transporter } from "nodemailer";
import type { EnvironmentVariables } from "../../environment";
import type { MensagemEmailAuth, PortaEmailAuth } from "./email.types";

@Injectable()
export class SmtpEmailAdapter implements PortaEmailAuth {
  private readonly transporter: Transporter | null;
  private readonly remetente: string | null;

  constructor(config: ConfigService<EnvironmentVariables, true>) {
    if (!config.getOrThrow("AUTH_PASSWORD_RESET_ENABLED", { infer: true })) {
      this.transporter = null;
      this.remetente = null;
      return;
    }

    this.remetente = config.getOrThrow("SMTP_FROM", { infer: true });
    this.transporter = nodemailer.createTransport({
      host: config.getOrThrow("SMTP_HOST", { infer: true }),
      port: config.getOrThrow("SMTP_PORT", { infer: true }),
      secure: config.getOrThrow("SMTP_SECURE", { infer: true }),
      requireTLS: config.getOrThrow("SMTP_REQUIRE_TLS", { infer: true }),
      auth: {
        user: config.getOrThrow("SMTP_USER", { infer: true }),
        pass: config.getOrThrow("SMTP_PASSWORD", { infer: true }),
      },
      tls: { rejectUnauthorized: true },
      logger: false,
      debug: false,
      disableFileAccess: true,
      disableUrlAccess: true,
      maxRecipients: 1,
    });
  }

  async enviar(mensagem: MensagemEmailAuth): Promise<void> {
    if (this.transporter === null || this.remetente === null) {
      throw new Error("O transporte SMTP de recuperação não está habilitado.");
    }

    await this.transporter.sendMail({
      from: this.remetente,
      to: mensagem.destinatario,
      subject:
        mensagem.tipo === "REDEFINIR_SENHA"
          ? "Redefinição de senha do SIPAT"
          : "Senha do SIPAT redefinida",
      text:
        mensagem.tipo === "REDEFINIR_SENHA"
          ? [
              "Foi solicitada uma redefinição da senha da sua conta no SIPAT.",
              `Acesse o link para definir uma nova senha: ${mensagem.link}`,
              "O link expira em 15 minutos e pode ser usado uma única vez.",
              "Se você não fez esta solicitação, ignore esta mensagem.",
            ].join("\n\n")
          : [
              "A senha da sua conta no SIPAT foi redefinida.",
              "Se você não realizou esta alteração, contate o suporte institucional.",
            ].join("\n\n"),
    });
  }
}
