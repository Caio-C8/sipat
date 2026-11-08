import * as z from "zod";
import { ChaveIdempotenciaSchema, criarRespostaSucessoSchema } from "../common";
import { CompetenciaMensalSchema } from "../depreciacao-patrimonio/depreciacao-patrimonio-fields.schema";
import { DataCivilSchema } from "./patrimonio-fields.schema";
import { DisponibilidadeUsoPatrimonioSchema } from "./patrimonio-response.schema";

export const ConfirmarDisponibilidadeUsoBodySchema = z.strictObject({
  chaveIdempotencia: ChaveIdempotenciaSchema,
  dataDisponivelUso: DataCivilSchema,
});

export const ResultadoConfirmarDisponibilidadeUsoSchema = z.strictObject({
  disponibilidadeUso: DisponibilidadeUsoPatrimonioSchema,
  primeiraCompetencia: CompetenciaMensalSchema.nullable(),
});

export const ConfirmarDisponibilidadeUsoResponseSchema =
  criarRespostaSucessoSchema(ResultadoConfirmarDisponibilidadeUsoSchema);

export type ConfirmarDisponibilidadeUsoBodyInput = z.input<
  typeof ConfirmarDisponibilidadeUsoBodySchema
>;
export type ConfirmarDisponibilidadeUsoBodyData = z.output<
  typeof ConfirmarDisponibilidadeUsoBodySchema
>;
export type ResultadoConfirmarDisponibilidadeUso = z.output<
  typeof ResultadoConfirmarDisponibilidadeUsoSchema
>;
export type ConfirmarDisponibilidadeUsoResponse = z.output<
  typeof ConfirmarDisponibilidadeUsoResponseSchema
>;
