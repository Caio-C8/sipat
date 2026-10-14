import * as z from "zod";

const PaginaQuerySchema = z
  .string({
    error: "A página deve ser informada como um número inteiro.",
  })
  .regex(/^[0-9]+$/, {
    error: "A página deve conter somente dígitos.",
  })
  .transform((valor) => Number(valor))
  .pipe(
    z
      .number()
      .int({
        error: "A página deve ser um número inteiro.",
      })
      .min(1, {
        error: "A página deve ser maior ou igual a 1.",
      }),
  );

const LimiteQuerySchema = z
  .string({
    error: "O limite deve ser informado como um número inteiro.",
  })
  .regex(/^[0-9]+$/, {
    error: "O limite deve conter somente dígitos.",
  })
  .transform((valor) => Number(valor))
  .pipe(
    z
      .number()
      .int({
        error: "O limite deve ser um número inteiro.",
      })
      .min(1, {
        error: "O limite deve ser um número maior ou igual a 1.",
      })
      .max(50, {
        error: "O limite deve ser um número menor ou igual a 50.",
      }),
  );

export const PaginacaoQuerySchema = z.strictObject({
  pagina: PaginaQuerySchema.default(1),

  limite: LimiteQuerySchema.default(20),
});

export type PaginacaoQueryInput = z.input<typeof PaginacaoQuerySchema>;
export type PaginacaoQueryData = z.output<typeof PaginacaoQuerySchema>;
