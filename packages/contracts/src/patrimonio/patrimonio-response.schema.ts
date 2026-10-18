import * as z from "zod";
import {
  criarRespostaSucessoPaginadaSchema,
  criarRespostaSucessoSchema,
} from "../common";
import {
  DataCivilSchema,
  Decimal19_7Schema,
  NumeroPatrimonialSchema,
  StatusPatrimonioSchema,
  TipoIncorporacaoSchema,
  TipoNumeroPatrimonialSchema,
} from "./patrimonio-fields.schema";

const DateTimeUtcResponseSchema = z.iso.datetime({ precision: 3 });
const NomeRelacionadoSchema = z.string().trim().min(1).max(100);

const ResponsavelPatrimonioResponseSchema = z.strictObject({
  id: z.uuid(),
  nome: NomeRelacionadoSchema,
});

const SetorPatrimonioResponseSchema = z.strictObject({
  id: z.uuid(),
  nome: NomeRelacionadoSchema,
  responsavel: ResponsavelPatrimonioResponseSchema,
});

const NaturezaPatrimonioResponseSchema = z.strictObject({
  id: z.uuid(),
  nome: NomeRelacionadoSchema,
});

const EspeciePatrimonioResponseSchema = z.strictObject({
  id: z.uuid(),
  nome: NomeRelacionadoSchema,
  natureza: NaturezaPatrimonioResponseSchema,
});

const ProcessoCompraPatrimonioResponseSchema = z.strictObject({
  id: z.uuid(),
  numeroProcesso: z.string().min(1).max(50).nullable(),
  anoProcesso: z.number().int().min(1).max(9999).nullable(),
});

const SituacaoContabilPatrimonioResponseSchema = z.strictObject({
  valorBrutoAtual: Decimal19_7Schema,
  depreciacaoAcumuladaAtual: Decimal19_7Schema,
});

const ParametroDepreciacaoPatrimonioResponseSchema = z.strictObject({
  metodo: z.literal("LINEAR"),
  vidaUtilInicialMeses: z.number().int().min(1).max(1_200),
  percentualResidual: z
    .string()
    .regex(/^(?:0|[1-9]\d{0,2})(?:\.\d{1,2})?$/)
    .nullable(),
  valorResidual: Decimal19_7Schema,
  valorBaseInicial: Decimal19_7Schema,
  dataInicio: DataCivilSchema,
  dataFim: DataCivilSchema.nullable(),
});

export const PatrimonioResumoSchema = z
  .strictObject({
    id: z.uuid(),
    numeroPatrimonio: NumeroPatrimonialSchema,
    tipoNumeroPatrimonial: TipoNumeroPatrimonialSchema,
    descricao: z.string().min(1).max(1_000),
    marca: z.string().min(1).max(100).nullable(),
    modelo: z.string().min(1).max(100).nullable(),
    numeroSerie: z.string().min(1).max(100).nullable(),
    status: StatusPatrimonioSchema,
    setorAtual: SetorPatrimonioResponseSchema,
    especie: EspeciePatrimonioResponseSchema,
  })
  .superRefine((patrimonio, contexto) => {
    const numeroCompativel =
      patrimonio.tipoNumeroPatrimonial === "OFICIAL"
        ? /^[1-9]\d*$/.test(patrimonio.numeroPatrimonio)
        : /^SP-[1-9]\d*$/.test(patrimonio.numeroPatrimonio);

    if (!numeroCompativel) {
      contexto.addIssue({
        code: "custom",
        path: ["numeroPatrimonio"],
        message: "O número patrimonial não corresponde ao tipo informado.",
      });
    }
  });

export const PatrimonioDetalheSchema = PatrimonioResumoSchema.safeExtend({
  dataTombamento: DataCivilSchema,
  tipoIncorporacao: TipoIncorporacaoSchema,
  valorIncorporacao: Decimal19_7Schema,
  processoCompra: ProcessoCompraPatrimonioResponseSchema.nullable(),
  situacaoContabil: SituacaoContabilPatrimonioResponseSchema,
  parametroDepreciacaoAtual:
    ParametroDepreciacaoPatrimonioResponseSchema.nullable(),
  createdAt: DateTimeUtcResponseSchema,
  updatedAt: DateTimeUtcResponseSchema.nullable(),
});

export const ListarPatrimoniosResponseSchema =
  criarRespostaSucessoPaginadaSchema(PatrimonioResumoSchema);
export const CriarPatrimonioResponseSchema = criarRespostaSucessoSchema(
  PatrimonioDetalheSchema,
);
export const ConsultarPatrimonioResponseSchema = criarRespostaSucessoSchema(
  PatrimonioDetalheSchema,
);
export const SubstituirNumeroPatrimonialResponseSchema =
  criarRespostaSucessoSchema(PatrimonioDetalheSchema);

export type PatrimonioResumo = z.output<typeof PatrimonioResumoSchema>;
export type PatrimonioDetalhe = z.output<typeof PatrimonioDetalheSchema>;
export type ListarPatrimoniosResponse = z.output<
  typeof ListarPatrimoniosResponseSchema
>;
export type CriarPatrimonioResponse = z.output<
  typeof CriarPatrimonioResponseSchema
>;
export type ConsultarPatrimonioResponse = z.output<
  typeof ConsultarPatrimonioResponseSchema
>;
export type SubstituirNumeroPatrimonialResponse = z.output<
  typeof SubstituirNumeroPatrimonialResponseSchema
>;
