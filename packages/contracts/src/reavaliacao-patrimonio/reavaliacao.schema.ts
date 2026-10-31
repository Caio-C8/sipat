import * as z from "zod";
import {
  ChaveIdempotenciaSchema,
  CODIGOS_CONFLITO_IDEMPOTENCIA,
  PaginacaoQuerySchema,
  criarRespostaSucessoPaginadaSchema,
  criarRespostaSucessoSchema,
  ErroCampoSchema,
} from "../common";
import {
  DataCivilSchema,
  Decimal19_7PositivoSchema,
  Decimal19_7Schema,
  NumeroPatrimonialSchema,
  StatusPatrimonioSchema,
} from "../patrimonio";

export const LIMITE_ITENS_REAVALIACAO = 20;
const UuidSchema = z.uuid().transform((id) => id.toLowerCase());
const BuscaSchema = z.string().trim().min(1).max(200);
const DateTimeSchema = z.iso.datetime({ precision: 3 });
const PercentualSchema = z
  .string()
  .regex(/^(?:0|[1-9]\d?|100)(?:\.\d{1,2})?$/)
  .refine((valor) => Number(valor) <= 100);

export const ResidualReavaliacaoSchema = z.discriminatedUnion("tipo", [
  z.strictObject({ tipo: z.literal("VALOR"), valor: Decimal19_7Schema }),
  z.strictObject({
    tipo: z.literal("PERCENTUAL"),
    percentual: PercentualSchema,
  }),
]);

export const ItemReavaliacaoBodySchema = z.strictObject({
  patrimonioId: UuidSchema,
  valorReavaliado: Decimal19_7PositivoSchema,
  vidaUtilNovaMeses: z.number().int().min(1).max(1_200),
  residual: ResidualReavaliacaoSchema,
  definirPrimeiroParametro: z.literal(true).optional(),
});

const PedidoBaseSchema = z.strictObject({
  dataReferencia: DataCivilSchema,
  comissaoId: UuidSchema,
  itens: z
    .array(ItemReavaliacaoBodySchema)
    .min(1)
    .max(LIMITE_ITENS_REAVALIACAO),
});

function rejeitarDuplicatas(
  dados: { itens: { patrimonioId: string }[] },
  contexto: z.RefinementCtx,
) {
  const ids = new Set<string>();
  dados.itens.forEach((item, indice) => {
    if (ids.has(item.patrimonioId)) {
      contexto.addIssue({
        code: "custom",
        path: ["itens", indice, "patrimonioId"],
        message: "O patrimônio não pode ser repetido.",
      });
    }
    ids.add(item.patrimonioId);
  });
}

export const PreviaReavaliacaoBodySchema =
  PedidoBaseSchema.superRefine(rejeitarDuplicatas);
export const CriarReavaliacaoBodySchema = PedidoBaseSchema.extend({
  versaoPrevia: z.string().regex(/^[a-f0-9]{64}$/),
  chaveIdempotencia: ChaveIdempotenciaSchema,
}).superRefine(rejeitarDuplicatas);

export const ReavaliacaoParamsSchema = z.strictObject({
  reavaliacaoId: UuidSchema,
});
export const ListarReavaliacoesQuerySchema = PaginacaoQuerySchema.extend({
  busca: BuscaSchema.optional(),
  patrimonioId: UuidSchema.optional(),
  comissaoId: UuidSchema.optional(),
  dataInicio: DataCivilSchema.optional(),
  dataFim: DataCivilSchema.optional(),
}).superRefine((dados, contexto) => {
  if (dados.dataInicio && dados.dataFim && dados.dataInicio > dados.dataFim) {
    contexto.addIssue({
      code: "custom",
      path: ["dataFim"],
      message: "A data final não pode ser anterior à inicial.",
    });
  }
});
export const ListarOpcoesComissaoReavaliacaoQuerySchema =
  PaginacaoQuerySchema.extend({
    busca: BuscaSchema.optional(),
    dataReferencia: DataCivilSchema.optional(),
    contexto: z.enum(["REGISTRO", "FILTRO"]),
  });

const RelacionadoSchema = z.strictObject({
  id: z.uuid(),
  nome: z.string().min(1).max(150),
});
const PatrimonioHistoricoSchema = z.strictObject({
  id: z.uuid(),
  numeroPatrimonio: NumeroPatrimonialSchema.nullable(),
  descricao: z.string().min(1).max(1_000).nullable(),
});
const RelacionadoHistoricoSchema = z.strictObject({
  id: z.uuid(),
  nome: z.string().min(1).max(150).nullable(),
});
const ValoresAnterioresSchema = z.strictObject({
  valorBrutoAnterior: Decimal19_7Schema,
  depreciacaoAcumuladaAnterior: Decimal19_7Schema,
  valorLiquidoAnterior: Decimal19_7Schema,
  valorBaseAnterior: Decimal19_7Schema,
  valorResidualAnterior: Decimal19_7Schema,
  percentualResidualAnterior: PercentualSchema.nullable(),
  vidaUtilInicialAnteriorMeses: z.number().int().min(1),
  quantidadeDepreciacoesAnteriores: z.number().int().min(0),
  vidaUtilRestanteAnteriorMeses: z.number().int().min(0),
  parametroAnteriorId: z.uuid(),
});
const ValoresNovosSchema = z.strictObject({
  valorBrutoNovo: Decimal19_7Schema,
  valorBaseNova: Decimal19_7Schema,
  valorResidualNovo: Decimal19_7Schema,
  percentualResidualNovo: PercentualSchema.nullable(),
  vidaUtilNovaMeses: z.number().int().min(1).max(1_200),
});

export const ItemPreviaReavaliacaoSchema = z.strictObject({
  indice: z
    .number()
    .int()
    .min(0)
    .max(LIMITE_ITENS_REAVALIACAO - 1),
  patrimonioId: z.uuid(),
  elegivel: z.boolean(),
  erros: z.array(ErroCampoSchema).max(10),
  patrimonio: PatrimonioHistoricoSchema.nullable(),
  status: StatusPatrimonioSchema.nullable(),
  anterior: ValoresAnterioresSchema.nullable(),
  novo: ValoresNovosSchema.nullable(),
  quotaMensalInicialEstimada: Decimal19_7Schema.nullable(),
});
export const PreviaReavaliacaoSchema = z.strictObject({
  versaoPrevia: z
    .string()
    .regex(/^[a-f0-9]{64}$/)
    .nullable(),
  itens: z
    .array(ItemPreviaReavaliacaoSchema)
    .min(1)
    .max(LIMITE_ITENS_REAVALIACAO),
});

export const ReavaliacaoResumoSchema = z.strictObject({
  id: z.uuid(),
  dataReferencia: DataCivilSchema.nullable(),
  dataReavaliacao: DateTimeSchema,
  patrimonio: PatrimonioHistoricoSchema,
  comissao: RelacionadoHistoricoSchema,
  valorLiquidoAnterior: Decimal19_7Schema,
  valorBrutoNovo: Decimal19_7Schema,
  vidaUtilNovaMeses: z.number().int().min(1),
  valorResidualNovo: Decimal19_7Schema,
});
export const ReavaliacaoDetalheSchema = ReavaliacaoResumoSchema.extend({
  contabilAnterior: z
    .strictObject({
      valorBrutoAnterior: Decimal19_7Schema,
      depreciacaoAcumuladaAnterior: Decimal19_7Schema,
    })
    .nullable()
    .optional(),
  anterior: ValoresAnterioresSchema.nullable(),
  novo: ValoresNovosSchema.nullable(),
  parametroNovoId: z.uuid().nullable(),
  registradoPor: RelacionadoHistoricoSchema,
  createdAt: DateTimeSchema,
});
export const ComissaoOpcaoReavaliacaoSchema = RelacionadoSchema.extend({
  dataVigenciaInicio: DataCivilSchema,
  dataVigenciaFim: DataCivilSchema,
});

export const PreviaReavaliacaoResponseSchema = criarRespostaSucessoSchema(
  PreviaReavaliacaoSchema,
);
export const CriarReavaliacaoResponseSchema = criarRespostaSucessoSchema(
  z.array(ReavaliacaoDetalheSchema).min(1).max(LIMITE_ITENS_REAVALIACAO),
);
export const ConsultarReavaliacaoResponseSchema = criarRespostaSucessoSchema(
  ReavaliacaoDetalheSchema,
);
export const ListarReavaliacoesResponseSchema =
  criarRespostaSucessoPaginadaSchema(ReavaliacaoResumoSchema);
export const ListarOpcoesComissaoReavaliacaoResponseSchema =
  criarRespostaSucessoPaginadaSchema(ComissaoOpcaoReavaliacaoSchema);

export const CODIGOS_ERRO_REAVALIACAO = [
  "REAVALIACAO_NAO_ENCONTRADA",
  "PATRIMONIO_NAO_ENCONTRADO",
  "PATRIMONIO_BAIXADO",
  "ESTADO_CONTABIL_INCONSISTENTE",
  "PRIMEIRO_PARAMETRO_NECESSARIO",
  "DEPRECIACAO_CORRENTE_PENDENTE",
  "COMISSAO_NAO_ENCONTRADA",
  "COMISSAO_FORA_DA_VIGENCIA",
  "DATA_REFERENCIA_FORA_PERIODO",
  "ESTADO_REAVALIACAO_ALTERADO",
  "REAVALIACAO_IMPEDIDA",
  "VALOR_RESIDUAL_INVALIDO",
  ...CODIGOS_CONFLITO_IDEMPOTENCIA,
  "CONFLITO_CONCORRENTE_REAVALIACAO",
] as const;
export const CodigoErroReavaliacaoSchema = z.enum(CODIGOS_ERRO_REAVALIACAO);

export type PreviaReavaliacaoBodyData = z.output<
  typeof PreviaReavaliacaoBodySchema
>;
export type PreviaReavaliacaoBodyInput = z.input<
  typeof PreviaReavaliacaoBodySchema
>;
export type CriarReavaliacaoBodyData = z.output<
  typeof CriarReavaliacaoBodySchema
>;
export type CriarReavaliacaoBodyInput = z.input<
  typeof CriarReavaliacaoBodySchema
>;
export type ListarReavaliacoesQueryInput = z.input<
  typeof ListarReavaliacoesQuerySchema
>;
export type ListarOpcoesComissaoReavaliacaoQueryInput = z.input<
  typeof ListarOpcoesComissaoReavaliacaoQuerySchema
>;
export type ListarReavaliacoesQueryData = z.output<
  typeof ListarReavaliacoesQuerySchema
>;
export type ListarOpcoesComissaoReavaliacaoQueryData = z.output<
  typeof ListarOpcoesComissaoReavaliacaoQuerySchema
>;
export type PreviaReavaliacao = z.output<typeof PreviaReavaliacaoSchema>;
export type ReavaliacaoResumo = z.output<typeof ReavaliacaoResumoSchema>;
export type ReavaliacaoDetalhe = z.output<typeof ReavaliacaoDetalheSchema>;
export type ComissaoOpcaoReavaliacao = z.output<
  typeof ComissaoOpcaoReavaliacaoSchema
>;
export type PreviaReavaliacaoResponse = z.output<
  typeof PreviaReavaliacaoResponseSchema
>;
export type CriarReavaliacaoResponse = z.output<
  typeof CriarReavaliacaoResponseSchema
>;
export type ConsultarReavaliacaoResponse = z.output<
  typeof ConsultarReavaliacaoResponseSchema
>;
export type ListarReavaliacoesResponse = z.output<
  typeof ListarReavaliacoesResponseSchema
>;
export type ListarOpcoesComissaoReavaliacaoResponse = z.output<
  typeof ListarOpcoesComissaoReavaliacaoResponseSchema
>;
