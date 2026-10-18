import * as z from "zod";
import { PaginacaoQuerySchema } from "../common";
import {
  StatusPatrimonioSchema,
  TipoNumeroPatrimonialSchema,
} from "./patrimonio-fields.schema";

export const ListarPatrimoniosQuerySchema = PaginacaoQuerySchema.extend({
  busca: z
    .string()
    .trim()
    .min(1, { error: "A busca não pode ser vazia." })
    .max(200, { error: "A busca deve possuir no máximo 200 caracteres." })
    .optional(),
  status: StatusPatrimonioSchema.optional(),
  setorId: z.uuid().optional(),
  especieId: z.uuid().optional(),
  naturezaId: z.uuid().optional(),
  tipoNumeroPatrimonial: TipoNumeroPatrimonialSchema.optional(),
});

export type ListarPatrimoniosQueryInput = z.input<
  typeof ListarPatrimoniosQuerySchema
>;
export type ListarPatrimoniosQueryData = z.output<
  typeof ListarPatrimoniosQuerySchema
>;
