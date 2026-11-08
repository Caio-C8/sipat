import * as z from "zod";

export const MOTIVOS_INELEGIBILIDADE_DEPRECIACAO = [
  "BAIXADO",
  "SEM_PARAMETRO_VIGENTE",
  "DATA_INICIO_NAO_ATINGIDA",
  "JA_DEPRECIADO_NA_COMPETENCIA",
  "VALOR_RESIDUAL_ATINGIDO",
] as const;

export const CODIGOS_ERRO_DEPRECIACAO_PATRIMONIO = [
  "COMPETENCIA_NAO_CORRENTE",
  "COMISSAO_INVALIDA",
  "CONFIRMACAO_VALOR_RESIDUAL_NECESSARIA",
  "ESTADO_CONTABIL_INCONSISTENTE",
  "CONFLITO_CONCORRENTE",
] as const;

export const CompetenciaMensalSchema = z
  .string({
    error:
      "A competência deve ser informada como uma string no formato AAAA-MM.",
  })
  .regex(/^\d{4}-(?:0[1-9]|1[0-2])$/, {
    error: "A competência deve usar o formato canônico AAAA-MM.",
  });

export const MotivoInelegibilidadeDepreciacaoSchema = z.enum(
  MOTIVOS_INELEGIBILIDADE_DEPRECIACAO,
);

export const CodigoErroDepreciacaoPatrimonioSchema = z.enum(
  CODIGOS_ERRO_DEPRECIACAO_PATRIMONIO,
);

export type CompetenciaMensal = z.output<typeof CompetenciaMensalSchema>;
export type MotivoInelegibilidadeDepreciacao = z.output<
  typeof MotivoInelegibilidadeDepreciacaoSchema
>;
export type CodigoErroDepreciacaoPatrimonio = z.output<
  typeof CodigoErroDepreciacaoPatrimonioSchema
>;
