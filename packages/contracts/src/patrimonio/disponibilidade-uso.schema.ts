import * as z from "zod";
import { ChaveIdempotenciaSchema, criarRespostaSucessoSchema } from "../common";
import { DataCivilSchema } from "./patrimonio-fields.schema";

const CompetenciaDisponibilidadeSchema = z
  .string()
  .regex(/^\d{4}-(?:0[1-9]|1[0-2])$/);

export const ConfirmarDisponibilidadeUsoBodySchema = z.strictObject({
  dataDisponibilidade: DataCivilSchema,
  chaveIdempotencia: ChaveIdempotenciaSchema,
});

export const DisponibilidadeUsoPatrimonioSchema = z.strictObject({
  id: z.uuid(),
  dataDisponibilidade: DataCivilSchema,
  primeiraCompetencia: CompetenciaDisponibilidadeSchema.nullable(),
  createdAt: z.iso.datetime({ precision: 3 }),
  createdBy: z.strictObject({ id: z.uuid(), nome: z.string().min(1).max(100) }),
});

export const ConfirmarDisponibilidadeUsoResponseSchema =
  criarRespostaSucessoSchema(DisponibilidadeUsoPatrimonioSchema);

export type ConfirmarDisponibilidadeUsoBodyData = z.output<
  typeof ConfirmarDisponibilidadeUsoBodySchema
>;
export type DisponibilidadeUsoPatrimonio = z.output<
  typeof DisponibilidadeUsoPatrimonioSchema
>;
export type ConfirmarDisponibilidadeUsoResponse = z.output<
  typeof ConfirmarDisponibilidadeUsoResponseSchema
>;
