import * as z from "zod";
import { ChaveIdempotenciaSchema } from "../common";
import {
  DataCivilSchema,
  Decimal19_7PositivoSchema,
  Decimal19_7Schema,
  TipoIncorporacaoSchema,
} from "./patrimonio-fields.schema";

const TextoOpcionalSchema = (nome: string, limite: number) =>
  z
    .string()
    .trim()
    .min(1, { error: `${nome} não pode ser vazio.` })
    .max(limite, {
      error: `${nome} deve possuir no máximo ${limite} caracteres.`,
    })
    .optional();

const ParametrosDepreciacaoIniciaisSchema = z.strictObject(
  {
    metodo: z.literal("LINEAR"),
    vidaUtilInicialMeses: z.number().int().min(1).max(1_200, {
      error: "A vida útil inicial deve possuir no máximo 1200 meses.",
    }),
    percentualResidual: z
      .string()
      .regex(/^(?:0|[1-9]\d{0,2})(?:\.\d{1,2})?$/, {
        error:
          "O percentual residual deve ser uma string decimal com até 3 dígitos inteiros e 2 casas decimais.",
      })
      .optional(),
    valorResidual: Decimal19_7Schema,
    valorBaseInicial: Decimal19_7PositivoSchema,
    dataInicio: DataCivilSchema,
  },
  {
    error: (issue) =>
      issue.input === undefined
        ? "Os parâmetros iniciais de depreciação são obrigatórios."
        : undefined,
  },
);

export const CriarPatrimonioBodySchema = z.strictObject({
  chaveIdempotencia: ChaveIdempotenciaSchema,
  semNumeroOficial: z.boolean(),
  dataTombamento: DataCivilSchema,
  tipoIncorporacao: TipoIncorporacaoSchema,
  descricao: z
    .string()
    .trim()
    .min(1, { error: "A descrição é obrigatória." })
    .max(1_000, {
      error: "A descrição deve possuir no máximo 1000 caracteres.",
    }),
  marca: TextoOpcionalSchema("A marca", 100),
  modelo: TextoOpcionalSchema("O modelo", 100),
  numeroSerie: TextoOpcionalSchema("O número de série", 100),
  valorIncorporacao: Decimal19_7PositivoSchema,
  especieId: z.uuid(),
  setorAtualId: z.uuid(),
  processoCompraId: z.uuid().optional(),
  parametrosDepreciacao: ParametrosDepreciacaoIniciaisSchema,
});

export type CriarPatrimonioBodyInput = z.input<
  typeof CriarPatrimonioBodySchema
>;
export type CriarPatrimonioBodyData = z.output<
  typeof CriarPatrimonioBodySchema
>;
