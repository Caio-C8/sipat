import * as z from "zod";
import { criarRespostaSucessoSchema } from "../common";
import { EmailUsuarioSchema } from "../usuario/usuario-fields.schema";
import { IdentidadeAutenticadaSchema } from "./identidade-autenticada.schema";

export const SenhaLoginSchema = z
  .string({ error: "A senha é obrigatória." })
  .refine((senha) => Array.from(senha).length >= 1, {
    error: "A senha é obrigatória.",
  })
  .refine((senha) => Array.from(senha).length <= 128, {
    error: "A senha deve possuir no máximo 128 caracteres.",
  });

export const LoginBodySchema = z.strictObject({
  email: EmailUsuarioSchema,
  senha: SenhaLoginSchema,
});

export const LoginResponseSchema = criarRespostaSucessoSchema(
  IdentidadeAutenticadaSchema,
);

export const AuthMeResponseSchema = criarRespostaSucessoSchema(
  IdentidadeAutenticadaSchema,
);

export type LoginBodyInput = z.input<typeof LoginBodySchema>;
export type LoginBody = z.output<typeof LoginBodySchema>;
export type LoginResponse = z.output<typeof LoginResponseSchema>;
export type AuthMeResponse = z.output<typeof AuthMeResponseSchema>;
