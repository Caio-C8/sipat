import * as z from "zod";
import { PerfilUsuarioSchema } from "../auth/identidade-autenticada.schema";

export const NomeUsuarioSchema = z
  .string()
  .trim()
  .min(1, { error: "O nome do usuário é obrigatório." })
  .max(100, {
    error: "O nome do usuário deve possuir no máximo 100 caracteres.",
  });

export const EmailUsuarioSchema = z
  .string()
  .trim()
  .transform((email) => email.normalize("NFC").toLowerCase())
  .pipe(
    z
      .email({ error: "Informe um e-mail válido." })
      .max(150, { error: "O e-mail deve possuir no máximo 150 caracteres." }),
  );

export const SenhaInicialUsuarioSchema = z
  .string({ error: "A senha inicial é obrigatória." })
  .refine((senha) => Array.from(senha).length >= 15, {
    error: "A senha inicial deve possuir no mínimo 15 caracteres.",
  })
  .refine((senha) => Array.from(senha).length <= 128, {
    error: "A senha inicial deve possuir no máximo 128 caracteres.",
  });

export { PerfilUsuarioSchema };
