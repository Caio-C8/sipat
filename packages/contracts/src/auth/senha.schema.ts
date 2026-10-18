import * as z from "zod";

export const SenhaSchema = z
  .string({ error: "A senha é obrigatória." })
  .refine((senha) => Array.from(senha).length >= 15, {
    error: "A senha deve possuir no mínimo 15 caracteres.",
  })
  .refine((senha) => Array.from(senha).length <= 128, {
    error: "A senha deve possuir no máximo 128 caracteres.",
  });
