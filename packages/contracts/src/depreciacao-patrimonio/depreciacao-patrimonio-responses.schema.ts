import * as z from "zod";
import {
  criarRespostaSucessoPaginadaSchema,
  criarRespostaSucessoSchema,
} from "../common";
import {
  Decimal19_7Schema,
  NumeroPatrimonialSchema,
  StatusPatrimonioSchema,
} from "../patrimonio";
import {
  CompetenciaMensalSchema,
  MotivoInelegibilidadeDepreciacaoSchema,
} from "./depreciacao-patrimonio-fields.schema";

const DateTimeUtcDepreciacaoSchema = z.iso.datetime({ precision: 3 });
const ContagemDepreciacaoSchema = z.number().int().min(0);
const NomeRelacionadoSchema = z.string().trim().min(1).max(150);
const StatusPatrimonioDepreciavelSchema = StatusPatrimonioSchema.extract([
  "ATIVO",
  "EMPRESTADO",
  "EM_MANUTENCAO",
]);

const PatrimonioDepreciacaoResponseSchema = z.strictObject({
  id: z.uuid(),
  numeroPatrimonio: NumeroPatrimonialSchema,
  descricao: z.string().trim().min(1).max(1_000),
});

const ComissaoDepreciacaoResponseSchema = z.strictObject({
  id: z.uuid(),
  nome: NomeRelacionadoSchema,
});

export const ItemDepreciacaoPendenteSchema = z.strictObject({
  patrimonioId: z.uuid(),
  numeroPatrimonio: NumeroPatrimonialSchema,
  descricao: z.string().trim().min(1).max(1_000),
  status: StatusPatrimonioDepreciavelSchema,
  valorBrutoAtual: Decimal19_7Schema,
  depreciacaoAcumuladaAtual: Decimal19_7Schema,
  valorLiquidoAtual: Decimal19_7Schema,
  valorResidual: Decimal19_7Schema,
  vidaUtilRestanteMeses: z.number().int().min(1),
  quotaPrevista: Decimal19_7Schema,
  atingiraValorResidual: z.boolean(),
});

export const ResumoDepreciacoesPendentesSchema = z.strictObject({
  totalElegiveis: ContagemDepreciacaoSchema,
  totalNoValorResidual: ContagemDepreciacaoSchema,
});

export const ListarDepreciacoesPendentesResponseSchema =
  criarRespostaSucessoPaginadaSchema(ItemDepreciacaoPendenteSchema).safeExtend({
    resumo: ResumoDepreciacoesPendentesSchema,
  });

const DepreciacaoRealizadaSchema = z.strictObject({
  resultado: z.literal("DEPRECIADO"),
  id: z.uuid(),
  competencia: CompetenciaMensalSchema,
  dataDepreciacao: DateTimeUtcDepreciacaoSchema,
  valorContabilAnterior: Decimal19_7Schema,
  valorDepreciado: Decimal19_7Schema,
  valorContabilNovo: Decimal19_7Schema,
  patrimonio: PatrimonioDepreciacaoResponseSchema,
  comissao: ComissaoDepreciacaoResponseSchema,
  createdById: z.uuid(),
  createdAt: DateTimeUtcDepreciacaoSchema,
});

const DepreciacaoInelegivelSchema = z.strictObject({
  resultado: z.literal("INELEGIVEL"),
  motivo: MotivoInelegibilidadeDepreciacaoSchema,
});

export const ResultadoDepreciacaoIndividualSchema = z.discriminatedUnion(
  "resultado",
  [DepreciacaoRealizadaSchema, DepreciacaoInelegivelSchema],
);

export const ResultadoDepreciacoesEmMassaSchema = z.strictObject({
  competencia: CompetenciaMensalSchema,
  comissao: ComissaoDepreciacaoResponseSchema,
  dataDepreciacao: DateTimeUtcDepreciacaoSchema,
  quantidadeProcessada: ContagemDepreciacaoSchema,
  quantidadeAtingiuValorResidual: ContagemDepreciacaoSchema,
  quantidadesInelegiveis: z.strictObject({
    baixado: ContagemDepreciacaoSchema,
    semParametroVigente: ContagemDepreciacaoSchema,
    dataInicioNaoAtingida: ContagemDepreciacaoSchema,
    jaDepreciadoNaCompetencia: ContagemDepreciacaoSchema,
    valorResidualAtingido: ContagemDepreciacaoSchema,
  }),
});

export const ExecutarDepreciacaoPatrimonioResponseSchema =
  criarRespostaSucessoSchema(ResultadoDepreciacaoIndividualSchema);

export const ExecutarDepreciacoesEmMassaResponseSchema =
  criarRespostaSucessoSchema(ResultadoDepreciacoesEmMassaSchema);

export type ItemDepreciacaoPendente = z.output<
  typeof ItemDepreciacaoPendenteSchema
>;
export type ResumoDepreciacoesPendentes = z.output<
  typeof ResumoDepreciacoesPendentesSchema
>;
export type ListarDepreciacoesPendentesResponse = z.output<
  typeof ListarDepreciacoesPendentesResponseSchema
>;
export type ResultadoDepreciacaoIndividual = z.output<
  typeof ResultadoDepreciacaoIndividualSchema
>;
export type ResultadoDepreciacoesEmMassa = z.output<
  typeof ResultadoDepreciacoesEmMassaSchema
>;
export type ExecutarDepreciacaoPatrimonioResponse = z.output<
  typeof ExecutarDepreciacaoPatrimonioResponseSchema
>;
export type ExecutarDepreciacoesEmMassaResponse = z.output<
  typeof ExecutarDepreciacoesEmMassaResponseSchema
>;
