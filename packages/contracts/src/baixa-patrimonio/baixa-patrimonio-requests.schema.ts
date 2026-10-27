import * as z from "zod";
import { DataCivilSchema } from "../patrimonio";
import {
  MotivoBaixaPatrimonioSchema,
  ObservacaoBaixaPatrimonioSchema,
  TipoBaixaPatrimonioSchema,
} from "./baixa-patrimonio-fields.schema";

export const BaixarPatrimonioDadosSchema = z.strictObject({
  dataBaixa: DataCivilSchema,
  tipo: TipoBaixaPatrimonioSchema,
  motivo: MotivoBaixaPatrimonioSchema,
  observacao: ObservacaoBaixaPatrimonioSchema.optional(),
  comissaoId: z.uuid({
    error: "O identificador da comissão deve ser um UUID válido.",
  }),
});

export type BaixarPatrimonioDadosInput = z.input<
  typeof BaixarPatrimonioDadosSchema
>;
export type BaixarPatrimonioDados = z.output<
  typeof BaixarPatrimonioDadosSchema
>;
