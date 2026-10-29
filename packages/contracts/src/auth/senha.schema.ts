import * as z from "zod";

export const SenhaSchema = z
  .string({ error: "A senha é obrigatória." })
  .refine((senha) => Array.from(senha).length >= 8, {
    error: "A senha deve possuir no mínimo 8 caracteres.",
  })
  .refine((senha) => /\p{L}/u.test(senha), {
    error: "A senha deve possuir no mínimo uma letra.",
  })
  .refine((senha) => /\p{N}/u.test(senha), {
    error: "A senha deve possuir no mínimo um número.",
  })
  .refine((senha) => /[\p{P}\p{S}]/u.test(senha), {
    error: "A senha deve possuir no mínimo um símbolo.",
  })
  .refine((senha) => Array.from(senha).length <= 128, {
    error: "A senha deve possuir no máximo 128 caracteres.",
  });
