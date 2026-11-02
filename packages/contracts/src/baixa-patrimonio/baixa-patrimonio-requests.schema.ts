import * as z from "zod";
import { PaginacaoQuerySchema } from "../common";
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

export const ListarOpcoesComissoesBaixaQuerySchema =
  PaginacaoQuerySchema.extend({
    dataBaixa: DataCivilSchema,
    busca: z.string().trim().min(1).max(200).optional(),
  });

export type BaixarPatrimonioDadosInput = z.input<
  typeof BaixarPatrimonioDadosSchema
>;
export type BaixarPatrimonioDados = z.output<
  typeof BaixarPatrimonioDadosSchema
>;
export type ListarOpcoesComissoesBaixaQueryInput = z.input<
  typeof ListarOpcoesComissoesBaixaQuerySchema
>;
export type ListarOpcoesComissoesBaixaQueryData = z.output<
  typeof ListarOpcoesComissoesBaixaQuerySchema
>;
