import * as z from "zod";
import { NumeroPatrimonialOficialSchema } from "./patrimonio-fields.schema";

export const SubstituirNumeroPatrimonialBodySchema = z.strictObject({
  numeroPatrimonioAtual: NumeroPatrimonialOficialSchema,
});

export type SubstituirNumeroPatrimonialBodyInput = z.input<
  typeof SubstituirNumeroPatrimonialBodySchema
>;
export type SubstituirNumeroPatrimonialBodyData = z.output<
  typeof SubstituirNumeroPatrimonialBodySchema
>;
