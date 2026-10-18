import * as z from "zod";
import { EmailUsuarioSchema } from "../usuario/usuario-fields.schema";
import { SenhaSchema } from "./senha.schema";

const TOKEN_REDEFINICAO_SENHA_PATTERN = /^[A-Za-z0-9_-]{42}[AEIMQUYcgkosw048]$/;

export const MENSAGEM_SOLICITACAO_REDEFINICAO_SENHA =
  "Se houver uma conta elegível, enviaremos as instruções para redefinir a senha.";

export const TokenRedefinicaoSenhaSchema = z
  .string({ error: "O token de redefinição é obrigatório." })
  .regex(TOKEN_REDEFINICAO_SENHA_PATTERN, {
    error:
      "O token de redefinição deve ser Base64url sem padding e representar 32 bytes.",
  });

export const SolicitarRedefinicaoSenhaBodySchema = z.strictObject({
  email: EmailUsuarioSchema,
});

export const RedefinirSenhaBodySchema = z
  .strictObject({
    token: TokenRedefinicaoSenhaSchema,
    novaSenha: SenhaSchema,
    confirmacaoNovaSenha: SenhaSchema,
  })
  .refine(
    ({ novaSenha, confirmacaoNovaSenha }) => novaSenha === confirmacaoNovaSenha,
    {
      error: "A confirmação da nova senha não corresponde à nova senha.",
      path: ["confirmacaoNovaSenha"],
    },
  );

export const SolicitarRedefinicaoSenhaResponseSchema = z.strictObject({
  status: z.literal(202),
  sucesso: z.literal(true),
  mensagem: z.literal(MENSAGEM_SOLICITACAO_REDEFINICAO_SENHA),
});

export type SolicitarRedefinicaoSenhaBodyInput = z.input<
  typeof SolicitarRedefinicaoSenhaBodySchema
>;
export type SolicitarRedefinicaoSenhaBody = z.output<
  typeof SolicitarRedefinicaoSenhaBodySchema
>;
export type RedefinirSenhaBodyInput = z.input<typeof RedefinirSenhaBodySchema>;
export type RedefinirSenhaBody = z.output<typeof RedefinirSenhaBodySchema>;
export type SolicitarRedefinicaoSenhaResponse = z.output<
  typeof SolicitarRedefinicaoSenhaResponseSchema
>;
