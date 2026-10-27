import * as z from "zod";
import { criarRespostaSucessoSchema } from "../common";
import { DataCivilSchema, NumeroPatrimonialSchema } from "../patrimonio";
import {
  MotivoBaixaPatrimonioSchema,
  ObservacaoBaixaPatrimonioSchema,
  TipoBaixaPatrimonioSchema,
} from "./baixa-patrimonio-fields.schema";

const DateTimeUtcResponseSchema = z.iso.datetime({ precision: 3 });
const NomeRelacionadoSchema = z.string().trim().min(1).max(150);

const PatrimonioBaixaResponseSchema = z.strictObject({
  id: z.uuid(),
  numeroPatrimonio: NumeroPatrimonialSchema,
  descricao: z.string().trim().min(1).max(1_000),
});

const ComissaoBaixaResponseSchema = z.strictObject({
  id: z.uuid(),
  nome: NomeRelacionadoSchema,
});

export const BaixaPatrimonioDetalheSchema = z
  .strictObject({
    id: z.uuid(),
    patrimonio: PatrimonioBaixaResponseSchema,
    comissao: ComissaoBaixaResponseSchema,
    tipo: TipoBaixaPatrimonioSchema,
    dataBaixa: DataCivilSchema,
    motivo: MotivoBaixaPatrimonioSchema,
    observacao: ObservacaoBaixaPatrimonioSchema.nullable(),
    createdById: z.uuid(),
    createdAt: DateTimeUtcResponseSchema,
    anexoUrl: z.string().nullable(),
  })
  .superRefine((baixa, contexto) => {
    const anexoUrlEsperada = `/api/patrimonios/${baixa.patrimonio.id}/baixa/anexo`;

    if (baixa.anexoUrl !== null && baixa.anexoUrl !== anexoUrlEsperada) {
      contexto.addIssue({
        code: "custom",
        path: ["anexoUrl"],
        message:
          "A URL do documento deve ser derivada do identificador do patrimônio.",
      });
    }
  });

export const BaixarPatrimonioResponseSchema = criarRespostaSucessoSchema(
  BaixaPatrimonioDetalheSchema,
);
export const ConsultarBaixaPatrimonioResponseSchema =
  criarRespostaSucessoSchema(BaixaPatrimonioDetalheSchema);

export type BaixaPatrimonioDetalhe = z.output<
  typeof BaixaPatrimonioDetalheSchema
>;
export type BaixarPatrimonioResponse = z.output<
  typeof BaixarPatrimonioResponseSchema
>;
export type ConsultarBaixaPatrimonioResponse = z.output<
  typeof ConsultarBaixaPatrimonioResponseSchema
>;
