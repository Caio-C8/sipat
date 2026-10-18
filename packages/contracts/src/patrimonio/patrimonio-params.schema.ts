import * as z from "zod";

export const PatrimonioParamsSchema = z.strictObject({
  patrimonioId: z.uuid({
    error: "O identificador do patrimônio deve ser um UUID válido.",
  }),
});

export type PatrimonioParamsInput = z.input<typeof PatrimonioParamsSchema>;
export type PatrimonioParamsData = z.output<typeof PatrimonioParamsSchema>;
