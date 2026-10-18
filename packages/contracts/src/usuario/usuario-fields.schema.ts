import * as z from "zod";
import { PerfilUsuarioSchema } from "../auth/identidade-autenticada.schema";
import { SenhaSchema } from "../auth/senha.schema";

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

export const SenhaInicialUsuarioSchema = SenhaSchema;

export { PerfilUsuarioSchema };
