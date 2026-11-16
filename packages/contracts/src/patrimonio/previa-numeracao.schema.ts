import * as z from "zod";
import { criarRespostaSucessoSchema } from "../common";
import { NumeroPatrimonialSchema } from "./patrimonio-fields.schema";

export const PreviaNumeracaoPatrimonialSchema = z.strictObject({
  numeroOficial: NumeroPatrimonialSchema,
  numeroSemOficial: NumeroPatrimonialSchema,
  reservaValor: z.literal(false),
});

export const ConsultarPreviaNumeracaoPatrimonialResponseSchema =
  criarRespostaSucessoSchema(PreviaNumeracaoPatrimonialSchema);

export type PreviaNumeracaoPatrimonial = z.output<
  typeof PreviaNumeracaoPatrimonialSchema
>;

export type ConsultarPreviaNumeracaoPatrimonialResponse = z.output<
  typeof ConsultarPreviaNumeracaoPatrimonialResponseSchema
>;
