export type MensagemEmailAuth =
  | {
      tipo: "REDEFINIR_SENHA";
      destinatario: string;
      link: string;
    }
  | {
      tipo: "SENHA_REDEFINIDA";
      destinatario: string;
    };

export interface PortaEmailAuth {
  enviar(mensagem: MensagemEmailAuth): Promise<void>;
}

export const PORTA_EMAIL_AUTH = Symbol("PORTA_EMAIL_AUTH");
